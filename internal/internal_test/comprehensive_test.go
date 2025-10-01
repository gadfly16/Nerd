package internal_test

import (
	"os"
	"testing"

	"github.com/gadfly16/nerd/api/msg"
	"github.com/gadfly16/nerd/api/nerd"
	"github.com/gadfly16/nerd/api/node"
	"github.com/gadfly16/nerd/internal/httpmsg"
	"github.com/gadfly16/nerd/internal/tree"
)

func TestComprehensiveTreeOperations(t *testing.T) {
	// Reset ID counter for test isolation
	node.ResetIDCounter()

	// Setup: Initialize and run tree
	testDB := "./test_comprehensive.db"
	defer os.Remove(testDB)

	err := tree.Init(testDB)
	if err != nil {
		t.Fatalf("Failed to initialize database: %v", err)
	}

	err = tree.Run(testDB)
	if err != nil {
		t.Fatalf("Failed to run tree: %v", err)
	}

	// Phase 1: Add "Projects" group under Root
	t.Log("Phase 1: Creating Projects group under Root")
	_, err = tree.AskNode(httpmsg.HttpMsg{
		Type:     httpmsg.HttpCreateChild,
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
	_, err = tree.AskNode(httpmsg.HttpMsg{
		Type:     httpmsg.HttpCreateChild,
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

	_, err = tree.AskNode(httpmsg.HttpMsg{
		Type:     httpmsg.HttpCreateChild,
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
	result, err := tree.AskNode(httpmsg.HttpMsg{
		Type:     httpmsg.HttpGetTree,
		TargetID: 1, // Root
		UserID:   1,
		Payload: map[string]any{
			"depth": float64(-1),
		},
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
	_, err = tree.AskNode(httpmsg.HttpMsg{
		Type:     httpmsg.HttpCreateChild,
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

	_, err = tree.AskNode(httpmsg.HttpMsg{
		Type:     httpmsg.HttpCreateChild,
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
	_, err = tree.AskNode(httpmsg.HttpMsg{
		Type:     httpmsg.HttpCreateChild,
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
	_, err = tree.AskNode(httpmsg.HttpMsg{
		Type:     httpmsg.HttpRenameChild,
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

	// Phase 6: Final tree verification
	t.Log("Phase 6: Verifying final tree structure")
	finalResult, err := tree.AskNode(httpmsg.HttpMsg{
		Type:     httpmsg.HttpGetTree,
		TargetID: 1, // Root
		UserID:   1,
		Payload: map[string]any{
			"depth": float64(-1),
		},
	})
	if err != nil {
		t.Fatalf("Failed to get final tree: %v", err)
	}

	// Verify the final tree structure
	finalTree := finalResult.(*msg.TreeEntry)

	// Root should have 2 children: System and Projects
	if len(finalTree.Children) != 2 {
		t.Errorf("Expected Root to have 2 children, got %d", len(finalTree.Children))
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

	t.Log("Comprehensive tree operations test completed successfully")
}
