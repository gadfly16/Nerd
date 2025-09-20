package message

import (
	"github.com/gadfly16/nerd/internal/tree/system"
)

// Send sends a message to a node (non-blocking)
func Send(sys *system.System, targetID system.NodeID, msgType system.MessageType, payload interface{}) error {
	tag, exists := sys.GetTag(targetID)
	if !exists {
		return system.ErrNodeNotFound
	}

	msg := &system.Message{
		Type:    msgType,
		Payload: payload,
		Answer:  nil, // Send mode - no answer expected
	}

	// Non-blocking send
	select {
	case tag.Incoming <- msg:
		return nil
	default:
		return system.ErrNodeBusy
	}
}

// Ask sends a message to a node and waits for response (blocking)
func Ask(sys *system.System, targetID system.NodeID, msgType system.MessageType, payload interface{}) (*system.Message, error) {
	tag, exists := sys.GetTag(targetID)
	if !exists {
		return nil, system.ErrNodeNotFound
	}

	// Create answer pipe for response
	answer := make(system.Pipe, 1) // Buffered for the response

	msg := &system.Message{
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
		return nil, system.ErrNodeBusy
	}
}
