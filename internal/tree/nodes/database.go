package nodes

import (
	"fmt"
	"os"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

// InitDatabase initializes the database with node schemas only
// Proper initialization will be done through the node lifecycle methods
func InitDatabase(dbPath string) error {
	// Check if database file already exists
	if _, err := os.Stat(dbPath); err == nil {
		return fmt.Errorf("database file %s already exists", dbPath)
	}

	db, err := gorm.Open(sqlite.Open(dbPath), &gorm.Config{})
	if err != nil {
		return err
	}

	// Auto-migrate node schemas
	err = db.AutoMigrate(
		&Identity{},
		&RootConfig{},
		&UserConfig{},
		&LoggerConfig{},
		&AuthenticatorConfig{},
	)
	if err != nil {
		return err
	}

	// TODO: Replace with proper Nerd initialization:
	// 1. Bootstrap Root node manually (save + run)
	// 2. Send messages to create children
	// 3. Graceful shutdown when done

	return nil
}

// GetDB returns a database connection for node operations
func GetDB(dbPath string) (*gorm.DB, error) {
	return gorm.Open(sqlite.Open(dbPath), &gorm.Config{})
}
