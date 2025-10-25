# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Nerd is a software architecture framework for building small personal agents with Go backends and TypeScript frontends. It implements a hierarchical tree-based architecture where nodes communicate through message passing.

## Build & Development Commands

### Go Backend

```bash
# Build the binary
go build -o nerd ./cmd/nerd

# Initialize the database
./nerd init -d ./nerd.db

# Run the service (starts HTTP server on :8080)
./nerd run -d ./nerd.db

# Generate test data (creates random tree of nodes)
./nerd generate -d ./nerd.db -u Mate -c 100

# Run all tests
go test ./...

# Run specific test package
go test ./internal/internal_test/

# Run single test
go test ./internal/internal_test/ -run TestIntegration
```

### TypeScript Frontend

```bash
# Type check TypeScript (no emit)
cd web && npx tsc --noEmit

# Bundle GUI with esbuild
npx esbuild ./web/src/gui.ts --bundle --format=esm --outfile=./web/dist/gui.js --sourcemap --minify --tree-shaking=false

# Both steps (using go generate)
go generate ./generate.go
```

## Architecture

### Core Concept: Actor-Model Message Passing

The system uses an actor-model where each node runs in its own goroutine and communicates exclusively through message passing. Nodes never share memory directly.

- **Message Channels**: Each node has an `Incoming` channel (type `msg.MsgChan`) for receiving messages
- **Two Communication Modes**:
  - `Ask`: Blocking request-response (creates `APipe` answer channel)
  - `Notify`: Fire-and-forget (no answer expected)
- **Message Routing**: The `tree` package maintains a registry mapping `NodeID` to `*msg.Tag` for routing

### Three-Layer Architecture

1. **HTTP Layer** (`internal/server/`)
   - Handles WebSocket connections and HTTP API
   - Converts HTTP requests to `imsg.IMsg` (interface messages)
   - JWT-based authentication with httpOnly cookies
   - Serves static files from `web/dist/`

2. **Adapter Layer** (`internal/tree/adapter.go`)
   - Translates between `imsg.IMsg` (interface messages) and `msg.Msg` (native messages)
   - Routes interface messages to appropriate nodes
   - Functions like `IAsk()`, `IAskAuth()` are the entry points
   - Manages node lifecycle (adds/removes tags from tree registry)

3. **Node Layer** (`sdk/node/`, `internal/builtin/`)
   - Implements business logic in individual node types
   - All nodes embed `sdk/node.Entity` which provides shared functionality
   - Common message handlers in `internal/builtin/handlers.go`
   - Node-specific handlers in their respective files (e.g., `internal/builtin/User.go`)

### Node System

**Entity Structure** (`sdk/node/entity.go`):
- All nodes embed `*Entity` which contains:
  - `*msg.Tag`: Routing information (NodeID, Incoming channel, Admin flag)
  - `Name`, `NodeType`, `ParentID`: Identity fields
  - `Children`: Map of child names to their tags
  - `CacheValidity`: Tree cache invalidation tracking
  - Database timestamps (GORM model)

**Node Interface** (`sdk/node/types.go`):
Every node must implement:
```go
type Node interface {
    GetEntity() *Entity
    GetTag() *msg.Tag
    Run()        // Start the node's message processing goroutine
    Save() error // Persist to database
    Load() ([]*msg.Tag, error) // Load from database with children
    Shutdown()   // Cleanup before deletion
}
```

**Built-in Node Types** (`internal/builtin/`):
- `Root`: Top-level node (ID: 1), parent of all system nodes
- `Authenticator`: Manages user authentication and creation
- `User`: Represents authenticated users with password hashing
- `Group`: Generic organizational container
- `GUI`: WebSocket-connected frontend instances (not yet implemented)

**Node Registry** (`internal/builtin/registry.go`):
- Maps `NodeType` to constructor functions
- `NewNode(nodeType, name)` creates appropriate node instance
- `LoadNodeFromIdentity(*Entity)` reconstructs nodes from database

### Message Flow Example

User creates a child node via HTTP:
1. HTTP POST to `/api` with `{type: "CreateChild", targetId: 1, payload: {...}}`
2. Server authenticates JWT, extracts userID
3. `tree.IAsk(imsg.IMsg)` in adapter layer
4. `handleICreateChild()` converts to native `msg.CreateChild`
5. `tag.Ask(&msg.Msg{})` sends message to target node's Incoming channel
6. Node's `Run()` goroutine receives message
7. `handleCommonMessage()` or node-specific handler processes it
8. Handler creates child, saves to DB, starts child's goroutine
9. Response flows back through answer channel
10. Adapter converts response to `imsg.ITag`
11. Server returns JSON to HTTP client

### Database

- **ORM**: GORM with SQLite
- **Schema**: Single `entities` table stores all nodes
- **Persistence**: Only `Entity` fields are persisted (runtime fields like `Children` are reconstructed on load)
- **Loading**: `Entity.Load()` recursively loads entire subtree and starts all nodes
- **Shutdown**: Nodes with positive IDs are persisted; ephemeral nodes (negative IDs) are memory-only

### Cache System

Tree structure caching with automatic invalidation:
- Each node has `CachedTreeEntry` and `CacheValidity.TreeEntry` atomic bool
- `GetTree` message returns cached result if valid
- Any structural change (create/rename/delete child) calls `InvalidateTreeEntry()`
- Invalidation propagates up the tree via `Parent` pointer in `CacheValidity`
- See integration test Phase 10 for performance measurements

### Key Patterns

**Two-Step Delete Pattern**:
Child deletion requires two messages:
1. Parent sends `DeleteChild` with child ID to itself
2. Parent's handler sends `DeleteSelf` to child
This ensures parent can update its `Children` map after child cleanup.

**Children Query Pattern**:
```go
e.AskChildren(&msg.Msg{Type: msg.GetTree}).Reduce(func(payload any) {
    // Process each successful child response
})
```
Sends message to all children concurrently, collects responses, returns error if any child failed.

**Ephemeral Nodes**:
Nodes with negative IDs (created via counter in `sdk/node/counters.go`) are temporary and not persisted to database.

## Testing Approach

- Integration tests in `internal/internal_test/integration_test.go` cover full lifecycle
- Tests create temporary database, run operations, shutdown, restart, verify persistence
- Use `defer os.Remove(testDB)` for cleanup
- Always defer shutdown: `defer api.IAskShutdown(1, 1)` to ensure clean state

## Common Tasks

**Adding a new node type**:
1. Define `NodeType` constant in `api/nerd/types.go`
2. Add to `NodeTypeName()` switch
3. Create node struct in `internal/builtin/YourNode.go` embedding `*node.Entity`
4. Implement `Node` interface methods (Run, Save, Load, Shutdown)
5. Register in `internal/builtin/registry.go`
6. Add node-specific message types in `sdk/msg/types.go` if needed

**Adding a new message type**:
1. Define `MsgType` constant in `sdk/msg/types.go`
2. Define payload struct if needed
3. Add handler function in `internal/builtin/handlers.go` (common) or node-specific file
4. Update message routing in node's `Run()` method
5. Add interface message type in `api/imsg/imsg.go` if accessible via HTTP
6. Add adapter handler in `internal/tree/adapter.go`

**Debugging message flow**:
- Add logging in `tag.Ask()` or `tag.Notify()` in `sdk/msg/message.go`
- Log in adapter layer handlers to see message translation
- Check node's `Run()` goroutine to see message processing
- Verify tags exist in tree registry with `getTag(nodeID)`
