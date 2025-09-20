package nerd

import (
	"errors"
)

// Message passing errors
var (
	// ErrNodeNotFound is returned when trying to access a non-existent node
	ErrNodeNotFound = errors.New("node not found in tree")

	// ErrNodeBusy is returned when a node's incoming pipe is full (non-blocking send failed)
	ErrNodeBusy = errors.New("node is busy (pipe full)")
)

// Notify sends a message to a node (non-blocking) - low-level primitive
func Notify(tree TreeInterface, targetID NodeID, msgType MessageType, payload interface{}) error {
	tag, exists := tree.GetTag(targetID)
	if !exists {
		return ErrNodeNotFound
	}

	msg := &Message{
		Type:    msgType,
		Payload: payload,
		Answer:  nil, // Notify mode - no answer expected
	}

	// Non-blocking send
	select {
	case tag.Incoming <- msg:
		return nil
	default:
		return ErrNodeBusy
	}
}

// Ask sends a message to a node and waits for response (blocking) - low-level primitive
func Ask(tree TreeInterface, targetID NodeID, msgType MessageType, payload interface{}) (*Message, error) {
	tag, exists := tree.GetTag(targetID)
	if !exists {
		return nil, ErrNodeNotFound
	}

	// Create answer pipe for response
	answer := make(Pipe, 1) // Buffered for the response

	msg := &Message{
		Type:    msgType,
		Payload: payload,
		Answer:  answer, // Ask mode - response expected
	}

	// Send the message
	select {
	case tag.Incoming <- msg:
		// Wait for response
		response := <-answer
		if msgResponse, ok := response.(*Message); ok {
			return msgResponse, nil
		}
		return nil, ErrNodeNotFound // Invalid response type
	default:
		return nil, ErrNodeBusy
	}
}

// TreeInterface defines what message functions need from tree
type TreeInterface interface {
	GetTag(nodeID NodeID) (*Tag, bool)
}
