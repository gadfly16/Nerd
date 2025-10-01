package internal_test

import (
	"os"
	"testing"

	"github.com/gadfly16/nerd/api/msg"
	"github.com/gadfly16/nerd/internal/httpmsg"
	"github.com/gadfly16/nerd/internal/tree"
)

func TestGetTree(t *testing.T) {
	// Step 1: Initialize database with test data
	testDB := "./test_gettree.db"
	defer os.Remove(testDB) // Cleanup

	err := tree.InitInstance(testDB)
	if err != nil {
		t.Fatalf("Failed to initialize database: %v", err)
	}

	// Step 2: Run the tree (load and start nodes)
	err = tree.Run(testDB)
	if err != nil {
		t.Fatalf("Failed to run tree: %v", err)
	}

	// Ensure tree shutdown for clean test isolation
	defer func() {
		_, err := tree.AskNode(httpmsg.HttpMsg{
			Type:     httpmsg.HttpShutdown,
			TargetID: 1, // Root node
			UserID:   1,
			Payload:  map[string]any{},
		})
		if err != nil {
			t.Logf("Shutdown error: %v", err)
		}
	}()

	// Step 3: Send GetTree message to root node (ID=1) via HTTP adapter
	httpMsg := httpmsg.HttpMsg{
		Type:     httpmsg.HttpGetTree,
		TargetID: 1,                // Root node ID
		UserID:   1,                // Using root as user for now
		Payload:  map[string]any{}, // No payload needed - always returns full tree
	}

	result, err := tree.AskNode(httpMsg)
	if err != nil {
		t.Fatalf("Failed to get tree: %v", err)
	}

	// Step 4: Verify response is a TreeEntry
	treeEntry, ok := result.(*msg.TreeEntry)
	if !ok {
		t.Fatalf("Expected *msg.TreeEntry, got %T", result)
	}

	// Step 5: Validate tree structure
	if treeEntry.Name != "Root" {
		t.Errorf("Expected root name 'Root', got '%s'", treeEntry.Name)
	}

	if len(treeEntry.Children) != 1 {
		t.Errorf("Expected 1 child, got %d", len(treeEntry.Children))
	}

	if len(treeEntry.Children) > 0 && treeEntry.Children[0].Name != "System" {
		t.Errorf("Expected child name 'System', got '%s'", treeEntry.Children[0].Name)
	}

	t.Logf("GetTree test passed! Tree structure: %s -> %s", treeEntry.Name, treeEntry.Children[0].Name)
}
