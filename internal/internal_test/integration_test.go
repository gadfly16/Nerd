package internal_test

import (
	"os"
	"runtime"
	"testing"
	"time"

	"github.com/gadfly16/nerd/api"
	"github.com/gadfly16/nerd/api/nerd"
	"github.com/gadfly16/nerd/internal/tree"
	"github.com/gadfly16/nerd/sdk/msg"
	"github.com/gadfly16/nerd/sdk/node"
)

func TestIntegration(t *testing.T) {
	// Setup: Initialize and run tree
	testDB := "./test_integration.db"
	os.Remove(testDB)

	err := tree.InitInstance(testDB)
	if err != nil {
		t.Fatalf("Failed to initialize database: %v", err)
	}

	err = tree.Run(testDB)
	if err != nil {
		t.Fatalf("Failed to run tree: %v", err)
	}

	// Ensure tree shutdown for clean test isolation
	defer func() {
		err := api.IAskShutdown(1, 1) // Root node, user 1
		if err != nil {
			t.Logf("Shutdown error: %v", err)
		}
	}()

	// Phase 1: Create TestIntegration group under Root for test isolation
	t.Log("Phase 1: Creating TestIntegration group under Root")
	testGroupTag, err := api.IAskCreateChild(1, 1, nerd.GroupNode, "TestIntegration", nil) // Root node, user 1
	if err != nil {
		t.Fatalf("Failed to create TestIntegration group: %v", err)
	}
	testGroupID := testGroupTag.ID

	// Phase 2: Add "Projects" group under TestIntegration
	t.Log("Phase 2: Creating Projects group under TestIntegration")
	_, err = api.IAskCreateChild(testGroupID, 1, nerd.GroupNode, "Projects", nil)
	if err != nil {
		t.Fatalf("Failed to create Projects group: %v", err)
	}

	// Phase 3: Add children under TestIntegration/Projects
	// First get the tree to find Projects node ID
	testTree, err := api.IAskGetTree(testGroupID, 1) // TestIntegration, user 1
	if err != nil {
		t.Fatalf("Failed to get TestIntegration tree: %v", err)
	}

	// Find Projects node ID from tree structure
	t.Logf("Current TestIntegration tree structure:")
	t.Logf("  TestIntegration (%d) has %d children", testTree.NodeID, len(testTree.Children))
	for i, child := range testTree.Children {
		t.Logf("    Child %d: %s (%d)", i, child.Name, child.NodeID)
	}

	var projectsNodeID nerd.NodeID
	for _, child := range testTree.Children {
		if child.Name == "Projects" {
			projectsNodeID = child.NodeID
			break
		}
	}
	if projectsNodeID == 0 {
		t.Fatalf("Projects node not found in tree structure")
	}

	t.Log("Phase 3: Creating ProjectA and ProjectB under Projects")
	_, err = api.IAskCreateChild(projectsNodeID, 1, nerd.GroupNode, "ProjectA", nil)
	if err != nil {
		t.Fatalf("Failed to create ProjectA: %v", err)
	}

	_, err = api.IAskCreateChild(projectsNodeID, 1, nerd.GroupNode, "ProjectB", nil)
	if err != nil {
		t.Fatalf("Failed to create ProjectB: %v", err)
	}

	// Phase 4: Test name collision
	t.Log("Phase 4: Testing name collision")
	_, err = api.IAskCreateChild(projectsNodeID, 1, nerd.GroupNode, "ProjectA", nil) // Should collide with existing ProjectA
	if err == nil {
		t.Errorf("Expected name collision error, but creation succeeded")
	} else {
		t.Logf("Name collision correctly detected: %v", err)
	}

	// Phase 5: Test rename operation
	t.Log("Phase 5: Testing rename operation")
	err = api.IAskRenameChild(projectsNodeID, 1, "ProjectB", "ProjectBeta") // Projects node, user 1
	if err != nil {
		t.Fatalf("Failed to rename ProjectB to ProjectBeta: %v", err)
	}

	// Phase 6: Mid-test shutdown and state verification
	t.Log("Phase 6: Shutting down system and verifying clean state")

	// Record goroutine count before shutdown
	goroutinesBefore := runtime.NumGoroutine()
	t.Logf("Goroutines before shutdown: %d", goroutinesBefore)

	// Shutdown the entire tree
	err = api.IAskShutdown(1, 1) // Root node, user 1
	if err != nil {
		t.Fatalf("Failed to shutdown tree: %v", err)
	}

	// Verify system is in clean state after shutdown
	nodeCount := tree.RegCount()
	if nodeCount != 0 {
		t.Errorf("Expected 0 active nodes after shutdown, got %d", nodeCount)
	}

	if node.DB != nil {
		t.Error("Expected node.DB to be nil after shutdown")
	}

	// Check for goroutine cleanup (should be fewer than before)
	goroutinesAfter := runtime.NumGoroutine()
	t.Logf("Goroutines after shutdown: %d", goroutinesAfter)
	if goroutinesAfter >= goroutinesBefore {
		t.Errorf("Expected fewer goroutines after shutdown, before: %d, after: %d", goroutinesBefore, goroutinesAfter)
	}

	// Phase 7: Restart and verify persistence
	t.Log("Phase 7: Restarting system and verifying data persistence")

	// Restart the tree
	err = tree.Run(testDB)
	if err != nil {
		t.Fatalf("Failed to restart tree: %v", err)
	}

	// Phase 8: Final tree verification
	t.Log("Phase 8: Verifying final tree structure after restart")

	// Verify System node has TopoUpdater (runtime node)
	systemTree, err := api.IAskGetTree(2, 1) // System node, user 1
	if err != nil {
		t.Fatalf("Failed to get System tree: %v", err)
	}

	// System should have 1 child: TopoUpdater (runtime node, created on startup)
	if len(systemTree.Children) != 1 {
		t.Errorf("Expected System to have 1 child (TopoUpdater), got %d", len(systemTree.Children))
	}

	hasTopoUpdater := false
	for _, child := range systemTree.Children {
		if child.Name == "TopoUpdater" {
			hasTopoUpdater = true
			if child.NodeType != nerd.TopoUpdaterNode {
				t.Errorf("Expected TopoUpdater to be TopoUpdaterNode type, got %d", child.NodeType)
			}
		}
	}

	if !hasTopoUpdater {
		t.Error("TopoUpdater node not found under System")
	}

	// Verify TestIntegration structure
	testTreeFinal, err := api.IAskGetTree(testGroupID, 1) // TestIntegration, user 1
	if err != nil {
		t.Fatalf("Failed to get TestIntegration tree: %v", err)
	}

	// TestIntegration should have 1 child: Projects
	if len(testTreeFinal.Children) != 1 {
		t.Errorf("Expected TestIntegration to have 1 child, got %d", len(testTreeFinal.Children))
	}

	// Find Projects node
	var projectsNode *msg.TreeEntry
	for _, child := range testTreeFinal.Children {
		if child.Name == "Projects" {
			projectsNode = child
		}
	}

	if projectsNode == nil {
		t.Fatal("Projects node not found under TestIntegration")
	}

	// Projects should have 2 children: ProjectA and ProjectBeta (renamed from ProjectB)
	if len(projectsNode.Children) != 2 {
		t.Errorf("Expected Projects to have 2 children, got %d", len(projectsNode.Children))
	}

	hasProjectA, hasProjectBeta := false, false
	for _, child := range projectsNode.Children {
		switch child.Name {
		case "ProjectA":
			hasProjectA = true
		case "ProjectBeta":
			hasProjectBeta = true
		}
	}

	if !hasProjectA {
		t.Error("ProjectA node not found under Projects")
	}
	if !hasProjectBeta {
		t.Error("ProjectBeta node not found under Projects (rename may have failed)")
	}

	// Phase 9: Testing Lookup functionality
	t.Log("Phase 9: Testing Lookup functionality")

	// Test 1: Lookup ProjectA from Projects node (single level)
	projectATag, err := api.IAskLookup(projectsNodeID, 1, "ProjectA") // Projects node, user 1
	if err != nil {
		t.Fatalf("Failed to lookup ProjectA from Projects: %v", err)
	}
	t.Logf("Successfully looked up ProjectA from Projects node (ID: %d)", projectATag.ID)

	// Test 2: Lookup with multi-level path from Root (TestIntegration/Projects/ProjectBeta)
	projectBetaTag, err := api.IAskLookup(1, 1, "TestIntegration/Projects/ProjectBeta") // Root, user 1
	if err != nil {
		t.Fatalf("Failed to lookup TestIntegration/Projects/ProjectBeta from Root: %v", err)
	}
	t.Logf("Successfully looked up ProjectBeta via path TestIntegration/Projects/ProjectBeta from Root (ID: %d)", projectBetaTag.ID)

	// Test 3: Lookup non-existent path (TestIntegration/Projects/ProjectB - was renamed to ProjectBeta)
	_, err = api.IAskLookup(1, 1, "TestIntegration/Projects/ProjectB") // Root, user 1
	if err == nil {
		t.Fatal("Expected error for non-existent path TestIntegration/Projects/ProjectB, got nil")
	}
	t.Logf("Correctly returned error for non-existent path TestIntegration/Projects/ProjectB: %v", err)

	// Phase 10: Performance measurement for cache effectiveness
	t.Log("Phase 10: Measuring GetTree performance - first call vs cached call")

	// First call - should compute and cache
	start1 := time.Now()
	_, err = api.IAskGetTree(1, 1) // Root, user 1
	duration1 := time.Since(start1)
	if err != nil {
		t.Fatalf("Failed first GetTree call: %v", err)
	}

	// Second call - should return from cache
	start2 := time.Now()
	_, err = api.IAskGetTree(1, 1) // Root, user 1
	duration2 := time.Since(start2)
	if err != nil {
		t.Fatalf("Failed second GetTree call: %v", err)
	}

	t.Logf("First GetTree call (compute): %v", duration1)
	t.Logf("Second GetTree call (cached): %v", duration2)

	if duration2 < duration1 {
		speedup := float64(duration1) / float64(duration2)
		t.Logf("Cache speedup: %.2fx faster", speedup)
	} else {
		t.Logf("Cache performance: cached call took %v vs %v", duration2, duration1)
	}

	// Phase 11: Test DeleteChild functionality
	t.Log("Phase 11: Testing DeleteChild functionality")

	// Record node count before deletion
	nodeCountBefore := tree.RegCount()
	t.Logf("Node count before deletion: %d", nodeCountBefore)

	// Test 1: Delete a leaf node (ProjectA has no children)
	t.Log("Test 11.1: Deleting leaf node ProjectA")
	err = api.IAskDeleteChild(projectsNodeID, 1, projectATag.ID) // Projects node, user 1, delete ProjectA
	if err != nil {
		t.Fatalf("Failed to delete ProjectA node: %v", err)
	}

	// Verify node count decreased by 1
	nodeCountAfter := tree.RegCount()
	t.Logf("Node count after deletion: %d", nodeCountAfter)
	if nodeCountAfter != nodeCountBefore-1 {
		t.Errorf("Expected node count to decrease by 1, before: %d, after: %d", nodeCountBefore, nodeCountAfter)
	}

	// Verify ProjectA is gone from lookup
	_, err = api.IAskLookup(projectsNodeID, 1, "ProjectA") // Projects node, user 1
	if err == nil {
		t.Fatal("Expected error when looking up deleted ProjectA node, got nil")
	}
	t.Logf("Correctly returned error for deleted ProjectA node: %v", err)

	// Verify sending message to deleted node returns ErrNodeNotFound
	_, err = api.IAskGetTree(projectATag.ID, 1) // Try to get tree from deleted ProjectA node
	if err != nerd.ErrNodeNotFound {
		t.Fatalf("Expected ErrNodeNotFound when messaging deleted node, got: %v", err)
	}
	t.Logf("Correctly returned ErrNodeNotFound when messaging deleted node")

	// Test 2: Try to delete node with children (Projects still has ProjectBeta)
	t.Log("Test 11.2: Attempting to delete node with children (Projects)")
	err = api.IAskDeleteChild(testGroupID, 1, projectsNodeID) // TestIntegration, user 1, delete Projects
	if err == nil {
		t.Fatal("Expected error when deleting node with children, got nil")
	}
	t.Logf("Correctly returned error for deleting node with children: %v", err)

	// Test 3: Delete remaining child, then parent
	t.Log("Test 11.3: Deleting ProjectBeta, then Projects, then TestIntegration")

	// Delete ProjectBeta (we already deleted ProjectA in Test 1)
	err = api.IAskDeleteChild(projectsNodeID, 1, projectBetaTag.ID)
	if err != nil {
		t.Fatalf("Failed to delete ProjectBeta: %v", err)
	}

	// Now delete Projects (should succeed since children are gone)
	err = api.IAskDeleteChild(testGroupID, 1, projectsNodeID) // TestIntegration, user 1
	if err != nil {
		t.Fatalf("Failed to delete Projects after removing children: %v", err)
	}

	// Verify Projects is gone
	_, err = api.IAskLookup(testGroupID, 1, "Projects") // TestIntegration, user 1
	if err == nil {
		t.Fatal("Expected error when looking up deleted Projects node, got nil")
	}
	t.Logf("Successfully deleted Projects after removing children")

	// Now delete TestIntegration (should succeed since children are gone)
	err = api.IAskDeleteChild(1, 1, testGroupID) // Root, user 1
	if err != nil {
		t.Fatalf("Failed to delete TestIntegration after removing children: %v", err)
	}

	// Verify TestIntegration is gone
	_, err = api.IAskLookup(1, 1, "TestIntegration") // Root, user 1
	if err == nil {
		t.Fatal("Expected error when looking up deleted TestIntegration node, got nil")
	}
	t.Logf("Successfully deleted TestIntegration after removing children")

	// Test 4: Try to delete non-existent child
	t.Log("Test 11.4: Attempting to delete non-existent child")
	err = api.IAskDeleteChild(1, 1, 99999) // Root, user 1, invalid ID
	if err == nil {
		t.Fatal("Expected error when deleting non-existent child, got nil")
	}
	t.Logf("Correctly returned error for non-existent child: %v", err)

	t.Log("Integration test completed successfully")
}
