package main

import (
	"fmt"
	"log"

	"github.com/gadfly16/nerd/api"
	"github.com/gadfly16/nerd/api/node"
	"github.com/gadfly16/nerd/internal/tree"
)

func main() {
	fmt.Println("Testing GetTree functionality...")

	// Run the service
	err := api.Run("./nerd.db")
	if err != nil {
		log.Fatalf("Failed to start service: %v", err)
	}

	// Get the root tag from the tree
	rootTag, exists := tree.GetTag(1) // Root node ID is 1
	if !exists {
		log.Fatalf("Root node not found in tree")
	}

	// Test GetTree with different depths
	fmt.Println("\n=== Testing GetTree with depth -1 (full tree) ===")
	fullTree, err := rootTag.AskGetTree(-1)
	if err != nil {
		log.Fatalf("Failed to get full tree: %v", err)
	}
	printTree(fullTree, 0)

	fmt.Println("\n=== Testing GetTree with depth 0 (root only) ===")
	rootOnly, err := rootTag.AskGetTree(0)
	if err != nil {
		log.Fatalf("Failed to get root only: %v", err)
	}
	printTree(rootOnly, 0)

	fmt.Println("\n=== Testing GetTree with depth 1 (root + children) ===")
	rootAndChildren, err := rootTag.AskGetTree(1)
	if err != nil {
		log.Fatalf("Failed to get root and children: %v", err)
	}
	printTree(rootAndChildren, 0)

	fmt.Println("\nGetTree tests completed successfully!")
}

func printTree(entry *node.TreeEntry, indent int) {
	for i := 0; i < indent; i++ {
		fmt.Print("  ")
	}
	fmt.Printf("├─ %s (ID: %d)\n", entry.Name, entry.NodeID)

	for _, child := range entry.Children {
		printTree(child, indent+1)
	}
}
