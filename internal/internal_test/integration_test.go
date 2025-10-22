package internal_test

import (
	"os"
	"runtime"
	"testing"
	"time"

	"github.com/gadfly16/nerd/api/imsg"
	"github.com/gadfly16/nerd/sdk/msg"
	"github.com/gadfly16/nerd/api/nerd"
	"github.com/gadfly16/nerd/api/node"
	"github.com/gadfly16/nerd/internal/tree"
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
		_, err := tree.IAsk(imsg.IMsg{
			Type:     imsg.Shutdown,
			TargetID: 1, // Root node
			UserID:   1,
		})
		if err != nil {
			t.Logf("Shutdown error: %v", err)
		}
	}()

	// Phase 1: Add "Projects" group under Root
	t.Log("Phase 1: Creating Projects group under Root")
	_, err = tree.IAsk(imsg.IMsg{
		Type:     imsg.CreateChild,
		TargetID: 1, // Root node
		UserID:   1,
		Payload: map[string]any{
			"nodeType": float64(node.Group),
			"name":     "Projects",
		},
	})
	if err != nil {
		t.Fatalf("Failed to create Projects group: %v", err)
	}

	// Phase 2: Add children under System
	t.Log("Phase 2: Creating Config and Logs under System")
	_, err = tree.IAsk(imsg.IMsg{
		Type:     imsg.CreateChild,
		TargetID: 2, // System node
		UserID:   1,
		Payload: map[string]any{
			"nodeType": float64(node.Group),
			"name":     "Config",
		},
	})
	if err != nil {
		t.Fatalf("Failed to create Config group: %v", err)
	}

	_, err = tree.IAsk(imsg.IMsg{
		Type:     imsg.CreateChild,
		TargetID: 2, // System node
		UserID:   1,
		Payload: map[string]any{
			"nodeType": float64(node.Group),
			"name":     "Logs",
		},
	})
	if err != nil {
		t.Fatalf("Failed to create Logs group: %v", err)
	}

	// Phase 3: Add children under Projects (need to find Projects node ID)
	// First get the tree to find Projects node ID
	result, err := tree.IAsk(imsg.IMsg{
		Type:     imsg.GetTree,
		TargetID: 1, // Root
		UserID:   1,
	})
	if err != nil {
		t.Fatalf("Failed to get tree: %v", err)
	}

	// Find Projects node ID from tree structure
	treeEntry := result.(*msg.TreeEntry)
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
	_, err = tree.IAsk(imsg.IMsg{
		Type:     imsg.CreateChild,
		TargetID: projectsNodeID,
		UserID:   1,
		Payload: map[string]any{
			"nodeType": float64(node.Group),
			"name":     "ProjectA",
		},
	})
	if err != nil {
		t.Fatalf("Failed to create ProjectA: %v", err)
	}

	_, err = tree.IAsk(imsg.IMsg{
		Type:     imsg.CreateChild,
		TargetID: projectsNodeID,
		UserID:   1,
		Payload: map[string]any{
			"nodeType": float64(node.Group),
			"name":     "ProjectB",
		},
	})
	if err != nil {
		t.Fatalf("Failed to create ProjectB: %v", err)
	}

	// Phase 4: Test name collision
	t.Log("Phase 4: Testing name collision")
	_, err = tree.IAsk(imsg.IMsg{
		Type:     imsg.CreateChild,
		TargetID: 2, // System node
		UserID:   1,
		Payload: map[string]any{
			"nodeType": float64(node.Group),
			"name":     "Config", // This should collide with existing Config
		},
	})
	if err == nil {
		t.Errorf("Expected name collision error, but creation succeeded")
	} else {
		t.Logf("Name collision correctly detected: %v", err)
	}

	// Phase 5: Test rename operation
	t.Log("Phase 5: Testing rename operation")
	_, err = tree.IAsk(imsg.IMsg{
		Type:     imsg.RenameChild,
		TargetID: 2, // System node
		UserID:   1,
		Payload: map[string]any{
			"oldName": "Logs",
			"newName": "SystemLogs",
		},
	})
	if err != nil {
		t.Fatalf("Failed to rename Logs to SystemLogs: %v", err)
	}

	// Phase 6: Mid-test shutdown and state verification
	t.Log("Phase 6: Shutting down system and verifying clean state")

	// Record goroutine count before shutdown
	goroutinesBefore := runtime.NumGoroutine()
	t.Logf("Goroutines before shutdown: %d", goroutinesBefore)

	// Shutdown the entire tree
	_, err = tree.IAsk(imsg.IMsg{
		Type:     imsg.Shutdown,
		TargetID: 1, // Root node
		UserID:   1,
	})
	if err != nil {
		t.Fatalf("Failed to shutdown tree: %v", err)
	}

	// Verify system is in clean state after shutdown
	nodeCount := tree.GetNodeCount()
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
	finalResult, err := tree.IAsk(imsg.IMsg{
		Type:     imsg.GetTree,
		TargetID: 1, // Root
		UserID:   1,
	})
	if err != nil {
		t.Fatalf("Failed to get final tree: %v", err)
	}

	// Verify the final tree structure
	finalTree := finalResult.(*msg.TreeEntry)

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
	lookupResult, err := tree.IAsk(imsg.IMsg{
		Type:     imsg.Lookup,
		TargetID: 2, // System node
		UserID:   1,
		Payload: map[string]any{
			"path": "Config",
		},
	})
	if err != nil {
		t.Fatalf("Failed to lookup Config from System: %v", err)
	}
	configTag := lookupResult.(*msg.Tag)
	t.Logf("Successfully looked up Config from System node (ID: %d)", configTag.NodeID)

	// Test 2: Lookup with multi-level path from Root (System/SystemLogs)
	lookupResult, err = tree.IAsk(imsg.IMsg{
		Type:     imsg.Lookup,
		TargetID: 1, // Root
		UserID:   1,
		Payload: map[string]any{
			"path": "System/SystemLogs",
		},
	})
	if err != nil {
		t.Fatalf("Failed to lookup System/SystemLogs from Root: %v", err)
	}
	systemLogsTag := lookupResult.(*msg.Tag)
	t.Logf("Successfully looked up SystemLogs via path System/SystemLogs from Root (ID: %d)", systemLogsTag.NodeID)

	// Test 3: Lookup non-existent path (System/Logs - was renamed to SystemLogs)
	_, err = tree.IAsk(imsg.IMsg{
		Type:     imsg.Lookup,
		TargetID: 1, // Root
		UserID:   1,
		Payload: map[string]any{
			"path": "System/Logs",
		},
	})
	if err == nil {
		t.Fatal("Expected error for non-existent path System/Logs, got nil")
	}
	t.Logf("Correctly returned error for non-existent path System/Logs: %v", err)

	// Phase 10: Performance measurement for cache effectiveness
	t.Log("Phase 10: Measuring GetTree performance - first call vs cached call")

	getTreeMsg := imsg.IMsg{
		Type:     imsg.GetTree,
		TargetID: 1, // Root
		UserID:   1,
	}

	// First call - should compute and cache
	start1 := time.Now()
	_, err = tree.IAsk(getTreeMsg)
	duration1 := time.Since(start1)
	if err != nil {
		t.Fatalf("Failed first GetTree call: %v", err)
	}

	// Second call - should return from cache
	start2 := time.Now()
	_, err = tree.IAsk(getTreeMsg)
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

	t.Log("Integration test completed successfully")
}
