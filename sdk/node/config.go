package node

import (
	"time"

	"github.com/gadfly16/nerd/api/nerd"
	"gorm.io/gorm"
)

// ConfigModel provides the base structure for node configurations
// Only nodes that need persistent config have ConfigModel
// Individual config types are declared in their respective node files
type ConfigModel struct {
	ID         nerd.NodeID `gorm:"primaryKey"`
	IdentityID nerd.NodeID `gorm:"not null;index"`

	CreatedAt time.Time
	DeletedAt gorm.DeletedAt `gorm:"index"`
}
