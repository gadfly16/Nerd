package builtin

import (
	"context"

	"github.com/coder/websocket"
	"github.com/gadfly16/nerd/api/nerd"
	"github.com/gadfly16/nerd/sdk/msg"
	"github.com/gadfly16/nerd/sdk/node"
)

// GUI represents an ephemeral GUI node for WebSocket communication
type GUI struct {
	*node.Entity
	conn *websocket.Conn
	ctx  context.Context
}

// newGUI creates a new GUI node instance (ephemeral, not persisted)
func newGUI(e *node.Entity, pl msg.CreateChildPayload) (*GUI, error) {
	guipl, ok := pl.Spec.(msg.CreateGUIPayload)
	if !ok {
		return nil, nerd.ErrInvalidPayload
	}
	return &GUI{
		Entity: e,
		conn:   guipl.Conn,
		ctx:    guipl.Ctx,
	}, nil
}

// Save panics for GUI nodes (ephemeral, should never be persisted)
func (n *GUI) Save() error {
	panic("GUI.Save() called - GUI nodes are ephemeral and should never be saved")
}

// Run starts the GUI node goroutine and message loop
func (n *GUI) Run() {
	go n.messageLoop()
}

// Shutdown gracefully shuts down the GUI node
func (n *GUI) Shutdown() {
	// Close WebSocket connection
	if n.conn != nil {
		n.conn.Close(websocket.StatusNormalClosure, "")
	}
}

// messageLoop handles incoming messages
func (n *GUI) messageLoop() {
	for m := range n.Incoming {
		var a any
		var err error

		// TODO: Pre-process: authorization check

		// Route based on message type
		if m.Type < msg.COMMON_MSG_SEPARATOR {
			// Common message - handle via Entity
			a, err = handleCommonMessage(&m, n)
		} else {
			// Node-specific message handling
			switch m.Type {
			default:
				err = nerd.ErrUnknownMessageType
			}
		}

		// Post-process: apply any response filtering, logging, etc.
		// TODO: Add post-processing logic here

		// Send response
		m.Reply(a, err)

		// Exit the message loop in case of shutdown. The message is already
		// handled as a common message
		if m.Type == msg.Shutdown {
			break
		}
	}
}
