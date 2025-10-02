package builtin

import "github.com/gadfly16/nerd/api/node"

// MigrateBuiltinModels auto-migrates builtin node schemas
func MigrateBuiltinModels() error {
	return node.DB.AutoMigrate(
		&node.Entity{},
		&RootConfig{},
		&UserConfig{},
	)
}
