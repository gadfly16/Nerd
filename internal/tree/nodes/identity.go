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
	children map[string]*nerd.Tag
}

// GetTag returns the node's tag for routing (read-only)
func (i *Identity) GetTag() *nerd.Tag {
	return i.Tag
}

// GetID returns the node's ID
func (i *Identity) GetID() nerd.NodeID {
	return i.Tag.NodeID
}

// GetName returns the node's name
func (i *Identity) GetName() string {
	return i.Name
}

// SetName sets the node's name
func (i *Identity) SetName(name string) {
	i.Name = name
}

// SetParentID sets the parent ID for this node
func (i *Identity) SetParentID(parentID nerd.NodeID) {
	i.ParentID = parentID
}

// askChildren sends a message to all children concurrently and collects their responses
// Returns slice of answers and error if any child returned an error
func (i *Identity) askChildren(m *nerd.Msg) ([]nerd.Answer, error) {
	if len(i.children) == 0 {
		return nil, nil
	}

	// Check if this message is being forwarded (already has an answer channel)
	if m.APipe != nil {
		// Message forwarding case: make a copy to avoid overwriting original answer channel
		msgCopy := *m
		m = &msgCopy
	}

	// Create shared answer pipe for all children
	m.APipe = make(nerd.AnswerPipe, len(i.children))

	// First loop: send messages to all children concurrently
	for _, childTag := range i.children {
		// Send message to child (non-blocking since answer pipe is buffered)
		childTag.Incoming <- *m
	}

	// Second loop: collect all answers
	answers := make([]nerd.Answer, 0, len(i.children))
	hasError := false

	for _ = range len(i.children) {
		// Wait for answer from any child
		answer := <-m.APipe
		answers = append(answers, answer)

		// Track if any child had an error
		if answer.Error != nil {
			hasError = true
		}
	}

	if hasError {
		return answers, nerd.ErrChildrenError
	}

	return answers, nil
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

	// Generate auto name and set it, then save
	autoName := "New " + child.GetNodeTypeName() + " #" + fmt.Sprintf("%d", child.GetID())
	child.SetName(autoName)
	err = child.Save()
	if err != nil {
		return nil, err
	}

	// Initialize children map if needed
	if i.children == nil {
		i.children = make(map[string]*nerd.Tag)
	}

	// Add child to parent's children map using name as key
	i.children[autoName] = child.GetTag()

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
