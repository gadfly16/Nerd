# Implementation Decisions

This document tracks technical decisions made during the implementation of the
Nerd framework, including reasoning and context for each choice.

## CLI Framework

**Decision**: Use Cobra Commander for CLI implementation.

**Context**: Need a futureproof CLI framework for implementing Nerd service
commands. Implementing two commands initially: `init` for database creation and
`run` for starting the service.

**Status**: Decided

## Database Stack

**Decision**: Use Gorm as ORM with SQLite as the database.

**Context**: Need persistent storage for node and tree state. SQLite provides
single-file simplicity aligned with personal-scale architecture. Gorm provides
Go-idiomatic database operations.

**Status**: Decided

## Database Schema Architecture

**Decision**: Use Identity/Config struct separation with manual composition.

**Context**: Every node has an `Identity` struct containing tree-essential
fields (ID, parent_id, name, node_type) stored in `identities` table.
Type-specific configuration is stored in separate structs/tables per node type.
Node structs manually compose identity + config + runtime fields. Each goroutine
loads its own configuration for security (e.g., passwords).

**Status**: Decided

## Node Type System

**Decision**: Define 6 core node types as integer enum: GroupNode, RootNode,
UserNode, UpdaterNode, LoggerNode, AuthenticatorNode.

**Context**: These node types provide the foundation for a complete empty Nerd
service. Using integer enum for efficient storage and comparison. The
AuthenticatorNode handles user authentication and authorization within the
service.

**Status**: Decided

## Node ID Architecture

**Decision**: Use int64 for node IDs with positive/negative distinction for
ordinary vs system nodes.

**Context**: Ordinary nodes stored in database get positive IDs from database
counter. Ephemeral system nodes created by runtime get negative IDs from
separate Go counter. ID 0 represents uninitialized state (error condition). Root
node receives ID 1. ID range -2^53 to 2^53 ensures compatibility with TypeScript
number type in GUI.

**Status**: Decided

## Serialization Format

**Decision**: Use JSON for HTTP and WebSocket message serialization.

**Context**: Need consistent serialization across instance-GUI communication.
JSON provides debugging simplicity, wide tooling support, and sufficient
performance for personal-scale systems. Enables easy inspection and testing of
API communications.

**Status**: Decided

## Type Generation Tool

**Decision**: Use tygo for Go struct to TypeScript interface generation.

**Context**: Go structs serve as single source of truth for message contracts
between instance and GUI. tygo automatically generates TypeScript interfaces
from Go structs with proper type mapping (int64 → number/bigint, time.Time →
string). Only structs with JSON tags are exposed to maintain clean API
contracts.

**Status**: Decided

## Instance-GUI Communication Protocol

**Decision**: Separate WebSocket and HTTP responsibilities for instance-GUI
communication.

**Context**: WebSocket handles lightweight real-time concerns (heartbeat, update
notifications) while HTTP handles all business-critical data transfer (node
identity, status, config). This separation ensures business operations remain
robust through reliable HTTP patterns while real-time updates depend on
WebSocket connectivity.

**Status**: Decided

## Database Access Pattern

**Decision**: Use distributed database access where each node handles its own
database operations directly.

**Context**: SQLite with Gorm enables safe concurrent access. Each node performs
its own database operations rather than using a centralized database service.
This aligns with Nerd's distributed architecture and financial-level reliability
requirements.

**Status**: Decided

## Special System Nodes Architecture

**Decision**: Logger, Authenticator, and Updater nodes are special cases
requiring special treatment.

**Context**: These fundamental system nodes behave differently from ordinary
nodes. For example, Logger node stores logging configuration while each
individual node handles its own logging operations. These nodes will have
special behavior patterns that ordinary nodes will not follow.

**Status**: Decided

## Financial Reliability Pattern

**Decision**: Database commits must complete before UI parameter updates.

**Context**: Nerd targets financial-level reliability. Any parameter change must
be successfully committed to the database before the change is reflected in the
user interface. This ensures data consistency and prevents the UI from showing
uncommitted state changes.

**Status**: Decided

---

_Additional technical decisions will be added here as we make them during
implementation._
