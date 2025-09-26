package node

import (
	"gorm.io/gorm"
)

// db is the unexported global database connection for node operations
var DB *gorm.DB
