package tree

import (
	"time"

	"gorm.io/gorm"
)

type nodeID int64

type nodeType int

const (
	groupNode nodeType = iota
	rootNode
	userNode
	updaterNode
	loggerNode
	authenticatorNode
)

type ConfigModel struct {
	ID         nodeID `gorm:"primaryKey"`
	CreatedAt  time.Time
	UpdatedAt  time.Time
	DeletedAt  gorm.DeletedAt `gorm:"index"`
	IdentityID nodeID         `gorm:"not null;index"`
}

type identity struct {
	ID        nodeID `gorm:"primaryKey"`
	CreatedAt time.Time
	UpdatedAt time.Time
	DeletedAt gorm.DeletedAt `gorm:"index"`
	ParentID  *nodeID        `gorm:"index"`
	Name      string         `gorm:"not null"`
	NodeType  nodeType       `gorm:"not null"`
}

type groupConfig struct {
	// Group nodes don't have configs
}

type rootConfig struct {
	ConfigModel
}

type userConfig struct {
	ConfigModel
}

type updaterConfig struct {
	// Updater nodes don't have configs
}

type loggerConfig struct {
	ConfigModel
}

type authenticatorConfig struct {
	ConfigModel
}
