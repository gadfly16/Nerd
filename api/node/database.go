package node

import (
	"gorm.io/gorm"
)

// DB is the global database connection for node operations
var DB *gorm.DB

// CloseDatabase properly closes the database connection and nils out the global DB
func CloseDatabase() error {
	if DB != nil {
		sqlDB, err := DB.DB()
		if err != nil {
			return err
		}
		err = sqlDB.Close()
		DB = nil
		return err
	}
	return nil
}
