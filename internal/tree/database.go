package tree

import (
	"fmt"
	"os"

	"github.com/gadfly16/nerd/api/node"
	"github.com/gadfly16/nerd/internal/builtin"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

// InitDatabase initializes the database with node schemas and sets global connection
// Proper initialization will be done through the node lifecycle methods
func InitDatabase(dbPath string) error {
	// Check if database file already exists
	if _, err := os.Stat(dbPath); err == nil {
		return fmt.Errorf("database file %s already exists", dbPath)
	}

	// Set global database connection
	err := OpenDB(dbPath)
	if err != nil {
		return err
	}

	return builtin.MigrateBuiltinModels()
}

// OpenDB sets the global database connection for node operations
func OpenDB(dbPath string) error {
	var err error
	node.DB, err = gorm.Open(sqlite.Open(dbPath), &gorm.Config{})
	return err
}
