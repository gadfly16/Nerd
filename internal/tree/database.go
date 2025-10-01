package tree

import (
	"fmt"
	"os"

	"github.com/gadfly16/nerd/api/node"
	"github.com/gadfly16/nerd/internal/builtin"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

// InitDatabase initializes a new database with node schemas and sets global connection
func InitDatabase(dbPath string) error {
	// Check if database file already exists
	if _, err := os.Stat(dbPath); err == nil {
		return fmt.Errorf("database file %s already exists", dbPath)
	}

	// Create and set global database connection
	var err error
	node.DB, err = gorm.Open(sqlite.Open(dbPath), &gorm.Config{})
	if err != nil {
		return err
	}

	return builtin.MigrateBuiltinModels()
}

// OpenDatabase opens an existing database and sets global connection
func OpenDatabase(dbPath string) error {
	// Check if database exists
	if _, err := os.Stat(dbPath); os.IsNotExist(err) {
		return fmt.Errorf("database does not exist: %s (use InitInstance to create)", dbPath)
	}

	// Open and set global database connection
	var err error
	node.DB, err = gorm.Open(sqlite.Open(dbPath), &gorm.Config{})
	return err
}
