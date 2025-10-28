package msg

// Reply sends a response back on this message's answer channel
// For messages from Notify(), this is a no-op since there's no answer channel
func (m *Msg) Reply(payload any, err error) {
	if m.APipe == nil {
		return // No-op for notifications
	}
	m.APipe <- Answer{
		Payload: payload,
		Error:   err,
	}
}

// Notify sends a message to this node (non-blocking)
func (t *Tag) Notify(m *Msg) {
	// Send the message directly (no answer channel needed for notify)
	t.Incoming <- *m
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
	m.APipe = make(AnswerChan, 1)

	// Send the message
	t.Incoming <- *m

	// Wait for response
	a := <-m.APipe
	return a.Payload, a.Error
}
