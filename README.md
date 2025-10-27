# Nerd - A Personal Microservice Platform

Nerd is an experimental microservice architecture under development. It aims to
provide means for its users to define microservices that run as goroutines
instead of OS processes. By following some simple rules the user can enjoy good
performance, high reliability and a comrehensive GUI for managing the instance.

## API

The Nerd API provides packages to interact with a nerd instance, like start it
up, shut it down and sending interface messagese (IMsg) to nodes.

## SDK

The Nerd SDK provides packages to let the user define it's own node types.
