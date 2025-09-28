package main

import (
	"fmt"
	"os"

	"github.com/gadfly16/nerd/api"
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

func init() {
	rootCmd.AddCommand(initCmd)
	rootCmd.AddCommand(runCmd)

	// Add flags to commands
	initCmd.Flags().StringP("database", "d", "./nerd.db", "Path to the SQLite database file")
	runCmd.Flags().StringP("database", "d", "./nerd.db", "Path to the SQLite database file")
}

func main() {
	if err := rootCmd.Execute(); err != nil {
		fmt.Fprintf(os.Stderr, "Error: %v\n", err)
		os.Exit(1)
	}
}
