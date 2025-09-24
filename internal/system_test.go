package internal

import (
	"fmt"
	"os"
	"path/filepath"
	"testing"

	"github.com/gadfly16/nerd/internal/msg"
	"github.com/gadfly16/nerd/internal/nerd"
	"github.com/gadfly16/nerd/internal/nodes"
)

// TestTree manages a persistent test tree for system-level testing
type TestTree struct {
	Root   nerd.Node
	DBPath string
	Nodes  map[string]nerd.NodeID // Track nodes by name for easy reference
	t      *testing.T
}

// setupTestTree creates and initializes a persistent test tree
func setupTestTree(t *testing.T) *TestTree {
	// Create unique test database
	dbPath := filepath.Join(t.TempDir(), "system_test.db")

	// Initialize database
	err := nodes.InitDatabase(dbPath)
	if err != nil {
		t.Fatalf("Failed to initialize test database: %v", err)
	}

	// Initialize tree structure
	nerd.InitTree()

	// Create and start root node
	root := nodes.NewNode(nodes.RootNode)
	err = root.Save()
	if err != nil {
		t.Fatalf("Failed to save root node: %v", err)
	}

	root.Run()
	nerd.AddTag(root.GetTag())

	tree := &TestTree{
		Root:   root,
		DBPath: dbPath,
		Nodes:  make(map[string]nerd.NodeID),
		t:      t,
	}

	// Track root node
	tree.Nodes["root"] = root.GetID()

	return tree
}

// Shutdown gracefully shuts down the test tree
func (tt *TestTree) Shutdown() {
	rootTag := tt.Root.GetTag()
	_, err := rootTag.Ask(&nerd.Msg{Type: msg.Shutdown})
	if err != nil {
		tt.t.Errorf("Failed to shutdown test tree: %v", err)
	}

	// Clean up database file
	os.Remove(tt.DBPath)
}

// CreateChild creates a child node and tracks it by name
func (tt *TestTree) CreateChild(parentName string, nodeType nerd.NodeType) (nerd.NodeID, string) {
	parentID, exists := tt.Nodes[parentName]
	if !exists {
		tt.t.Fatalf("Parent node %s not found", parentName)
	}

	parentTag, exists := nerd.GetTag(parentID)
	if !exists {
		tt.t.Fatalf("Parent tag for %s not found in tree", parentName)
	}

	// Create child
	result, err := parentTag.Ask(&nerd.Msg{
		Type:    msg.CreateChild,
		Payload: nodeType,
	})
	if err != nil {
		tt.t.Fatalf("Failed to create child of %s: %v", parentName, err)
	}

	childTag := result.(*nerd.Tag)
	childID := childTag.NodeID

	// Determine child name (auto-generated)
	var childName string
	switch nodeType {
	case nodes.GroupNode:
		childName = fmt.Sprintf("New Group #%d", childID)
	default:
		childName = fmt.Sprintf("New Node #%d", childID)
	}

	// Track the child
	tt.Nodes[childName] = childID

	return childID, childName
}

// RenameChild renames a child node and updates tracking
func (tt *TestTree) RenameChild(parentName, oldName, newName string) {
	parentID, exists := tt.Nodes[parentName]
	if !exists {
		tt.t.Fatalf("Parent node %s not found", parentName)
	}

	parentTag, exists := nerd.GetTag(parentID)
	if !exists {
		tt.t.Fatalf("Parent tag for %s not found in tree", parentName)
	}

	// Rename child
	_, err := parentTag.Ask(&nerd.Msg{
		Type: msg.RenameChild,
		Payload: msg.RenameChildPayload{
			OldName: oldName,
			NewName: newName,
		},
	})
	if err != nil {
		tt.t.Fatalf("Failed to rename %s to %s: %v", oldName, newName, err)
	}

	// Update tracking
	if childID, exists := tt.Nodes[oldName]; exists {
		delete(tt.Nodes, oldName)
		tt.Nodes[newName] = childID
	}
}

// VerifyNodeCount checks that the expected number of nodes exist in memory and database
func (tt *TestTree) VerifyNodeCount(expected int) {
	// Check in-memory tree
	actualCount := nerd.GetNodeCount() // This function needs to be added to nerd package
	if actualCount != expected {
		tt.t.Errorf("Expected %d nodes in tree, got %d", expected, actualCount)
	}

	// TODO: Check database count as well
	// This would require a helper function to query the database
}

// VerifyNodeExists checks that a tracked node exists and is responsive
func (tt *TestTree) VerifyNodeExists(name string) {
	nodeID, exists := tt.Nodes[name]
	if !exists {
		tt.t.Errorf("Node %s not found in tracking", name)
		return
	}

	tag, exists := nerd.GetTag(nodeID)
	if !exists {
		tt.t.Errorf("Node %s (ID: %d) not found in tree", name, nodeID)
		return
	}

	// Verify node is responsive (this is a basic ping)
	// We could send a simple message to verify it's alive
	_ = tag // For now, just check it exists
}

// TestSystemWorkflow runs the complete system test workflow
func TestSystemWorkflow(t *testing.T) {
	tree := setupTestTree(t)
	defer tree.Shutdown()

	// Run incremental tests that build on each other
	t.Run("01_BootstrapVerification", func(t *testing.T) {
		testBootstrapState(t, tree)
	})

	t.Run("02_BasicOperations", func(t *testing.T) {
		testBasicOperations(t, tree)
	})

	t.Run("03_RenameOperations", func(t *testing.T) {
		testRenameOperations(t, tree)
	})

	t.Run("04_ErrorScenarios", func(t *testing.T) {
		testErrorScenarios(t, tree)
	})

	t.Run("05_ComplexWorkflows", func(t *testing.T) {
		testComplexWorkflows(t, tree)
	})
}

func testBootstrapState(t *testing.T, tree *TestTree) {
	// Verify initial state: Root node only
	tree.VerifyNodeCount(1)
	tree.VerifyNodeExists("root")

	t.Log("✓ Bootstrap state verified")
}

func testBasicOperations(t *testing.T, tree *TestTree) {
	// Create first child (should be "System" from init)
	childID, childName := tree.CreateChild("root", nodes.GroupNode)
	t.Logf("Created child: %s (ID: %d)", childName, childID)

	// Rename to "System" (matching init behavior)
	tree.RenameChild("root", childName, "System")

	// Verify tree structure
	tree.VerifyNodeCount(2)
	tree.VerifyNodeExists("root")
	tree.VerifyNodeExists("System")

	t.Log("✓ Basic operations completed")
}

func testRenameOperations(t *testing.T, tree *TestTree) {
	// Create another child for rename testing
	_, childName := tree.CreateChild("root", nodes.GroupNode)

	// Test various rename scenarios
	tree.RenameChild("root", childName, "Workspace")
	tree.RenameChild("root", "Workspace", "Development")

	tree.VerifyNodeExists("Development")
	tree.VerifyNodeCount(3)

	t.Log("✓ Rename operations completed")
}

func testErrorScenarios(t *testing.T, tree *TestTree) {
	// Test rename to existing name (should fail)
	parentTag, _ := nerd.GetTag(tree.Nodes["root"])
	_, err := parentTag.Ask(&nerd.Msg{
		Type: msg.RenameChild,
		Payload: msg.RenameChildPayload{
			OldName: "Development",
			NewName: "System", // Already exists
		},
	})

	if err != nerd.ErrNameCollision {
		t.Errorf("Expected name collision error, got: %v", err)
	}

	// Test rename non-existent child (should fail)
	_, err = parentTag.Ask(&nerd.Msg{
		Type: msg.RenameChild,
		Payload: msg.RenameChildPayload{
			OldName: "NonExistent",
			NewName: "SomeName",
		},
	})

	if err != nerd.ErrNodeNotFound {
		t.Errorf("Expected node not found error, got: %v", err)
	}

	t.Log("✓ Error scenarios handled correctly")
}

func testComplexWorkflows(t *testing.T, tree *TestTree) {
	// Create multiple children and perform complex operations
	for i := 0; i < 3; i++ {
		childID, childName := tree.CreateChild("System", nodes.GroupNode)
		newName := fmt.Sprintf("Project_%d", i)
		tree.RenameChild("System", childName, newName)
		t.Logf("Created and renamed: %s (ID: %d)", newName, childID)
	}

	// Verify complex tree structure
	expectedNodes := 6 // root + System + Development + 3 projects
	tree.VerifyNodeCount(expectedNodes)

	// Verify all tracked nodes exist
	for name := range tree.Nodes {
		tree.VerifyNodeExists(name)
	}

	t.Log("✓ Complex workflows completed")
}
