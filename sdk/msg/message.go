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

// Notify sends a message from sender to receiver (non-blocking)
func (sender *Tag) Notify(receiver *Tag, m *Msg) {
	// Set the sender
	m.Sender = sender
	// Send the message directly (no answer channel needed for notify)
	receiver.Incoming <- *m
}

// Ask sends a prepared message from sender to receiver and waits for response (blocking)
// The message struct should already be prepared with Type and Payload
// This function sets the sender, sets up the answer channel and handles the send
// If the message already has an answer channel (forwarding case), a copy is made
func (sender *Tag) Ask(receiver *Tag, m *Msg) (any, error) {
	if m.APipe != nil {
		// Message forwarding case: make a copy to avoid overwriting original answer channel
		msgCopy := *m
		m = &msgCopy
	}
	m.APipe = make(AnswerChan, 1)
	m.Sender = sender

	// Send the message
	receiver.Incoming <- *m

	// Wait for response
	a := <-m.APipe
	return a.Payload, a.Error
}
