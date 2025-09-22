package nodes

import (
	"fmt"
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

	// Runtime fields
	children []*nerd.Tag
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

// SetParentID sets the parent ID for this node
func (i *Identity) SetParentID(parentID nerd.NodeID) {
	i.ParentID = parentID
}

// handleCommonMessage processes messages shared across all node types
// Returns true if message was handled, false if node-specific handling needed
func (i *Identity) handleCommonMessage(m *nerd.Msg, node nerd.Node) (any, error) {
	switch m.Type {
	case nerd.Create_Child_Msg:
		return i.handleCreateChild(m, node)
	case nerd.Shutdown_Msg:
		return i.handleShutdown(m, node)
	case nerd.Get_Config_Msg:
		return i.handleGetConfig(m, node)
	default:
		// This should never happen if CommonMsgSeparator is used correctly
		panic(fmt.Sprintf("handleCommonMessage called with non-common message type: %d", m.Type))
	}
}

// handleCreateChild processes requests to create child nodes (shared logic)
func (i *Identity) handleCreateChild(m *nerd.Msg, parent nerd.Node) (any, error) {
	// Parse message payload
	nodeType, ok := m.Payload.(nerd.NodeType)
	if !ok {
		return nil, nerd.ErrInvalidPayload
	}

	// Create appropriate node instance based on type
	child, err := NewNode(nodeType)
	if err != nil {
		return nil, err
	}

	// Set parent-child relationship
	child.SetParentID(i.Tag.NodeID)

	// Save the child to database
	err = child.Save()
	if err != nil {
		return nil, err
	}

	// Add child to parent's children list
	i.children = append(i.children, child.GetTag())

	// Generate auto name: "New Type #NodeID"
	nodeTypeName := "Group" // For now, will expand this
	autoName := fmt.Sprintf("New %s #%d", nodeTypeName, child.GetTag().NodeID)

	// TODO: Update child name in database
	_ = autoName // Silence unused variable for now

	// Start the child node
	child.Run()

	return child.GetTag(), nil
}

// handleShutdown processes shutdown requests (shared logic)
func (i *Identity) handleShutdown(m *nerd.Msg, node nerd.Node) (any, error) {
	// TODO: Implement shared shutdown handling
	// 1. Initiate graceful shutdown of all children
	// 2. Wait for completion
	// 3. Return response and exit message loop
	return nil, nerd.ErrNotImplemented
}

// handleGetConfig processes get config requests (shared logic)
func (i *Identity) handleGetConfig(m *nerd.Msg, node nerd.Node) (any, error) {
	// TODO: Implement config retrieval
	return nil, nerd.ErrNotImplemented
}
