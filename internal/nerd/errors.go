package nerd

import "errors"

// Message passing errors
var (
	// ErrNodeNotFound is returned when trying to access a non-existent node
	ErrNodeNotFound = errors.New("node not found in tree")

	// ErrNodeBusy is returned when a node's incoming pipe is full (non-blocking send failed)
	ErrNodeBusy = errors.New("node is busy (pipe full)")

	// ErrInvalidPayload is returned when message payload is of wrong type
	ErrInvalidPayload = errors.New("invalid payload type")

	// ErrUnsupportedNodeType is returned when trying to create unsupported node type
	ErrUnsupportedNodeType = errors.New("unsupported node type")

	// ErrUnknownMessageType is returned when message type is not recognized
	ErrUnknownMessageType = errors.New("unknown message type")

	// ErrNotImplemented is returned for features not yet implemented
	ErrNotImplemented = errors.New("not yet implemented")

	// ErrChildrenError is returned when at least one child returned an error
	ErrChildrenError = errors.New("one or more children returned errors")

	// ErrNameCollision is returned when trying to rename to an existing child name
	ErrNameCollision = errors.New("name already exists")
)
