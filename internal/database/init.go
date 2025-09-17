package database

import (
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func InitDatabase(dbPath string) error {
	db, err := gorm.Open(sqlite.Open(dbPath), &gorm.Config{})
	if err != nil {
		return err
	}

	err = db.AutoMigrate(
		&Identity{},
		&GroupConfig{},
		&RootConfig{},
		&UserConfig{},
		&UpdaterConfig{},
		&LoggerConfig{},
	)
	if err != nil {
		return err
	}

	return nil
}
