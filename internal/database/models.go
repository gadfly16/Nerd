package database

import (
	"time"

	"gorm.io/gorm"
)

type NodeID int64

type NodeType int

const (
	GroupNode NodeType = iota
	RootNode
	UserNode
	UpdaterNode
	LoggerNode
)

type ConfigModel struct {
	ID         NodeID `gorm:"primaryKey"`
	CreatedAt  time.Time
	UpdatedAt  time.Time
	DeletedAt  gorm.DeletedAt `gorm:"index"`
	IdentityID NodeID         `gorm:"not null;index"`
}

type Identity struct {
	ID        NodeID `gorm:"primaryKey"`
	CreatedAt time.Time
	UpdatedAt time.Time
	DeletedAt gorm.DeletedAt `gorm:"index"`
	ParentID  *NodeID        `gorm:"index"`
	Name      string         `gorm:"not null"`
	NodeType  NodeType       `gorm:"not null"`
}

type GroupConfig struct {
	ConfigModel
}

type RootConfig struct {
	ConfigModel
}

type UserConfig struct {
	ConfigModel
}

type UpdaterConfig struct {
	ConfigModel
}

type LoggerConfig struct {
	ConfigModel
}
