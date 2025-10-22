package builtin

import "github.com/gadfly16/nerd/sdk/node"

// MigrateBuiltinModels auto-migrates builtin node schemas
func MigrateBuiltinModels() error {
	return node.DB.AutoMigrate(
		&node.Entity{},
		&RootConfig{},
		&UserConfig{},
	)
}
