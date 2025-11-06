# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## Project Overview

Nerd is an experimental personal microservice platform. It provides a framework
for defining microservices that run as goroutines instead of OS processes. Each
microservice is represented as a node in a hierarchical tree structure, where
nodes communicate through message passing. The platform offers good performance,
high reliability, and a comprehensive GUI for managing the instance.

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

The system uses an actor-model where each node runs in its own goroutine and
communicates exclusively through message passing. Nodes never share memory
directly.

- **Message Channels**: Each node has an `Incoming` channel (type `msg.MsgChan`)
  for receiving messages
- **Two Communication Modes**:
  - `Ask`: Blocking request-response (creates `APipe` answer channel)
  - `Notify`: Fire-and-forget (no answer expected)
- **Message Routing**: The `tree` package maintains a registry mapping `NodeID`
  to `*msg.Tag` for routing

### Three-Layer Architecture

1. **HTTP Layer** (`internal/server/`)
   - Handles WebSocket connections and HTTP API
   - Converts HTTP requests to `imsg.IMsg` (interface messages)
   - JWT-based authentication with httpOnly cookies
   - Serves static files from `web/dist/`

2. **Adapter Layer** (`internal/tree/adapter.go`)
   - Translates between `imsg.IMsg` (interface messages) and `msg.Msg` (native
     messages)
   - Routes interface messages to appropriate nodes
   - Functions like `IAsk()`, `IAskAuth()` are the entry points
   - Manages node lifecycle (adds/removes tags from tree registry)

3. **Node Layer** (`sdk/node/`, `internal/builtin/`)
   - Implements business logic in individual node types
   - All nodes embed `sdk/node.Entity` which provides shared functionality
   - Common message handlers in `internal/builtin/commonHandlers.go`
   - Topology handlers in `internal/tree/topoHandlers.go`
   - Node-specific handlers in their respective files (e.g.,
     `internal/builtin/User.go`)

### Node System

**Entity Structure** (`sdk/node/entity.go`):

- All nodes embed `*Entity` which contains:
  - `*msg.Tag`: Routing information (NodeID, Incoming channel, Admin flag)
  - `Name`, `NodeType`, `ParentID`: Identity fields
  - `Children`: Map of child names to their tags
  - `CacheValidity`: Tree cache invalidation tracking
  - Database timestamps (GORM model)

**Node Interface** (`sdk/node/types.go`): Every node must implement:

```go
type Node interface {
    GetEntity() *Entity
    GetTag() *msg.Tag
    Run()        // Start the node's message processing goroutine
    Save() error // Persist to database
    Shutdown()   // Cleanup before deletion
}
```

**Built-in Node Types** (`internal/builtin/`):

- `Root`: Top-level node (ID: 1), parent of all system nodes
- `Authenticator`: Manages user authentication and creation
- `User`: Represents authenticated users with password hashing
- `Group`: Generic organizational container
- `GUI`: WebSocket-connected frontend instances

**Node Registry** (`internal/builtin/nodes.go`):

- Maps `NodeType` to constructor functions
- `NewNode(pe, pl)` creates appropriate node instance
- `LoadBuiltinNodeFromEntity(*Entity)` reconstructs nodes from database

### Message Flow Example

User creates a child node via HTTP:

1. HTTP POST to `/api` with `{type: "CreateChild", targetId: 1, payload: {...}}`
2. Server authenticates JWT, extracts userID
3. `tree.IAsk(imsg.IMsg)` in adapter layer
4. `handleICreateChild()` converts to native `msg.CreateChild`
5. `tag.Ask(&msg.Msg{})` sends message to target node's Incoming channel
6. Node's `Run()` goroutine receives message
7. `handleCommonMessage()` or topology handler processes it
8. Handler creates child, saves to DB, starts child's goroutine
9. Response flows back through answer channel
10. Adapter converts response to `imsg.ITag`
11. Server returns JSON to HTTP client

### Database

- **ORM**: GORM with SQLite
- **Schema**: Single `entities` table stores all nodes
- **Persistence**: Only `Entity` fields are persisted (runtime fields like
  `Children` are reconstructed on load)
- **Loading**: `Entity.Load()` recursively loads entire subtree and starts all
  nodes
- **Shutdown**: Nodes with positive IDs are persisted; ephemeral nodes (negative
  IDs) are memory-only

### Cache System

Tree structure caching with automatic invalidation:

- Each node has `CachedTreeEntry` and `CacheValidity.TreeEntry` atomic bool
- `GetTree` message returns cached result if valid
- Any structural change (create/rename/delete child) calls
  `InvalidateTreeEntry()`
- Invalidation propagates up the tree via `Parent` pointer in `CacheValidity`
- See integration test Phase 10 for performance measurements

## GUI Architecture

The frontend (`web/src/`) uses Web Components (Custom Elements) following the Vertigo design pattern for hierarchical tree visualization.

### Vertigo Components

**Component Hierarchy**:
- `VBranch` - Root container for a displayed tree
  - `VNode` - Single node with its visual elements
    - `VOpen` - Open/close icon
    - `VHeader` - Node name and state icon
    - `VSidebar` - Visual sidebar extending below open icon
    - `VState` - State detail panel (optional, toggled)
      - `VValue` - Individual value display
    - `VChildren` - Container for child VNodes

**Component Lifecycle Pattern**:

All components follow a consistent pattern using `connectedCallback()` and `disconnectedCallback()`:

1. **Creation via Fresh()**: Components are created with static `Fresh(parent)` method:
   ```typescript
   static Fresh(p: HTMLElement): ComponentType {
     const element = document.createElement("component-tag") as ComponentType
     p.appendChild(element) // or p.prepend(element) for VState
     return element
   }
   ```

2. **Connection**: `connectedCallback()` queries and caches parent/ancestor references:
   ```typescript
   connectedCallback() {
     this.parent = this.parentElement!.closest("v-node") as VNode | null
     if (this.parent) {
       this.vbranch = this.parent.vbranch
     } else {
       this.vbranch = this.closest("v-branch") as VBranch
     }
   }
   ```

3. **Disconnection**: `disconnectedCallback()` clears parent's reference to this component:
   ```typescript
   disconnectedCallback() {
     this.parent.component = null as any
   }
   ```

**Parent Reference Pattern**:

- `VNode` stores `parent: VNode | null` and `vbranch: VBranch`
- `VChildren` stores `vnode: VNode`
- `VState` stores `vnode: VNode`
- `VOpen`, `VHeader`, `VSidebar` are queried and cached by VNode

This allows components to access ancestors without passing references through Update() calls.

**Update Pattern**:

Components follow the "old-new swap" pattern:

```typescript
Update(newData: TreeEntry, ...): void {
  // Store old state and immediately update current state
  this.oldte = this.te
  this.te = newData

  // Use this.oldte and this.te for diff/comparison throughout
  if (this.oldte.name !== this.te.name) {
    this.updateName(this.te.name)
  }
}
```

Key principles:
- New state is written to `this.te` immediately at function entry
- Old state stored in `this.oldte` for comparisons
- No reassignment of `this.te` at function exit
- Child components access parent state via `this.parent.te` and `this.parent.oldte`

**Value System**:

Values are displayed with seals (type indicators) and can be editable parameters:

- **Seals**: Map short string identifiers to `Idea` enums (e.g., "#" → NodeId, "secret" → Secret)
- **Ideas**: Fixed-size array organizing seals by their idea type
- **VValue**: Displays name, value, and seal; handles secrets with "••••" placeholder
- **Parameters**: Underlined values/seals indicate editability

**Memory Management**:

- Components rely on browser GC after DOM removal
- `disconnectedCallback()` clears parent references to enable GC
- No manual cleanup of Maps/Arrays needed - removed with component

### Key Patterns

**Two-Step Delete Pattern**: Child deletion requires two messages:

1. Parent sends `DeleteChild` with child ID to itself
2. Parent's handler sends `DeleteSelf` to child

This ensures parent can update its `Children` map after child cleanup.

**Children Query Pattern**:

```go
e.AskChildren(&msg.Msg{Type: msg.GetTree}).Reduce(func(payload any) {
    // Process each successful child response
})
```

Sends message to all children concurrently, collects responses, returns error if
any child failed.

**Ephemeral Nodes**: Nodes with negative IDs (created via counter in
`sdk/node/counters.go`) are temporary and not persisted to database. Runtime
nodes (like GUI) use this mechanism.

**Dependency Injection Pattern**: To avoid circular dependencies between layers:

- `builtin.RegisterTopoDispatcher()` allows tree layer to handle topology
  operations
- `node.RegisterLoadBuiltinNodeFromEntity()` allows builtin layer to handle node
  loading
- These are set via `init()` functions at startup

## Testing Approach

- Integration tests in `internal/internal_test/integration_test.go` cover full
  lifecycle
- Tests create temporary database, run operations, shutdown, restart, verify
  persistence
- Use `defer os.Remove(testDB)` for cleanup
- Always defer shutdown: `defer api.IAskShutdown(1, 1)` to ensure clean state

## Common Tasks

**Adding a new node type**:

1. Define `NodeType` constant in `api/nerd/types.go`
2. Add to `NodeType.Info()` method with allowed children
3. Create node struct in `internal/builtin/YourNode.go` embedding `*node.Entity`
4. Implement `Node` interface methods (Run, Save, Shutdown)
5. Add constructor `newYourNode()` and loader `loadYourNode()` functions
6. Register in `internal/builtin/loadDispatch.go` switch statement
7. Register in `internal/builtin/nodes.go` NewNode() switch
8. Add node-specific message types in `sdk/msg/types.go` if needed

**Adding a new message type**:

1. Define `MsgType` constant in `sdk/msg/types.go`
2. Define payload struct if needed
3. Add handler function in `internal/builtin/commonHandlers.go` (common) or
   node-specific file
4. Update message routing in node's `messageLoop()` method
5. Add interface message type in `api/imsg/imsg.go` if accessible via HTTP
6. Add adapter handler in `internal/tree/adapter.go`

**Debugging message flow**:

- Add logging in `tag.Ask()` or `tag.Notify()` in `sdk/msg/message.go`
- Log in adapter layer handlers to see message translation
- Check node's `messageLoop()` goroutine to see message processing
- Verify tags exist in tree registry with `registry.get(nodeID)`
