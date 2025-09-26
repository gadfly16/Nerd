# Nerd: Personal Software Agent Architecture

Nerd is a software architecture framework for building small personal agents
that run continuously on modest hardware. The framework consists of Go instances
paired with TypeScript GUIs, organized around tree structures of communicating
nodes.

The name "Nerd" comes from "a herd of nodes" - nodes representing concurrent
microservices doing things on the user's behalf.

## Quick Start

See [Development Guide](#commands) for build and test commands.

## Core Architecture

### Terminology

- **Service**: Complete package consisting of an instance and its connected GUIs
- **Instance**: Backend executable that maintains state and business logic
- **GUI**: Frontend that connects to display and interact with an instance
- **Node**: Fundamental unit representing either a goroutine or organizational
  group

### Key Design Principles

**Node-Centric Organization**: Everything is organized as trees of communicating
nodes (one node = one goroutine). Each node has:

- **Identity**: Tree position and routing information
- **Status**: Read-only runtime state and performance data
- **Config**: User-controllable settings

**Message Passing**: Nodes communicate via Notify/Ask patterns through
strongly-typed channels:

- Downward channels from parents to children (deadlock prevention)
- Children cannot directly ask ancestors
- Updates flow upstream via special Updater nodes

**GUI-First**: Architecture prioritizes real-time GUI updates and tree
visualization over CLI convenience. The GUI's sole responsibility is displaying
the node tree as effectively as possible.

### Current Implementation

**Package Structure:**

Designed for extensibility - developers can create custom nodes while
architectural constraints are enforced through package boundaries:

```
Part packages (core framework):
├── tree (internal)    - orchestrates node tree, HTTP/WS → native message translation
├── server (internal)  - HTTP/WebSocket server
└── builtin (internal) - Nerd's built-in node implementations

Message packages:
├── msg (public)       - native message types and payloads
├── httpMsg (internal) - HTTP message types and payloads
└── wsMsg (internal)   - WebSocket message types and payloads

Core types:
└── nerd (public)      - basic types for native message construction

SDK packages (public API):
├── api (public)       - main entry point for registration and startup
└── node (public)      - complete SDK for custom node development
```

**SDK Design**: Custom nodes only import `node`, `msg`, and `nerd` packages,
preventing access to internal framework details. The `node` package provides
messaging functions, system coordination, and interfaces - making the "easy
path" the "correct path".

**Node Types**: Currently 2 foundational types (Root, Group) with 5 more planned
including GUI nodes representing connected interfaces.

**Database**: SQLite with Gorm using Identity/Config separation. Each node
handles its own database operations for security and reliability.

**Messaging**: `Pipe` channels carry `Msg` values for efficiency, while handlers
receive `*Msg` pointers for flexibility. Message types are centralized in
`internal/msg` package.

## Development Guide

### Commands

```bash
# Build
go build -o nerd ./cmd/nerd

# Initialize database
./nerd init

# Run tests
go test ./...
go test -v ./internal/nerd
go test -run TestFunctionName ./internal/nerd

# Run system integration tests
go test ./internal -v
```

### Testing

Uses **persistent test tree approach** for realistic system validation. Single
test environment accumulates state through user interaction sequences rather
than isolated unit tests. Validates distributed message passing, parent-child
coordination, and graceful shutdown across evolving tree structures.

### Code Style

- Always format Go code with `gofmt`
- Use tabs for indentation
- No trailing whitespace
- Follow financial reliability pattern: database commits before UI updates

### Development Philosophy

**Discussion Before Implementation**: This project follows "vibe coding" -
discuss engineering decisions and reason through trade-offs before committing to
code. Don't jump straight into implementation.

### Current Status

**✅ Completed:**

- Database schema with Identity/Config separation
- Node type system (2 foundational types: Root, Group)
- CLI framework with `init` command
- Message passing infrastructure with strongly-typed channels
- Tree structure for node organization
- Thread-safe tag-based routing system
- Runtime-based initialization with graceful shutdown
- Two-phase rename system with collision detection
- Centralized message types in `internal/msg` package
- API split into initialization and adapter layers
- Handler separation for better code organization
- Memory optimization with children map initialization

**🚧 In Progress:**

- Additional node types for specialized functionality

**📋 TODO:**

- Remaining 5 node types (including GUI node type)
- `run` command implementation
- HTTP/WebSocket servers
- GUI (TypeScript with Web Components)
- Real-time update system

---

## Appendix: Design Philosophy & Rationale

This section explains why Nerd makes unconventional architectural choices
optimized for personal-scale systems rather than enterprise patterns.

### Personal-Scale vs Enterprise Design

Nerd is purpose-built for **single-person information systems** rather than
enterprise-scale services. This fundamental shift from "serving millions" to
"serving one person deeply" enables architectural choices that would be
impractical at enterprise scale.

### GUI-First Architecture

**Decision**: Design as GUI-first rather than CLI-first, fundamentally changing
architectural priorities.

**Enterprise Pattern**: Most server software prioritizes CLI interfaces, APIs,
and configuration files, with GUIs being secondary.

**Personal-Scale Rationale**:

- Single user benefits from rich, interactive interfaces rather than scriptable
  CLIs
- 24/7 running agents need monitoring interfaces that are immediately accessible
- Tree visualization is naturally suited to GUI representation
- Real-time performance: WebSocket-based updates, live topology changes, lazy
  loading

**Trade-off**: Creates unusual development experiences that require custom
tooling rather than compromising architectural principles.

### Integrated Logging Architecture

**Decision**: Couple logging directly with the instance rather than using
separate log collectors and storage.

**Enterprise Pattern**: Logging flows through pipelines (Service → Collector →
Storage → Analysis).

**Personal-Scale Rationale**:

- Manageable log volumes don't require distributed collection
- Eliminates operational complexity from 4+ components to 1
- Direct log access provides immediate debugging visibility
- Resource efficiency on modest hardware
- Intentional complexity when cross-service access is needed

### Concurrent Node Architecture

**Decision**: Implement every node as a goroutine with strict communication
patterns.

**Core Design**:

- One Node = One Goroutine mapping
- Downward channels (blocking) from parents to children
- Pull-based queries as primary pattern (parents query children)
- Push-based Updater pattern for exceptional upstream notifications

**Benefits**:

- Goroutines consume minimal resources when idle (~2KB each)
- Eliminates circular dependencies through communication constraints
- Predictable concurrency model with deterministic data flow
- Node-level atomic updates with acceptable tree-level eventual consistency

### Single Executable Deployment

**Decision**: Target single executable binaries for flexible deployment.

**Benefits**:

- Simple deployment (single file)
- Container-ready when needed
- Environment agnostic
- Lean binaries suitable for modest hardware

### Minimal Dependency GUI

**Decision**: Build TypeScript GUI using Web Components and WebAPIs,
aggressively avoiding npm dependencies.

**Philosophy**: "Think first, then think some more, and if we still want to
bring in the dependency we think more. And if it involves npm we think until we
let it go."

**Benefits**:

- Long-term stability for 24/7 agents
- Fewer security vulnerabilities
- Direct mapping between nodes and Web Components
- Reduced maintenance burden

### Database Architecture

**Decision**: Distributed database access where each node handles its own
operations.

**Pattern**: SQLite with Gorm enables safe concurrent access. Identity/Config
struct separation with manual composition.

**Benefits**:

- Security (nodes load their own credentials)
- Financial reliability (database commits before UI updates)
- Alignment with distributed architecture
- No centralized database service bottleneck

---

_This document serves as both technical documentation and engineering
justification for architectural decisions that diverge from conventional
enterprise patterns in favor of personal computing optimization._
