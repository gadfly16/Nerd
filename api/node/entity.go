package node

import (
	"fmt"
	"sync/atomic"
	"time"

	"github.com/gadfly16/nerd/api/msg"
	"github.com/gadfly16/nerd/api/nerd"
	"gorm.io/gorm"
)

// CacheValidity manages cache invalidation for tree entries
type CacheValidity struct {
	TreeEntry atomic.Bool
	Parent    *CacheValidity
}

// InvalidateTreeEntry invalidates this node's cache and all ancestors
func (cv *CacheValidity) InvalidateTreeEntry() {
	for cv != nil {
		cv.TreeEntry.Store(false)
		cv = cv.Parent
	}
}

// Entity is shared across all node types by embedding and is stored in its
// own table in the database
type Entity struct {
	*msg.Tag `gorm:"embedded"`
	ParentID nerd.NodeID   `gorm:"index"`
	Name     string        `gorm:"not null"`
	NodeType nerd.NodeType `gorm:"not null"`

	CreatedAt time.Time
	UpdatedAt time.Time
	DeletedAt gorm.DeletedAt `gorm:"index"`

	// Runtime fields
	Children map[string]*msg.Tag `gorm:"-"`

	// Cache fields
	CacheValidity   `gorm:"-"`
	CachedTreeEntry *msg.TreeEntry `gorm:"-"`
}

// GetEntity returns the node's identity for direct manipulation
func (e *Entity) GetEntity() *Entity {
	return e
}

// GetTag returns the node's tag for routing (read-only)
func (e *Entity) GetTag() *msg.Tag {
	return e.Tag
}

// GetID returns the node's ID
func (e *Entity) GetID() nerd.NodeID {
	return e.Tag.NodeID
}

// GetName returns the node's name
func (e *Entity) GetName() string {
	return e.Name
}

// GetNodeTypeName returns the string representation of the node's type
func (e *Entity) GetNodeTypeName() string {
	return NodeTypeName(e.NodeType)
}

// SetName sets the node's name
func (e *Entity) SetName(name string) {
	e.Name = name
}

// SetParentID sets the parent ID for this node
func (e *Entity) SetParentID(parentID nerd.NodeID) {
	e.ParentID = parentID
}

// askChildren sends a message to all children concurrently and collects their responses
// Returns slice of payloads and error if any child returned an error
// ChildrenQuery represents a query to be sent to all children
type ChildrenQuery struct {
	identity *Entity
	message  *msg.Msg
}

// AskChildren creates a query builder for sending messages to all children
func (e *Entity) AskChildren(m *msg.Msg) *ChildrenQuery {
	return &ChildrenQuery{identity: e, message: m}
}

// Reduce executes the query and reduces successful responses using the provided function
func (cq *ChildrenQuery) Reduce(reduce func(payload any)) error {
	if len(cq.identity.Children) == 0 {
		return nil
	}

	// Check if this message is being forwarded (already has an answer channel)
	if cq.message.APipe != nil {
		// Message forwarding case: make a copy to avoid overwriting original answer channel
		msgCopy := *cq.message
		cq.message = &msgCopy
	}

	// Create shared answer pipe for all children
	cq.message.APipe = make(msg.AnswerChan, len(cq.identity.Children))

	// First loop: send messages to all children concurrently
	for _, childTag := range cq.identity.Children {
		// Send message to child (non-blocking since answer pipe is buffered)
		childTag.Incoming <- *cq.message
	}

	// Second loop: collect all answers and accumulate successful ones
	hasError := false

	for range len(cq.identity.Children) {
		// Wait for answer from any child
		answer := <-cq.message.APipe

		// Track if any child had an error
		if answer.Error != nil {
			hasError = true
		} else {
			reduce(answer.Payload)
		}
	}

	if hasError {
		return nerd.ErrChildrenError
	}

	return nil
}

func (e *Entity) Load() ([]*msg.Tag, error) {
	// 0. Initialize runtime fields first
	e.Incoming = make(msg.MsgChan)
	e.Children = make(map[string]*msg.Tag)

	// 1. Create the appropriate node using registry
	// 1. Create the appropriate node using switch-based loader
	nodeInstance, err := LoadNodeFromIdentity(e)
	if err != nil {
		return nil, fmt.Errorf("failed to load node: %w", err)
	}

	// 2. Load children identities from database
	var children []*Entity
	result := DB.Where("parent_id = ?", e.NodeID).Find(&children)
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
		e.Children[child.Name] = childTags[len(childTags)-1] // Last tag is the child itself
	}

	// 4. Start the node
	nodeInstance.Run()

	// 5. Return all child tags + self tag
	selfTag := nodeInstance.GetTag()
	allTags = append(allTags, selfTag)
	return allTags, nil
}
