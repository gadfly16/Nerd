package main

import (
	"fmt"
	"os"

	"github.com/gadfly16/nerd/internal/tree/nodes"
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
		dbPath := "./nerd.db"

		err := nodes.InitDatabase(dbPath)
		if err != nil {
			return fmt.Errorf("failed to initialize database: %w", err)
		}

		fmt.Printf("Successfully initialized database at %s\n", dbPath)
		return nil
	},
}

var runCmd = &cobra.Command{
	Use:   "run",
	Short: "Start the Nerd service",
	Long:  "Starts the Nerd service with GUI and backend.",
	RunE: func(cmd *cobra.Command, args []string) error {
		fmt.Println("Starting Nerd service...")
		// TODO: Implement service startup
		return fmt.Errorf("run command not yet implemented")
	},
}

func init() {
	rootCmd.AddCommand(initCmd)
	rootCmd.AddCommand(runCmd)
}

func main() {
	if err := rootCmd.Execute(); err != nil {
		fmt.Fprintf(os.Stderr, "Error: %v\n", err)
		os.Exit(1)
	}
}
