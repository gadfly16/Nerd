# Nerd - A Personal Microservice Platform

Nerd is an experimental microservice architecture under development. It aims to
provide means for its users to define microservices that run as goroutines
instead of OS processes. By following some simple rules the user can enjoy good
performance, high reliability and a comrehensive GUI for managing the instance.

## The Base Idea

### Everything is a Node

In Nerd everything is a node representing a microservice running its own message
loop. For example, a user is represented as a user node and user related tasks
are handled by this node (microservice). Creating a new user _is_ creating a new
node of type user. Deleting the user node _is_ deleting the user's node. The
user id _is_ the user node's id.

### Nodes Live on the Tree

Nodes are living on the _tree_. The tree of nodes _is_ the Nerd instance. It's
not a representation of something behind the scenes: it is one and the same
thing. We refer to the _shape_ of the tree as _topology_.

### Nodes Communicate Through Message Passing

Nodes have their own message loops. Their memory is isolated. Their access to
the tree is isolated. Nodes can't send messages directly to their ascendants,
but they can communicate to nodes that are not in their _paths_.

### Four Classes of Information

Nerd is dealing with four well defined classes of information. Topology is one
of the four and it is handled on a per-instance basis. The three other classes
are _status_, _config_ and _log_, which are handled on a per-node basis. These
are called _node details_ together.

## Features

### Robustness

A Nerd instance is robust and provides very good eventual consistency.

### Real Time Information Updates

The GUI provide reliable real-time updates for both topology and node detail
information.

### Performance

Nerd should scale to at least to hundreds of microservices in a single machine.

## API

The Nerd API provides packages to interact with a nerd instance, like start it
up, shut it down and sending interface messagese (IMsg) to nodes.

## SDK

The Nerd SDK provides packages to let the user define it's own node types.
