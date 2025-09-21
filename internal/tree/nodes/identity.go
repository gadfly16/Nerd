package nodes

import (
	"time"

	"github.com/gadfly16/nerd/internal/tree/nerd"
	"gorm.io/gorm"
)

// Identity is shared across all node types by embedding and is stored in its
// own table in the database
type Identity struct {
	ID       nerd.NodeID   `gorm:"primaryKey"`
	ParentID nerd.NodeID   `gorm:"index"`
	Name     string        `gorm:"not null"`
	NodeType nerd.NodeType `gorm:"not null"`
	Incoming nerd.Pipe     `gorm:"-"` // Runtime field, not persisted

	CreatedAt time.Time
	UpdatedAt time.Time
	DeletedAt gorm.DeletedAt `gorm:"index"`
}

// GetID returns the node's ID
func (i *Identity) GetID() nerd.NodeID {
	return i.ID
}

// GetName returns the node's name
func (i *Identity) GetName() string {
	return i.Name
}

// GetNodeType returns the node's type
func (i *Identity) GetNodeType() nerd.NodeType {
	return i.NodeType
}

// GetIncoming returns the node's incoming channel
func (i *Identity) GetIncoming() nerd.Pipe {
	return i.Incoming
}
