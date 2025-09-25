package msg

// MsgType defines the types of messages that can be sent
type MsgType int

const (
	// Common messages (handled by Identity)
	CreateChild MsgType = iota
	Shutdown
	RenameChild
	InternalRename // internal operation only

	// Separator - messages >= this value are node-specific
	CommonMsgSeparator

	// Node-specific messages start here
	// Each node type can define their own starting from this point
)

// CreateChildPayload contains node type and optional name for creating a child node
type CreateChildPayload struct {
	NodeType int    // Will be nerd.NodeType, but avoiding circular import
	Name     string // Empty string means auto-generate name
}

// RenameChildPayload contains old and new names for renaming a child node
type RenameChildPayload struct {
	OldName string
	NewName string
}
