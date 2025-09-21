package nerd

import (
	"errors"
)

// Message represents a message sent between nodes
type Message struct {
	Type    MessageType
	Payload any
	Answer  AnswerPipe // nil for Notify mode, set for Ask mode
}

// Answer represents a response with payload and error
type Answer struct {
	Payload any
	Error   error
}

// MessageType defines the types of messages that can be sent
type MessageType int

const (
	CreateChildMessage MessageType = iota
	QueryMessage
	ShutdownMessage
)

// Pipe is a channel for sending messages to nodes
type Pipe chan Message

// AnswerPipe is a channel for sending answers back
type AnswerPipe chan Answer

// Message passing errors
var (
	// ErrNodeNotFound is returned when trying to access a non-existent node
	ErrNodeNotFound = errors.New("node not found in tree")

	// ErrNodeBusy is returned when a node's incoming pipe is full (non-blocking send failed)
	ErrNodeBusy = errors.New("node is busy (pipe full)")
)

// Notify sends a message to this node (non-blocking)
func (t *Tag) Notify(msgType MessageType, payload any) error {
	msg := Message{
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

// Ask sends a prepared message to this node and waits for response (blocking)
// The message struct should already be prepared with Type and Payload
// This function only sets up the answer channel and handles the send
func (t *Tag) Ask(msg *Message) (any, error) {
	// Create answer pipe for response (buffered length 1)
	answer := make(AnswerPipe, 1)

	// Set the answer channel on the prepared message
	msg.Answer = answer

	// Send the message (copy occurs here during channel send)
	t.Incoming <- *msg

	// Wait for response
	a := <-answer
	return a.Payload, a.Error
}
