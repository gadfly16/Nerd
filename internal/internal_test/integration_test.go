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
	defer os.Remove(testDB)

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

	// Phase 1: Add "Projects" group under Root
	t.Log("Phase 1: Creating Projects group under Root")
	_, err = api.IAskCreateChild(1, 1, nerd.GroupNode, "Projects", nil) // Root node, user 1
	if err != nil {
		t.Fatalf("Failed to create Projects group: %v", err)
	}

	// Phase 2: Add children under System
	t.Log("Phase 2: Creating Config and Logs under System")
	_, err = api.IAskCreateChild(2, 1, nerd.GroupNode, "Config", nil) // System node, user 1
	if err != nil {
		t.Fatalf("Failed to create Config group: %v", err)
	}

	_, err = api.IAskCreateChild(2, 1, nerd.GroupNode, "Logs", nil) // System node, user 1
	if err != nil {
		t.Fatalf("Failed to create Logs group: %v", err)
	}

	// Phase 3: Add children under Projects (need to find Projects node ID)
	// First get the tree to find Projects node ID
	treeEntry, err := api.IAskGetTree(1, 1) // Root, user 1
	if err != nil {
		t.Fatalf("Failed to get tree: %v", err)
	}

	// Find Projects node ID from tree structure
	t.Logf("Current tree structure after phase 2:")
	t.Logf("  Root (%d) has %d children", treeEntry.NodeID, len(treeEntry.Children))
	for i, child := range treeEntry.Children {
		t.Logf("    Child %d: %s (%d)", i, child.Name, child.NodeID)
	}

	var projectsNodeID nerd.NodeID
	for _, child := range treeEntry.Children {
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
	_, err = api.IAskCreateChild(2, 1, nerd.GroupNode, "Config", nil) // System node, user 1 - should collide
	if err == nil {
		t.Errorf("Expected name collision error, but creation succeeded")
	} else {
		t.Logf("Name collision correctly detected: %v", err)
	}

	// Phase 5: Test rename operation
	t.Log("Phase 5: Testing rename operation")
	err = api.IAskRenameChild(2, 1, "Logs", "SystemLogs") // System node, user 1
	if err != nil {
		t.Fatalf("Failed to rename Logs to SystemLogs: %v", err)
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
	nodeCount := msg.RegCount()
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
	finalTree, err := api.IAskGetTree(1, 1) // Root, user 1
	if err != nil {
		t.Fatalf("Failed to get final tree: %v", err)
	}

	// Verify the final tree structure

	// Root should have 3 children: System, Projects, and Authenticator
	if len(finalTree.Children) != 3 {
		t.Errorf("Expected Root to have 3 children, got %d", len(finalTree.Children))
	}

	// Find System and Projects nodes
	var systemNode, projectsNode *msg.TreeEntry
	for _, child := range finalTree.Children {
		switch child.Name {
		case "System":
			systemNode = child
		case "Projects":
			projectsNode = child
		}
	}

	if systemNode == nil {
		t.Error("System node not found in final tree")
	} else {
		// System should have 2 children: Config and SystemLogs (renamed from Logs)
		if len(systemNode.Children) != 2 {
			t.Errorf("Expected System to have 2 children, got %d", len(systemNode.Children))
		}

		hasConfig, hasSystemLogs := false, false
		for _, child := range systemNode.Children {
			switch child.Name {
			case "Config":
				hasConfig = true
			case "SystemLogs":
				hasSystemLogs = true
			}
		}

		if !hasConfig {
			t.Error("Config node not found under System")
		}
		if !hasSystemLogs {
			t.Error("SystemLogs node not found under System (rename may have failed)")
		}
	}

	if projectsNode == nil {
		t.Error("Projects node not found in final tree")
	} else {
		// Projects should have 2 children: ProjectA and ProjectB
		if len(projectsNode.Children) != 2 {
			t.Errorf("Expected Projects to have 2 children, got %d", len(projectsNode.Children))
		}

		hasProjectA, hasProjectB := false, false
		for _, child := range projectsNode.Children {
			switch child.Name {
			case "ProjectA":
				hasProjectA = true
			case "ProjectB":
				hasProjectB = true
			}
		}

		if !hasProjectA {
			t.Error("ProjectA node not found under Projects")
		}
		if !hasProjectB {
			t.Error("ProjectB node not found under Projects")
		}
	}

	// Phase 9: Testing Lookup functionality
	t.Log("Phase 9: Testing Lookup functionality")

	// Test 1: Lookup Config from System node (single level)
	configTag, err := api.IAskLookup(2, 1, "Config") // System node, user 1
	if err != nil {
		t.Fatalf("Failed to lookup Config from System: %v", err)
	}
	t.Logf("Successfully looked up Config from System node (ID: %d)", configTag.ID)

	// Test 2: Lookup with multi-level path from Root (System/SystemLogs)
	systemLogsTag, err := api.IAskLookup(1, 1, "System/SystemLogs") // Root, user 1
	if err != nil {
		t.Fatalf("Failed to lookup System/SystemLogs from Root: %v", err)
	}
	t.Logf("Successfully looked up SystemLogs via path System/SystemLogs from Root (ID: %d)", systemLogsTag.ID)

	// Test 3: Lookup non-existent path (System/Logs - was renamed to SystemLogs)
	_, err = api.IAskLookup(1, 1, "System/Logs") // Root, user 1
	if err == nil {
		t.Fatal("Expected error for non-existent path System/Logs, got nil")
	}
	t.Logf("Correctly returned error for non-existent path System/Logs: %v", err)

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
	nodeCountBefore := msg.RegCount()
	t.Logf("Node count before deletion: %d", nodeCountBefore)

	// Test 1: Delete a leaf node (Config has no children)
	t.Log("Test 11.1: Deleting leaf node Config")
	err = api.IAskDeleteChild(2, 1, configTag.ID) // System node, user 1, delete Config
	if err != nil {
		t.Fatalf("Failed to delete Config node: %v", err)
	}

	// Verify node count decreased by 1
	nodeCountAfter := msg.RegCount()
	t.Logf("Node count after deletion: %d", nodeCountAfter)
	if nodeCountAfter != nodeCountBefore-1 {
		t.Errorf("Expected node count to decrease by 1, before: %d, after: %d", nodeCountBefore, nodeCountAfter)
	}

	// Verify Config is gone from lookup
	_, err = api.IAskLookup(2, 1, "Config") // System node, user 1
	if err == nil {
		t.Fatal("Expected error when looking up deleted Config node, got nil")
	}
	t.Logf("Correctly returned error for deleted Config node: %v", err)

	// Verify sending message to deleted node returns ErrNodeNotFound
	_, err = api.IAskGetTree(configTag.ID, 1) // Try to get tree from deleted Config node
	if err != nerd.ErrNodeNotFound {
		t.Fatalf("Expected ErrNodeNotFound when messaging deleted node, got: %v", err)
	}
	t.Logf("Correctly returned ErrNodeNotFound when messaging deleted node")

	// Test 2: Try to delete node with children (Projects has ProjectA and ProjectB)
	t.Log("Test 11.2: Attempting to delete node with children (Projects)")
	err = api.IAskDeleteChild(1, 1, projectsNodeID) // Root, user 1, delete Projects
	if err == nil {
		t.Fatal("Expected error when deleting node with children, got nil")
	}
	t.Logf("Correctly returned error for deleting node with children: %v", err)

	// Test 3: Delete children first, then parent
	t.Log("Test 11.3: Deleting ProjectA and ProjectB, then Projects")

	// Find ProjectA and ProjectB IDs
	var projectAID, projectBID nerd.NodeID
	for _, child := range projectsNode.Children {
		if child.Name == "ProjectA" {
			projectAID = child.NodeID
		} else if child.Name == "ProjectB" {
			projectBID = child.NodeID
		}
	}

	if projectAID == 0 || projectBID == 0 {
		t.Fatal("Failed to find ProjectA or ProjectB node IDs")
	}

	// Delete ProjectA
	err = api.IAskDeleteChild(projectsNodeID, 1, projectAID)
	if err != nil {
		t.Fatalf("Failed to delete ProjectA: %v", err)
	}

	// Delete ProjectB
	err = api.IAskDeleteChild(projectsNodeID, 1, projectBID)
	if err != nil {
		t.Fatalf("Failed to delete ProjectB: %v", err)
	}

	// Now delete Projects (should succeed since children are gone)
	err = api.IAskDeleteChild(1, 1, projectsNodeID) // Root, user 1
	if err != nil {
		t.Fatalf("Failed to delete Projects after removing children: %v", err)
	}

	// Verify Projects is gone
	_, err = api.IAskLookup(1, 1, "Projects") // Root, user 1
	if err == nil {
		t.Fatal("Expected error when looking up deleted Projects node, got nil")
	}
	t.Logf("Successfully deleted Projects after removing children")

	// Test 4: Try to delete non-existent child
	t.Log("Test 11.4: Attempting to delete non-existent child")
	err = api.IAskDeleteChild(1, 1, 99999) // Root, user 1, invalid ID
	if err == nil {
		t.Fatal("Expected error when deleting non-existent child, got nil")
	}
	t.Logf("Correctly returned error for non-existent child: %v", err)

	t.Log("Integration test completed successfully")
}
