package nodes

import (
	"time"

	"github.com/gadfly16/nerd/internal/tree/system"
	"gorm.io/gorm"
)

// ConfigModel provides the base structure for node configurations
type ConfigModel struct {
	ID         system.NodeID `gorm:"primaryKey"`
	CreatedAt  time.Time
	UpdatedAt  time.Time
	DeletedAt  gorm.DeletedAt `gorm:"index"`
	IdentityID system.NodeID  `gorm:"not null;index"`
}

// Identity represents a node's identity in the database
type Identity struct {
	ID        system.NodeID `gorm:"primaryKey"`
	CreatedAt time.Time
	UpdatedAt time.Time
	DeletedAt gorm.DeletedAt  `gorm:"index"`
	ParentID  *system.NodeID  `gorm:"index"`
	Name      string          `gorm:"not null"`
	NodeType  system.NodeType `gorm:"not null"`
}

// Node config types - only nodes that need persistent config have ConfigModel

type GroupConfig struct {
	// Group nodes don't have configs
}

type RootConfig struct {
	ConfigModel
}

type UserConfig struct {
	ConfigModel
}

type UpdaterConfig struct {
	// Updater nodes don't have configs
}

type LoggerConfig struct {
	ConfigModel
}

type AuthenticatorConfig struct {
	ConfigModel
}
