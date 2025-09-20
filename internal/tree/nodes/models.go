package nodes

import (
	"time"

	"github.com/gadfly16/nerd/internal/tree/nerd"
	"gorm.io/gorm"
)

// ConfigModel provides the base structure for node configurations
type ConfigModel struct {
	ID         nerd.NodeID `gorm:"primaryKey"`
	CreatedAt  time.Time
	UpdatedAt  time.Time
	DeletedAt  gorm.DeletedAt `gorm:"index"`
	IdentityID nerd.NodeID    `gorm:"not null;index"`
}

// Identity represents a node's identity in the database
type Identity struct {
	ID        nerd.NodeID `gorm:"primaryKey"`
	CreatedAt time.Time
	UpdatedAt time.Time
	DeletedAt gorm.DeletedAt `gorm:"index"`
	ParentID  nerd.NodeID    `gorm:"index"`
	Name      string         `gorm:"not null"`
	NodeType  nerd.NodeType  `gorm:"not null"`
}

// Node config types - only nodes that need persistent config have ConfigModel

type GroupConfig struct {
	// Group nodes don't have configs
}

type RootConfig struct {
	ConfigModel
}
