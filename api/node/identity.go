package node

import (
	"time"

	"github.com/gadfly16/nerd/api/msg"
	"github.com/gadfly16/nerd/api/nerd"
	"gorm.io/gorm"
)

// Identity is shared across all node types by embedding and is stored in its
// own table in the database
type Identity struct {
	*msg.Tag `gorm:"embedded"`
	ParentID nerd.NodeID   `gorm:"index"`
	Name     string        `gorm:"not null"`
	NodeType nerd.NodeType `gorm:"not null"`

	CreatedAt time.Time
	UpdatedAt time.Time
	DeletedAt gorm.DeletedAt `gorm:"index"`

	// Runtime fields
	Children map[string]*msg.Tag `gorm:"-"`
}

// GetIdentity returns the node's identity for direct manipulation
func (i *Identity) GetIdentity() *Identity {
	return i
}

// GetTag returns the node's tag for routing (read-only)
func (i *Identity) GetTag() *msg.Tag {
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
func (i *Identity) AskChildren(m *msg.Msg) ([]msg.Answer, error) {
	if len(i.Children) == 0 {
		return nil, nil
	}

	// Check if this message is being forwarded (already has an answer channel)
	if m.APipe != nil {
		// Message forwarding case: make a copy to avoid overwriting original answer channel
		msgCopy := *m
		m = &msgCopy
	}

	// Create shared answer pipe for all children
	m.APipe = make(msg.AnswerChan, len(i.Children))

	// First loop: send messages to all children concurrently
	for _, childTag := range i.Children {
		// Send message to child (non-blocking since answer pipe is buffered)
		childTag.Incoming <- *m
	}

	// Second loop: collect all answers
	answers := make([]msg.Answer, 0, len(i.Children))
	hasError := false

	for range len(i.Children) {
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
