// Nerd Framework - Core types and base classes

import { imsg } from "./imsg.js"

// TreeEntry represents a node and its children - Must match api/msg/types.go
export interface TreeEntry {
  nodeId: number
  name: string
  children: TreeEntry[]
}

// GUIContext holds minimal global state needed across components
// Simple data object - no methods, no coupling
export const GUIContext = {
  userId: 0,
  admin: false,
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
