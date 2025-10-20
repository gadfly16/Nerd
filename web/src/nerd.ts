// Nerd Framework - Core types and base classes

import { imsg } from "./imsg.js"

// NodeType enum - must match api/node/types.go
export enum NodeType {
  Group = 0,
  Root = 1,
  Authenticator = 2,
  User = 3,
  BuiltinSeparator = 4,
}

// nodeTypeName returns the string representation of a NodeType
export function nodeTypeName(nt: number): string {
  switch (nt) {
    case NodeType.Group:
      return "Group"
    case NodeType.Root:
      return "Root"
    case NodeType.Authenticator:
      return "Authenticator"
    case NodeType.User:
      return "User"
    default:
      return "Unknown"
  }
}

// TreeRegistry is a global map of node ID to TreeEntry for fast lookups
export const Nodes = new Map<number, TreeEntry>()

// TreeEntry represents a node and its children
// Received as JSON from server, then initialized with parent pointers
// Must match api/msg/types.go for nodeId field (mapped to id here)
export class TreeEntry {
  id: number
  name: string
  nodeType: number
  children: TreeEntry[]
  parent: TreeEntry | null = null

  constructor(
    id: number,
    name: string,
    nodeType: number,
    children: TreeEntry[] = [],
  ) {
    this.id = id
    this.name = name
    this.nodeType = nodeType
    this.children = children
  }

  // init converts plain JSON object to TreeEntry instances and sets parent pointers
  // Also populates the global TreeRegistry for fast lookups
  static init(obj: any, parent: TreeEntry | null = null): TreeEntry {
    const entry = new TreeEntry(obj.nodeId, obj.name, obj.nodeType, [])
    entry.parent = parent

    // Register in global map
    Nodes.set(entry.id, entry)

    if (obj.children) {
      entry.children = obj.children.map((child: any) =>
        TreeEntry.init(child, entry),
      )
    }
    return entry
  }

  // collectToDepth adds node IDs from this node down to specified depth into provided set
  collectToDepth(depth: number, ids: Set<number>): void {
    ids.add(this.id)
    if (depth > 0) {
      for (const child of this.children) {
        child.collectToDepth(depth - 1, ids)
      }
    }
  }
}

// GUIContext holds minimal global state needed across components
// Simple data object - no methods, no coupling
export const Ctx: {
  userID: number
  admin: boolean
  dispRoot: TreeEntry | null
} = {
  userID: 0,
  admin: false,
  dispRoot: null,
}

// Component provides base functionality for all custom elements
// Uses global style injection rather than shadow DOM for simplicity
export class Component extends HTMLElement {
  static style = ""

  // register creates a global style tag and defines the custom element
  static register(name: string) {
    const styleElement = document.createElement("style")
    styleElement.textContent = this.style
    document.head.appendChild(styleElement)
    customElements.define(name, this)
  }

  // Query is a shorthand for querySelector
  Query<T extends Element = Element>(selector: string): T | null {
    return this.querySelector<T>(selector)
  }

  // Listen is a shorthand for addEventListener
  Listen(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ): void {
    this.addEventListener(type, listener, options)
  }

  // bbox is a shorthand for getBoundingClientRect
  bbox(): DOMRect {
    return this.getBoundingClientRect()
  }
}

// Ask sends an API message to the server and returns the response payload
// Throws on HTTP errors or network failures
// On 401 Unauthorized, dispatches event for security handling
export async function Ask(
  type: imsg,
  targetId: number,
  pl: any = {},
): Promise<any> {
  const response = await fetch("/api", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, targetId, payload: pl }),
  })

  if (!response.ok) {
    if (response.status === 401) {
      window.dispatchEvent(new CustomEvent("nerd:unauthorized"))
    }
    throw new Error((await response.text()) || "Request failed")
  }

  return await response.json()
}

// AskAuth sends an authentication message to the server
// Used for login, registration, and logout
export async function AskAuth(type: imsg, pl: any): Promise<any> {
  const response = await fetch("/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, payload: pl }),
  })

  if (!response.ok) {
    throw new Error((await response.text()) || "Request failed")
  }

  return await response.json()
}

// AskGetTree fetches the tree structure from the server
// For admins: fetches entire tree from Root (targetId = 1)
// For users: fetches subtree rooted at user node (targetId = userId)
export async function AskGetTree(targetId: number): Promise<TreeEntry> {
  return (await Ask(imsg.GetTree, targetId)) as TreeEntry
}

// Create is a shorthand for document.createElement
export function Create(tagName: string): HTMLElement {
  return document.createElement(tagName)
}
