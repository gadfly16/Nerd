package builtin

import (
	"context"
	"log"

	"github.com/coder/websocket"
	"github.com/coder/websocket/wsjson"
	"github.com/gadfly16/nerd/api/imsg"
	"github.com/gadfly16/nerd/api/nerd"
	"github.com/gadfly16/nerd/sdk/msg"
	"github.com/gadfly16/nerd/sdk/node"
)

// GUI represents an ephemeral GUI node for WebSocket communication
type GUI struct {
	*node.Entity
	conn   *websocket.Conn
	ctx    context.Context
	cancel context.CancelFunc
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
		cancel: guipl.CancelFunc,
	}, nil
}

// Save panics for GUI nodes (ephemeral, should never be persisted)
func (n *GUI) Save() error {
	panic("GUI.Save() called - GUI nodes are ephemeral and should never be saved")
}

// Run starts the GUI node goroutine and message loop
func (n *GUI) Run() {
	go n.messageLoop()
	go n.wsReadLoop()
}

// Shutdown gracefully shuts down the GUI node
func (n *GUI) Shutdown() {
	// Unsubscribe from TopoUpdater
	node.System.TopoUpdater.NotifyTopoUnsubscribe(n.Tag)
	log.Printf("GUI node %d unsubscribed from TopoUpdater", n.NodeID)

	// Close WebSocket connection
	if n.conn != nil {
		n.conn.Close(websocket.StatusNormalClosure, "")
	}
}

// messageLoop handles incoming messages
func (n *GUI) messageLoop() {
	// Subscribe to TopoUpdater at the start of message loop
	node.System.TopoUpdater.NotifyTopoSubscribe(n.Tag)
	log.Printf("GUI node %d subscribed to TopoUpdater", n.NodeID)

	// Send initial TopoUpdate since GUI was created before subscription
	im := imsg.IMsg{
		Type: imsg.TopoUpdate,
	}
	err := wsjson.Write(n.ctx, n.conn, im)
	if err != nil {
		log.Printf("Failed to send initial TopoUpdate to GUI. (%d): %v", n.NodeID, err)
	} else {
		log.Printf("Sent initial TopoUpdate to GUI. (%d)", n.NodeID)
	}

	for m := range n.Incoming {
		var a any
		var err error

		// TODO: Pre-process: authorization check

		// Route based on message type
		if m.Type < msg.COMMON_MSG_SEPARATOR {
			a, err = handleCommonMessage(&m, n)
		} else {
			// Node-specific message handling
			switch m.Type {
			case msg.TopoUpdate:
				a, err = n.handleTopoUpdate(&m)
			default:
				err = nerd.ErrUnknownMessageType
			}
		}

		// Post-process: apply any response filtering, logging, etc.
		// TODO: Add post-processing logic here

		// Send response
		m.Reply(a, err)

		// Exit the message loop in case of shutdown or delete self.
		if m.Type == msg.Shutdown {
			break
		}
	}
}

// handleTopoUpdate sends topology update notification to GUI client via WebSocket
func (n *GUI) handleTopoUpdate(_ *msg.Msg) (any, error) {
	// Send TopoUpdate IMsg to WebSocket client
	im := imsg.IMsg{
		Type: imsg.TopoUpdate,
	}

	err := wsjson.Write(n.ctx, n.conn, im)
	if err != nil {
		log.Printf("Failed to send TopoUpdate to GUI node %d: %v", n.NodeID, err)
		return nil, err
	}

	log.Printf("Sent TopoUpdate to GUI node %d", n.NodeID)
	return nil, nil
}

// wsReadLoop reads and deserializes IMsg messages from WebSocket
func (n *GUI) wsReadLoop() {
	for {
		var im imsg.IMsg
		err := wsjson.Read(n.ctx, n.conn, &im)
		if err != nil {
			log.Printf("WebSocket connection closed for GUI node %d: %v", n.NodeID, err)
			break
		}

		// Route based on message type
		switch im.Type {
		case imsg.NodeSubscribe:
			// TODO: Handle NodeSubscribe message
			log.Printf("GUI node %d received NodeSubscribe for target %d", n.NodeID, im.TargetID)
		default:
			log.Printf("GUI node %d received unhandled IMsg type %v for target %d", n.NodeID, im.Type, im.TargetID)
		}
	}
	n.conn.Close(websocket.StatusNormalClosure, "")
	n.cancel() // Signal server that WebSocket is closed
}
