package internal_test

import (
	"os"
	"testing"

	"github.com/gadfly16/nerd/api"
	"github.com/gadfly16/nerd/internal/tree"
)

func TestGetTree(t *testing.T) {
	// Step 1: Initialize database with test data
	testDB := "./test_gettree.db"
	os.Remove(testDB) // Cleanup

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
		err := api.IAskShutdown(1, 1) // Root node, user 1
		if err != nil {
			t.Logf("Shutdown error: %v", err)
		}
	}()

	// Step 3: Send GetTree message to root node (ID=1)
	treeEntry, err := api.IAskGetTree(1, 1) // Root node, user 1
	if err != nil {
		t.Fatalf("Failed to get tree: %v", err)
	}

	// Step 5: Validate tree structure
	if treeEntry.Name != "Root" {
		t.Errorf("Expected root name 'Root', got '%s'", treeEntry.Name)
	}

	if len(treeEntry.Children) != 2 {
		t.Errorf("Expected 2 children (System and Authenticator), got %d", len(treeEntry.Children))
	}

	// Check that System and Authenticator exist
	hasSystem := false
	hasAuthenticator := false
	for _, child := range treeEntry.Children {
		if child.Name == "System" {
			hasSystem = true
		}
		if child.Name == "Authenticator" {
			hasAuthenticator = true
		}
	}

	if !hasSystem {
		t.Errorf("Expected to find System child")
	}
	if !hasAuthenticator {
		t.Errorf("Expected to find Authenticator child")
	}

	t.Logf("GetTree test passed! Tree structure verified with System and Authenticator children")
}
