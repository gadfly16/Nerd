package nodes

import (
	"fmt"
	"os"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

// db is the unexported global database connection for node operations
var db *gorm.DB

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

	// Auto-migrate node schemas
	return db.AutoMigrate(
		&Identity{},
		&RootConfig{},
	)
}

// OpenDB sets the global database connection for node operations
func OpenDB(dbPath string) error {
	var err error
	db, err = gorm.Open(sqlite.Open(dbPath), &gorm.Config{})
	return err
}

// GetDB returns a database connection for node operations
func GetDB(dbPath string) (*gorm.DB, error) {
	return gorm.Open(sqlite.Open(dbPath), &gorm.Config{})
}
