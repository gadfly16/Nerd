// Nerd - Common imports for component development

import type { NerdGui } from "./part/nerd-gui"

class NerdComponent extends HTMLElement {
  static style = ""

  static register(name: string) {
    const styleElement = document.createElement("style")
    styleElement.textContent = this.style
    document.head.appendChild(styleElement)
    customElements.define(name, this)
  }
}

class NerdAction extends NerdComponent {
  static style = `
		nerd-action {
			display: inline;
			background: none;
			border: none;
			color: #0066cc;
			text-decoration: underline;
			cursor: pointer;
			padding: 0;
			font: inherit;
		}

		nerd-action:hover {
			color: #0052a3;
		}
	`
}

NerdAction.register("nerd-action")

export default {
  NerdComponent,
  NerdAction,
  gui: undefined as unknown as NerdGui,
}
