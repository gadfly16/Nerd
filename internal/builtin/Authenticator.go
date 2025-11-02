package builtin

import (
	"fmt"

	"github.com/gadfly16/nerd/api/nerd"
	"github.com/gadfly16/nerd/sdk/msg"
	"github.com/gadfly16/nerd/sdk/node"
)

// Authenticator represents the authentication singleton node
type Authenticator struct {
	*node.Entity
	// Note: Authenticator nodes don't have configs
}

// loadAuthenticator creates an Authenticator node from an existing Entity loaded from database
func loadAuthenticator(identity *node.Entity) (node.Node, error) {
	// Create Authenticator node with the loaded identity
	auth := &Authenticator{
		Entity: identity,
	}

	// Register as system singleton
	node.System.Authenticator = identity.Tag

	// Authenticator nodes have no configuration to load
	return auth, nil
}

// newAuthenticator creates a new Authenticator node instance
func newAuthenticator(entity *node.Entity) *Authenticator {
	auth := &Authenticator{
		Entity: entity,
	}

	// Register as system node for easy access
	node.System.Authenticator = entity.Tag

	return auth
}

// Save persists the Authenticator node to the database
func (n *Authenticator) Save() error {
	// Note: Only saves Entity, no config for Authenticator nodes
	return node.DB.Save(n.Entity).Error
}

// Run starts the Authenticator node goroutine and message loop
func (n *Authenticator) Run() {
	go n.messageLoop()
}

// Shutdown gracefully shuts down the Authenticator node and all children
func (n *Authenticator) Shutdown() {
	// Clear system reference
	node.System.Authenticator = nil
}

// messageLoop handles incoming messages
func (n *Authenticator) messageLoop() {
	for m := range n.Incoming {
		var a any
		var err error

		// Authorization check (message-type specific)
		authorized := m.Sender == n.Tag.Owner || m.Sender.Admin

		if !authorized {
			// Special case: RenameChild/DeleteChild allowed if sender is operating on themselves
			switch m.Type {
			case msg.RenameChild:
				pl := m.Payload.(msg.RenameChildPayload)
				if childTag, exists := n.Children[pl.OldName]; exists && childTag == m.Sender {
					authorized = true
				}
			case msg.DeleteChild:
				childName := m.Payload.(string)
				if childTag, exists := n.Children[childName]; exists && childTag == m.Sender {
					authorized = true
				}
			}
		}

		if !authorized {
			m.Reply(nil, nerd.ErrUnauthorized)
			continue
		}

		// Route based on message type
		if m.Type < msg.COMMON_MSG_SEPARATOR {
			// Common message - handle via Entity
			a, err = handleCommonMessage(&m, n)
		} else {
			// Node-specific message handling
			switch m.Type {
			case msg.AuthenticateUser:
				a, err = n.handleAuthenticateUser(&m)
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

// handleAuthenticateUser authenticates a user by username and password
func (n *Authenticator) handleAuthenticateUser(m *msg.Msg) (any, error) {
	pl, ok := m.Payload.(msg.CredentialsPayload)
	if !ok {
		return nil, fmt.Errorf("invalid pl type for AuthenticateUser")
	}

	// Look up user by name
	userTag, exists := n.Children[pl.Username]
	if !exists {
		return nil, fmt.Errorf("user not found")
	}

	// Forward Authenticate message to user (owner is the sender)
	return n.Tag.Owner.AskAuthenticate(userTag, pl.Password)
}
