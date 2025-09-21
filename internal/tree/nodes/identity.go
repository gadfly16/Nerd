package nodes

import (
	"time"

	"github.com/gadfly16/nerd/internal/tree/nerd"
	"gorm.io/gorm"
)

// Identity is shared across all node types by embedding and is stored in its
// own table in the database
type Identity struct {
	*nerd.Tag `gorm:"embedded"`
	ParentID  nerd.NodeID   `gorm:"index"`
	Name      string        `gorm:"not null"`
	NodeType  nerd.NodeType `gorm:"not null"`

	CreatedAt time.Time
	UpdatedAt time.Time
	DeletedAt gorm.DeletedAt `gorm:"index"`
}

// GetTag returns the node's tag for routing (read-only)
func (i *Identity) GetTag() *nerd.Tag {
	return i.Tag
}

// GetName returns the node's name
func (i *Identity) GetName() string {
	return i.Name
}

// GetNodeType returns the node's type
func (i *Identity) GetNodeType() nerd.NodeType {
	return i.NodeType
}
