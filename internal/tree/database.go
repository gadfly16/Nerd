package tree

import (
	"fmt"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func InitDatabase(dbPath string) error {
	db, err := gorm.Open(sqlite.Open(dbPath), &gorm.Config{})
	if err != nil {
		return err
	}

	err = db.AutoMigrate(
		&identity{},
		&rootConfig{},
		&userConfig{},
		&loggerConfig{},
		&authenticatorConfig{},
	)
	if err != nil {
		return err
	}

	// Create the minimal tree structure
	err = createMinimalTree(db)
	if err != nil {
		return err
	}

	return nil
}

// createNode creates a node with the specified parameters and returns its ID
func createNode(db *gorm.DB, parentID *nodeID, name string, nodeType nodeType) (nodeID, error) {
	identity := &identity{
		ParentID: parentID,
		Name:     name,
		NodeType: nodeType,
	}

	result := db.Create(identity)
	if result.Error != nil {
		return 0, fmt.Errorf("failed to create identity for %s: %w", name, result.Error)
	}

	// Create the corresponding config based on node type
	var config interface{}
	switch nodeType {
	case rootNode:
		config = &rootConfig{
			ConfigModel: ConfigModel{
				ID:         identity.ID,
				IdentityID: identity.ID,
			},
		}
	case loggerNode:
		config = &loggerConfig{
			ConfigModel: ConfigModel{
				ID:         identity.ID,
				IdentityID: identity.ID,
			},
		}
	case authenticatorNode:
		config = &authenticatorConfig{
			ConfigModel: ConfigModel{
				ID:         identity.ID,
				IdentityID: identity.ID,
			},
		}
	default:
		return 0, fmt.Errorf("unsupported node type for initial creation: %d", nodeType)
	}

	result = db.Create(config)
	if result.Error != nil {
		return 0, fmt.Errorf("failed to create config for %s: %w", name, result.Error)
	}

	return identity.ID, nil
}

// createMinimalTree creates the minimal tree structure required for startup
func createMinimalTree(db *gorm.DB) error {
	// Create Root node (ID will be 1)
	rootID, err := createNode(db, nil, "Root", rootNode)
	if err != nil {
		return fmt.Errorf("failed to create Root node: %w", err)
	}

	// Create Logger node as child of Root
	_, err = createNode(db, &rootID, "Logger", loggerNode)
	if err != nil {
		return fmt.Errorf("failed to create Logger node: %w", err)
	}

	// Create Authenticator node as child of Root
	_, err = createNode(db, &rootID, "Authenticator", authenticatorNode)
	if err != nil {
		return fmt.Errorf("failed to create Authenticator node: %w", err)
	}

	return nil
}
