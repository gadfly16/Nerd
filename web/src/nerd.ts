// Nerd Framework - Core types and base classes

import { imsg } from "./imsg.js"

// Cause indicates why Populate was called on a VNode
export enum Cause {
  Init, // Initial population (no animation)
  Match, // Existing node being updated
  Create, // New node being created
  Delete, // Node being deleted (triggers exit animation)
}

// NodeType enum - must match api/nerd/nodeTypes.go
export enum NodeType {
  Group = 0,
  Root = 1,
  Authenticator = 2,
  User = 3,
  GUI = 4,
  TopoUpdater = 5,
  BuiltinSeparator = 6,
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
    case NodeType.GUI:
      return "GUI"
    case NodeType.TopoUpdater:
      return "TopoUpdater"
    default:
      return "Unknown"
  }
}

// TreeRegistry is a global map of node ID to TreeEntry for fast lookups
export const Registry = new Map<number, TreeEntry>()

// Idea enum defines semantic meanings for values
export enum Idea {
  NodeId,
  Secret,
  LENGTH, // Number of ideas (must be last)
}

// Seal represents an idea with its multiplier and offset for value interpretation
export class Seal {
  idea: Idea // The semantic meaning
  multiplier: number // Scaling factor for the value
  offset: number // Offset to add to the value

  constructor(idea: Idea, multiplier: number = 1, offset: number = 0) {
    this.idea = idea
    this.multiplier = multiplier
    this.offset = offset
  }
}

// Seals is a global registry mapping short string identifiers to Seal instances
export const Seals = new Map<string, Seal>()

// Register built-in seals
Seals.set("#", new Seal(Idea.NodeId))
Seals.set("secret", new Seal(Idea.Secret))

// Ideas organizes seals by their idea for fast lookup
export const Ideas: Seal[][] = Array.from(
  { length: Idea.LENGTH },
  () => [],
)

// Build Ideas from Seals map
for (const seal of Seals.values()) {
  Ideas[seal.idea].push(seal)
}

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
    Registry.set(entry.id, entry)

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
export const Ctx: {
  userID: number
  admin: boolean
  dispRoot: TreeEntry | null
  status: HTMLElement | null
  statusMessage: HTMLElement | null
} = {
  userID: 0,
  admin: false,
  dispRoot: null,
  status: null,
  statusMessage: null,
}

// Component provides base functionality for all custom elements
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

  // Show removes the "hidden" class to make the component visible
  Show(): void {
    this.classList.remove("hidden")
  }

  // Hide adds the "hidden" class to hide the component
  Hide(): void {
    this.classList.add("hidden")
  }
}

// Ask sends an API message to the server and returns the response payload
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
export async function AskAuth(type: imsg, pl: any): Promise<any> {
  if (type === imsg.ICreateChild) {
    pl = { nodeType: NodeType.User, name: pl.username, spec: pl }
  }
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
export async function AskGetTree(targetId: number): Promise<TreeEntry> {
  return (await Ask(imsg.IGetTree, targetId)) as TreeEntry
}

// AskRenameChild renames a child node
export async function AskRenameChild(
  parentId: number,
  oldName: string,
  newName: string,
): Promise<void> {
  await Ask(imsg.IRenameChild, parentId, { oldName, newName })
}

// AskGetState fetches the state values from a node
export async function AskGetState(targetId: number): Promise<any> {
  return await Ask(imsg.IGetState, targetId)
}

// Create is a shorthand for document.createElement
export function Create(tagName: string): HTMLElement {
  return document.createElement(tagName)
}

// Status types
export enum Status {
  OK,
  Warning,
  Error,
}

// Status hue mapping (for HSL color system)
const STATUS_HUES = new Map<Status, number>([
  [Status.OK, 120], // Green
  [Status.Warning, 60], // Yellow
  [Status.Error, 0], // Red
])

// Log updates the status indicator and displays message
export function Log(status: Status, message: string) {
  // Log to console
  const statusName = Status[status]
  console.log(`${new Date().toISOString()}:  ${statusName}: ${message}`)

  // Set status hue via CSS variable
  const hue = STATUS_HUES.get(status) || 0
  Ctx.status!.style.setProperty("--base-hue", hue.toString())
  Ctx.statusMessage!.textContent = message
}
