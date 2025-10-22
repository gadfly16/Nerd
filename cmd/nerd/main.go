package main

import (
	"fmt"
	"math/rand"
	"os"

	"github.com/gadfly16/nerd/api"
	"github.com/gadfly16/nerd/api/imsg"
	"github.com/gadfly16/nerd/api/nerd"
	"github.com/gadfly16/nerd/api/node"
	"github.com/gadfly16/nerd/internal/tree"
	"github.com/spf13/cobra"
)

var rootCmd = &cobra.Command{
	Use:   "nerd",
	Short: "Nerd - Personal software agent architecture framework",
	Long: `Nerd is a software architecture framework for building small
personal agents with Go backends and TypeScript frontends.`,
}

var initCmd = &cobra.Command{
	Use:   "init",
	Short: "Initialize the Nerd database",
	Long: `Creates the SQLite database with the required schema for
nodes and trees.`,
	RunE: func(cmd *cobra.Command, args []string) error {
		dbPath, _ := cmd.Flags().GetString("database")

		err := api.Init(dbPath)
		if err != nil {
			return fmt.Errorf("failed to initialize the tree: %w", err)
		}

		fmt.Printf("Successfully initialized the tree with database at %s\n", dbPath)
		return nil
	},
}

var runCmd = &cobra.Command{
	Use:   "run",
	Short: "Start the Nerd service",
	Long:  "Starts the Nerd service with GUI and backend.",
	RunE: func(cmd *cobra.Command, args []string) error {
		dbPath, _ := cmd.Flags().GetString("database")

		fmt.Println("Starting Nerd service...")
		err := api.Run(dbPath)
		if err != nil {
			return fmt.Errorf("failed to start service: %w", err)
		}

		return nil
	},
}

var generateCmd = &cobra.Command{
	Use:   "generate",
	Short: "Generate random tree for testing",
	Long:  "Generates a random tree of nodes under a specified user for GUI stress testing.",
	RunE: func(cmd *cobra.Command, args []string) error {
		dbPath, _ := cmd.Flags().GetString("database")
		userName, _ := cmd.Flags().GetString("user")
		count, _ := cmd.Flags().GetInt("count")

		// Start the tree
		err := tree.Run(dbPath)
		if err != nil {
			return fmt.Errorf("failed to run tree: %w", err)
		}

		// Ensure graceful shutdown
		defer func() {
			_, err := tree.IAsk(imsg.IMsg{
				Type:     imsg.Shutdown,
				TargetID: 1, // Root node
				UserID:   1,
			})
			if err != nil {
				fmt.Printf("Warning: shutdown error: %v\n", err)
			}
		}()

		// Lookup the user node
		result, err := tree.IAsk(imsg.IMsg{
			Type:     imsg.Lookup,
			TargetID: 1, // Root
			UserID:   1,
			Payload: map[string]any{
				"path": "Authenticator/" + userName,
			},
		})
		if err != nil {
			return fmt.Errorf("user %q not found: %w", userName, err)
		}
		uit := result.(*imsg.ITag)

		// Slice to track potential parent nodes
		nodes := []nerd.NodeID{uit.ID}

		// Create count nodes
		for i := 0; i < count; i++ {
			// Select random parent from nodes slice
			parentID := nodes[rand.Intn(len(nodes))]

			// Create child node with default name
			result, err := tree.IAsk(imsg.IMsg{
				Type:     imsg.CreateChild,
				TargetID: parentID,
				UserID:   1,
				Payload: map[string]any{
					"nodeType": float64(node.Group),
					"name":     "",
				},
			})
			if err != nil {
				return fmt.Errorf("failed to create node %d: %w", i+1, err)
			}

			// Add newly created node to slice for future parent selection
			it := result.(*imsg.ITag)
			nodes = append(nodes, it.ID)
		}

		fmt.Printf("Successfully generated %d nodes under user %q\n", count, userName)
		return nil
	},
}

func init() {
	rootCmd.AddCommand(initCmd)
	rootCmd.AddCommand(runCmd)
	rootCmd.AddCommand(generateCmd)

	// Add persistent flags to root (inherited by all subcommands)
	rootCmd.PersistentFlags().StringP("database", "d", "./nerd.db", "Path to the SQLite database file")

	// Add generate-specific flags
	generateCmd.Flags().StringP("user", "u", "Mate", "User node to generate tree under")
	generateCmd.Flags().IntP("count", "c", 100, "Number of nodes to generate")
}

func main() {
	if err := rootCmd.Execute(); err != nil {
		fmt.Fprintf(os.Stderr, "Error: %v\n", err)
		os.Exit(1)
	}
}
