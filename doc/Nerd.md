# Nerd: Personal Software Agent Architecture

## Overview

Nerd is a software architecture framework designed specifically for building
small personal agents that run continuously on modest hardware. The framework
consists of Go instances paired with TypeScript GUIs, organized around tree
structures of communicating nodes.

The name "Nerd" comes from "a herd of nodes" - nodes representing concurrent
microservices doing things on the user's behalf on the Internet.

A _service_ built with Nerd consists of an _instance_ (the executable) and
connected _GUIs_.

## Terminology

**Fundamental Nerd Architecture Components**:

- **Service**: The complete package consisting of an instance and its connected
  GUIs. A Nerd service is not complete without both components.
- **Instance**: The backend/server component - the main entity that runs as an
  executable with a network location. This is the persistent, addressable
  component that maintains state and business logic.
- **GUI**: The frontend component that connects to an instance. Multiple GUIs
  can connect to a single instance from anywhere on the network. GUIs are pure
  display layers that never maintain independent state or communicate directly
  with external services.

**Key Relationships**:

- An instance is the primary entity with a network address (even if the IP
  changes frequently)
- GUIs are interface clients that can connect from anywhere to view and interact
  with an instance
- The instance serves as the single source of truth; GUIs display exactly what
  the instance knows

## Core Design Philosophy

This architecture is purpose-built for **single-person information systems**
rather than enterprise-scale services handling millions of users. Every design
decision prioritizes the specific requirements and constraints of personal
agents that manage one person's data, workflows, and digital interactions while
running 24/7 on consumer hardware.

The fundamental shift from "serving millions" to "serving one person deeply"
enables architectural choices that would be impractical or impossible at
enterprise scale.

## Key Concepts

### Nodes as Organizational Units

- **Node**: The fundamental organizational unit that can represent either:
  - A goroutine communicating with external web services
  - A service goroutine handling requests (when building services within the
    Nerd ecosystem)
  - An organizational node usually called a group node
- **Tree Structure**: Nodes are organized in hierarchical trees that serve dual
  purposes:
  - Clear organizational boundaries and communication patterns
  - **Aggregation flow control**: Parent nodes can automatically aggregate data
    from their children

### Tree-Based Aggregation System

The hierarchical structure directly determines data flow and UI presentation:

- **Logs**: View a parent node to see aggregated logs from all child nodes
- **Metrics**: Parent nodes automatically roll up metrics from their subtree
- **Status**: System health bubbles up through the tree hierarchy
- **Dynamic Reorganization**: Users can restructure trees to create different
  aggregation views without changing underlying services

The node tree creates a **generalized display layer** where the tree structure
drives what data gets aggregated and how it's presented, eliminating the need
for custom aggregation logic in individual services.

### Example: DDNS Service Architecture

**Client Side**:

- Web interface with nodes representing domains that need IP updates
- Each domain node manages its own update logic and state

**Server Side**:

- Nodes representing goroutines handling incoming update requests
- Nodes representing connected clients and their associated domains
- Clean separation between request handling and client relationship management

This demonstrates how nodes provide a consistent organizational model whether
you're consuming external services or building services within the Nerd
ecosystem.

## Design Decisions & Rationale

### Integrated Logging Architecture

**Decision**: Couple logging directly with the instance and containerize as a
single unit, rather than using separate log collectors, storage solutions, and
analysis tools.

**Enterprise Pattern**: Logging typically flows through a pipeline: Service →
Log Collector → Storage Solution → Analysis Tools. This provides scalability,
centralized management, and separation of concerns.

**Personal-Scale Rationale**:

- **Load Reality**: Personal agents generate manageable log volumes that don't
  require distributed collection
- **Operational Simplicity**: Eliminating the logging pipeline reduces
  operational complexity from 4+ components to 1
- **Debugging Experience**: Direct access to logs alongside the service provides
  immediate visibility during development and troubleshooting
- **Resource Efficiency**: Avoiding network hops and intermediate storage
  reduces resource overhead on modest hardware
- **Data Locality**: Keeping logs close to their generating service eliminates
  latency and potential data loss during collection
- **Intentional Integration**: When cross-service log access is needed (e.g.,
  server accessing client logs), the framework provides straightforward
  mechanisms for developers to explicitly enable this, rather than forcing
  automatic distributed collection

**Key Insight**: This approach replaces "automatic complexity" with "intentional
complexity" - developers choose when and how to share logs between services,
maintaining the simplicity benefits while enabling sophisticated scenarios when
needed.

This architectural choice would be impractical at enterprise scale but provides
significant advantages for single-person systems where operational simplicity
and debugging experience outweigh the scalability benefits of distributed
logging.

### Concurrent Node Architecture (Go Instance)

**Decision**: Implement every node as a goroutine with strict communication
patterns to ensure deadlock-free concurrent execution.

**Core Design**:

- **One Node = One Goroutine**: Direct mapping between logical nodes and Go
  concurrency primitives
- **Downward Channels**: Tree structure implemented via unbuffered (blocking)
  channels from parents to children
- **Upstream Communication Constraint**: Children cannot _ask_ directly to
  ancestors (deadlock prevention)
- **Pull-Based Default**: Parents query downstream nodes for information through
  the downward channels (no updaters needed)
- **Push-Based Exception**: Updater Pattern for downstream nodes that need to
  independently notify upstream about state changes

**Deadlock Prevention Strategy**: By forbidding direct child-to-parent
communication and using pull-based queries as the primary pattern, the system
eliminates most circular dependencies. Updaters only handle exceptional push
notifications when downstream nodes must independently alert upstream.

**Scalability Characteristics**: Goroutines consume minimal resources when idle
(~2KB memory overhead each), enabling thousands of concurrent nodes with good
performance. This makes the one-node-one-goroutine mapping practical at
significant scale without meaningful resource penalty, maintaining conceptual
clarity regardless of system size.

**Aggregation Update Pattern**: When downstream nodes change state, aggregated
parent information may need updating:

1. **Update Notification**: Updater sends notification to root node with the
   path of the changed downstream node
2. **Path-Based Refresh**: System updates the entire path from root to changed
   node, ensuring all aggregated values are current
3. **Concurrent Operation**: While one path updates, unaffected tree branches
   remain fully queryable and responsive

**Bottleneck Mitigation**:

- **Apparent Problem**: Root node receives all update notifications, creating a
  potential bottleneck
- **Architectural Solution**: Direct node queries bypass the root entirely -
  clients query specific nodes directly in the tree
- **Result**: Update notifications flow through root while normal operations
  distribute across the tree, maintaining concurrency

**Consistency Guarantees**: The system provides a **consistent view** of the
tree state with specific atomicity boundaries:

- **Node-Level Atomicity**: Individual node parameter updates are atomic - a
  node's state changes all at once
- **Non-Atomic Tree Updates**: Global tree changes are not atomic - the world
  doesn't stop during path updates
- **Concurrent Query Reality**: While an update propagates through a path,
  downstream nodes may be queried and return state that will change momentarily
- **Design Trade-off**: True global consistency would require halting all
  concurrent operations, which conflicts with the real-time performance
  requirements

**Future Consideration**: Multi-node atomic transactions are not in immediate
plans, but the architecture could support them through coordination mechanisms
if needed.

This creates a **predictable concurrency model** where data flows down the tree
naturally, while upstream communication happens through well-defined external
channels, making the system both concurrent and deterministic.

### Single Executable Deployment Strategy

**Decision**: Target single executable binaries for services, enabling flexible
deployment across various environments without forcing containerization.

**Deployment Flexibility**:

- **Desktop Installation**: Simple executable deployment for personal computing
  environments
- **Container Ready**: Can be containerized when orchestration or isolation
  requirements demand it
- **Environment Agnostic**: Same binary works across different deployment
  scenarios

**Tooling Separation Principle**:

- **Service Binaries**: Keep lean and focused on runtime functionality
- **Framework Tooling**: Development and debugging tools remain separate to
  avoid bloating service executables
- **Size Optimization**: Avoid embedding tools with heavy dependencies that
  significantly increase binary size

**Benefits**:

- **Deployment Simplicity**: Single file deployment reduces operational
  complexity
- **Resource Efficiency**: Lean binaries suitable for modest hardware
- **User Choice**: Deployment method (bare metal, container, etc.) becomes an
  operational decision rather than an architectural constraint

This approach maintains the personal-scale philosophy where operational
simplicity and user control take precedence over enterprise deployment patterns.

### GUI-First Design Philosophy

**Decision**: Design Nerd as GUI-first rather than CLI-first, fundamentally
changing architectural priorities and user interaction patterns. The GUI's sole
task is to display the tree of nodes and it is designed to do just that as well
as practically possible.

**Enterprise Pattern**: Most server software prioritizes CLI interfaces, APIs,
and configuration files, with GUIs being secondary concerns or entirely separate
applications.

**Personal-Scale Rationale**:

- **Single User Focus**: Personal agents benefit from rich, interactive
  interfaces rather than scriptable CLIs designed for multiple operators
- **Continuous Interaction**: 24/7 running agents need monitoring and adjustment
  interfaces that are immediately accessible and visually clear
- **Tree Visualization**: The hierarchical node structure is naturally suited to
  GUI representation and manipulation
- **Minimal CLI**: Services include basic CLI commands for initialization and
  startup operations

**Core GUI Principle**: The GUI's singular responsibility is to display and
interact with a **tree of nodes** - and it must do this as well as practically
possible. All other functionality emerges from this fundamental capability.

**Single Source of Truth**: The GUI connects exclusively to the instance - it
never communicates directly with external services or maintains independent
state. This ensures the user always sees exactly how the instance perceives the
world, eliminating inconsistencies between what the system thinks is happening
and what the user sees.

**Real-Time Performance**: Nerd takes real-time GUI updates "freakishly
seriously" using:

- **WebSocket-based updates**: Backend is obliged to trigger immediate reloading
  of displayed node parameters
- **Live topology changes**: Tree structure modifications are reflected
  instantly in the GUI
- **Lazy loading strategy**: GUI only loads what's currently visible, minimizing
  bandwidth and computational overhead
- **Display-driven updates**: Only nodes actually being viewed receive real-time
  updates

This creates a **living interface** where the GUI feels like a direct window
into the running system rather than a periodic snapshot, essential for
monitoring and interacting with 24/7 personal agents.

This design constraint means the instance architecture is shaped by GUI
requirements rather than API-first or CLI-first considerations, resulting in
fundamentally different structural decisions.

### Minimal Dependency GUI Architecture

**Decision**: Build the TypeScript GUI using Web Components and established
WebAPIs while aggressively avoiding npm dependencies.

**Enterprise Pattern**: Modern GUI development typically embraces large
dependency trees, build toolchains, and framework ecosystems to accelerate
development velocity.

**Personal-Scale Rationale**:

- **Dependency Decision Process**: "Think first, then think some more, and if we
  still want to bring in the bugger we think more. And if it involves npm we
  think until we let it go."
- **Web Standards Reliance**: Leverage established Web APIs and Web Components
  instead of framework abstractions
- **Long-term Stability**: Personal agents running 24/7 benefit from fewer
  external dependencies that could break, become unmaintained, or introduce
  security vulnerabilities
- **Tree-Component Mapping**: The entire node tree is implemented as custom Web
  Components, creating a direct mapping between logical nodes and DOM elements

**Architectural Advantage**: Each node in the instance corresponds to a custom
Web Component in the GUI, maintaining the one-to-one mapping that makes the
real-time updates and tree manipulation straightforward and predictable. Shared
logic, like displaying the name flows naturally with inheritance of
web-component classes.

### Node Information Architecture

**Decision**: Define a minimal, universal data model that covers all node
interaction patterns while maintaining simplicity.

**Core Data Categories**:

- **Identity**: How nodes identify themselves within the tree structure
- **Status Information**: Read-only data that nodes expose about their current
  state, performance, and computed results
- **Configuration**: User-controllable settings that influence node behavior and
  operations

**Design Philosophy**: This three-category model provides complete coverage for
personal agent interfaces while maintaining conceptual clarity. The framework
prioritizes making these fundamental categories work excellently before adding
specialized extensions, ensuring that complex workflows can be built from
simple, well-understood primitives.

**Extensibility Strategy**: Future custom widgets and specialized displays can
be layered on top of this foundation without compromising the core simplicity
that makes the system predictable and maintainable.

### Tooling to Mitigate GUI-First Trade-offs

**Acknowledgment**: GUI-first design principles create unusual and uncomfortable
development experiences that must be addressed through dedicated tooling rather
than compromising the architectural decisions.

**Tooling Strategy**:

- **Binary Log Readers**: If binary logging formats are chosen for performance,
  provide tools to convert logs to human-readable form for terminal debugging
- **Config File Watching**: Configuration files are monitored and automatically
  reloaded when changed, enabling terminal-based configuration workflows
  alongside GUI interaction
- **Development Utilities**: Custom tooling bridges the gap between
  GUI-optimized architecture and traditional command-line development workflows

**Future CLI Possibility**: An excellent CLI experience is theoretically
absolutely possible and can be added later as need arises, since the underlying
tree structure and node abstraction naturally support multiple interface
modalities.

**Language Evolution**: A domain-specific language for tree operations will
likely emerge from GUI interaction patterns. As users discover complex workflows
through the interface, those patterns will inform language constructs that can
eventually be exposed through CLI interfaces.

**Design Philosophy**: Rather than weakening architectural principles to
accommodate development convenience, build the necessary tooling to make
principled designs practical for daily development work.

### Instance-GUI Communication Architecture

**Decision**: Design a dual-channel communication pattern that separates
real-time notifications from business-critical data transfer.

**Architectural Principle**: The instance serves as the single source of truth
for all system state, with the GUI acting as a pure display layer that never
maintains independent state or communicates directly with external services.

**Communication Pattern Separation**:

- **Real-Time Channel**: Handles lightweight notifications about state changes
  and system events, enabling immediate GUI updates and maintaining the "living
  interface" experience
- **Data Channel**: Handles all business-critical information transfer using
  reliable request-response patterns for node data, parameters, and operations

**Personal-Scale Benefits**:

- **Operational Simplicity**: Clear separation of concerns reduces debugging
  complexity while maintaining robust data operations
- **Real-Time Performance**: Dedicated notification channel enables the
  "freakishly serious" real-time updates required for monitoring 24/7 personal
  agents
- **Resilience**: System continues functioning even when real-time updates fail,
  with business operations remaining unaffected
- **Development Experience**: Type-safe contracts between instance and GUI
  eliminate schema maintenance overhead

This architecture ensures consistency between what the system knows and what the
user sees, while providing the real-time responsiveness essential for personal
agent monitoring and interaction.

---

_This document serves as both technical documentation and engineering
justification for architectural decisions that may diverge from conventional
enterprise patterns in favor of personal computing optimization._
