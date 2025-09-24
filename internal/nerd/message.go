package nerd

import "github.com/gadfly16/nerd/internal/msg"

// Msg represents a message sent between nodes
type Msg struct {
	Type    msg.MsgType
	Payload any
	APipe   AnswerPipe // nil for Notify mode, set for Ask mode
}

// Answer represents a response with payload and error
type Answer struct {
	Payload any
	Error   error
}

// Pipe is a channel for sending messages to nodes
type Pipe chan Msg

// AnswerPipe is a channel for sending answers back
type AnswerPipe chan Answer

// Reply sends a response back on this message's answer channel
func (m *Msg) Reply(payload any, err error) {
	m.APipe <- Answer{
		Payload: payload,
		Error:   err,
	}
}

// Notify sends a message to this node (non-blocking)
func (t *Tag) Notify(msgType msg.MsgType, payload any) error {
	m := Msg{
		Type:    msgType,
		Payload: payload,
	}

	// Non-blocking send
	select {
	case t.Incoming <- m:
		return nil
	default:
		return ErrNodeBusy
	}
}

// Ask sends a prepared message to this node and waits for response (blocking)
// The message struct should already be prepared with Type and Payload
// This function only sets up the answer channel and handles the send
// If the message already has an answer channel (forwarding case), a copy is made
func (t *Tag) Ask(m *Msg) (any, error) {
	if m.APipe != nil {
		// Message forwarding case: make a copy to avoid overwriting original answer channel
		msgCopy := *m
		m = &msgCopy
	}
	m.APipe = make(AnswerPipe, 1)

	// Send the message
	t.Incoming <- *m

	// Wait for response
	a := <-m.APipe
	return a.Payload, a.Error
}
