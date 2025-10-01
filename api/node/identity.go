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

	// Cache fields
	CacheValidity   `gorm:"-"`
	CachedTreeEntry *msg.TreeEntry `gorm:"-"`
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
// Returns slice of payloads and error if any child returned an error
// ChildrenQuery represents a query to be sent to all children
type ChildrenQuery struct {
	identity *Identity
	message  *msg.Msg
}

// AskChildren creates a query builder for sending messages to all children
func (i *Identity) AskChildren(m *msg.Msg) *ChildrenQuery {
	return &ChildrenQuery{identity: i, message: m}
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

func (i *Identity) Load() ([]*msg.Tag, error) {
	// 0. Initialize runtime fields first
	i.Incoming = make(msg.MsgChan)
	i.Children = make(map[string]*msg.Tag)

	// 1. Create the appropriate node using registry
	// 1. Create the appropriate node using switch-based loader
	nodeInstance, err := LoadNodeFromIdentity(i)
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
