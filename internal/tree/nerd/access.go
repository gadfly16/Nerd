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

// Notify sends a message to this node (non-blocking)
func (t *Tag) Notify(msgType MessageType, payload interface{}) error {
	msg := &Message{
		Type:    msgType,
		Payload: payload,
		Answer:  nil, // Notify mode - no answer expected
	}

	// Non-blocking send
	select {
	case t.Incoming <- msg:
		return nil
	default:
		return ErrNodeBusy
	}
}

// Ask sends a message to this node and waits for response (blocking)
func (t *Tag) Ask(msgType MessageType, payload interface{}) (*Message, error) {
	// Create answer pipe for response
	answer := make(Pipe, 1) // Buffered for the response

	msg := &Message{
		Type:    msgType,
		Payload: payload,
		Answer:  answer, // Ask mode - response expected
	}

	// Send the message
	select {
	case t.Incoming <- msg:
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
