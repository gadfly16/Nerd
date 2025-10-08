// Nerd Framework - Core types and base classes

import { imsg } from "./imsg.js"

// TreeEntry represents a node and its children - Must match api/msg/types.go
export interface TreeEntry {
  nodeId: number
  name: string
  children: TreeEntry[]
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
}

// GUI is forward-declared here to avoid circular dependency
// The actual implementation is in gui.ts
// GUIState is also forward-declared for the state field
export interface GUIState {
  workbench: any
}

export interface GUI {
  state: GUIState
  SwitchToAuth(): void
  SwitchToWorkbench(userId: number): void
}

// Global singleton GUI instance - set during GUI.connectedCallback()
// Uses undefined as unknown to avoid exclamation marks throughout code
export let gui = undefined as unknown as GUI

export function SetGUI(instance: GUI) {
  gui = instance
}

// Ask sends an API message to the server and returns the response payload
// Throws on HTTP errors or network failures
// On 401 Unauthorized, triggers auth mode switch for security
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
      gui.SwitchToAuth()
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
