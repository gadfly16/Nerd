// Nerd Framework - Core types and base classes

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
