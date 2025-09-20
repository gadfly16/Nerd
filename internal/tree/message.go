package tree

import "errors"

// Pipe is a channel for sending messages to nodes
type pipe chan *message

// MessageType defines the types of messages that can be sent
type messageType int

const (
	createChildMessage messageType = iota
	queryMessage
	shutdownMessage
)

// Message represents a message sent between nodes
type message struct {
	Type    messageType
	Payload interface{}
	Answer  pipe // nil for Send mode, set for Ask mode
}

// Message passing errors
var (
	// ErrNodeNotFound is returned when trying to send a message to a non-existent node
	ErrNodeNotFound = errors.New("node not found in tree")

	// ErrNodeBusy is returned when a node's incoming pipe is full (non-blocking send failed)
	ErrNodeBusy = errors.New("node is busy (pipe full)")
)

// Send sends a message to a node (non-blocking)
func (t *tree) send(targetID nodeID, msgType messageType, payload interface{}) error {
	tag, exists := t.getTag(targetID)
	if !exists {
		return ErrNodeNotFound
	}

	msg := &message{
		Type:    msgType,
		Payload: payload,
		Answer:  nil, // Send mode - no answer expected
	}

	// Non-blocking send
	select {
	case tag.Incoming <- msg:
		return nil
	default:
		return ErrNodeBusy
	}
}

// Ask sends a message to a node and waits for response (blocking)
func (t *tree) ask(targetID nodeID, msgType messageType, payload interface{}) (*message, error) {
	tag, exists := t.getTag(targetID)
	if !exists {
		return nil, ErrNodeNotFound
	}

	// Create answer pipe for response
	answer := make(pipe, 1) // Buffered for the response

	msg := &message{
		Type:    msgType,
		Payload: payload,
		Answer:  answer, // Ask mode - response expected
	}

	// Send the message
	select {
	case tag.Incoming <- msg:
		// Wait for response
		response := <-answer
		return response, nil
	default:
		return nil, ErrNodeBusy
	}
}
