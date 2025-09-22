package nerd

// Msg represents a message sent between nodes
type Msg struct {
	Type    MsgType
	Payload any
	Answer  AnswerPipe // nil for Notify mode, set for Ask mode
}

// Answer represents a response with payload and error
type Answer struct {
	Payload any
	Error   error
}

// MsgType defines the types of messages that can be sent
type MsgType int

const (
	// Common messages (handled by Identity)
	Create_Child_Msg MsgType = iota
	Shutdown_Msg
	Get_Config_Msg

	// Separator - messages >= this value are node-specific
	CommonMsgSeparator

	// Node-specific messages start here
	// Each node type can define their own starting from this point
)

// Pipe is a channel for sending messages to nodes
type Pipe chan Msg

// AnswerPipe is a channel for sending answers back
type AnswerPipe chan Answer

// Reply sends a response back on this message's answer channel
// Does nothing if this message has no answer channel (was a Notify)
func (m *Msg) Reply(payload any, err error) {
	if m.Answer != nil {
		m.Answer <- Answer{
			Payload: payload,
			Error:   err,
		}
	}
}

// Notify sends a message to this node (non-blocking)
func (t *Tag) Notify(msgType MsgType, payload any) error {
	m := Msg{
		Type:    msgType,
		Payload: payload,
		Answer:  nil, // Notify mode - no answer expected
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
func (t *Tag) Ask(m *Msg) (any, error) {
	// Create answer pipe for response (buffered length 1)
	answer := make(AnswerPipe, 1)

	// Set the answer channel on the prepared message
	m.Answer = answer

	// Send the message (copy occurs here during channel send)
	t.Incoming <- *m

	// Wait for response
	a := <-answer
	return a.Payload, a.Error
}
