package node

import (
	"fmt"
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

func (i *Identity) Load() ([]*msg.Tag, error) {
	// 0. Initialize runtime fields first
	i.Incoming = make(msg.MsgChan)
	i.Children = make(map[string]*msg.Tag)

	// 1. Create the appropriate node using registry
	loader, exists := nodeLoaders[i.NodeType]
	if !exists {
		return nil, fmt.Errorf("no loader registered for node type: %d", i.NodeType)
	}

	nodeInstance, err := loader(i)
	if err != nil {
		return nil, fmt.Errorf("failed to load node: %w", err)
	}

	// 2. Load children identities from database
	var children []*Identity
	result := DB.Where("parent_id = ?", i.NodeID).Find(&children)
	if result.Error != nil {
		return nil, fmt.Errorf("failed to load children: %w", result.Error)
	}

	// 3. Recursively load each child and collect tags
	var allTags []*msg.Tag
	for _, child := range children {
		childTags, err := child.Load()
		if err != nil {
			return nil, fmt.Errorf("failed to load child %s: %w", child.Name, err)
		}
		allTags = append(allTags, childTags...)

		// Add child to parent's children map
		i.Children[child.Name] = childTags[len(childTags)-1] // Last tag is the child itself
	}

	// 4. Start the node
	nodeInstance.Run()

	// 5. Return all child tags + self tag
	selfTag := nodeInstance.GetTag()
	allTags = append(allTags, selfTag)
	return allTags, nil
}
