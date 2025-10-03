// Root GUI Component - Top-level container for the entire Nerd interface

import "./nerd-auth"
import "./nerd-header"
import "./nerd-workbench"
import { system } from "../system"

export class NerdGui extends HTMLElement {
  userId: number = 0
  private auth = document.createElement("nerd-auth")

  connectedCallback() {
    this.userId = parseInt(this.getAttribute("userid")!, 10)
    system.gui = this
    this.render()
    this.updateAuthState()
  }

  private render() {
    this.innerHTML = `
			<style>
				:host {
					display: block;
					width: 100%;
					height: 100vh;
					font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
					background: #fafafa;
				}

				.nerd-gui {
					display: flex;
					flex-direction: column;
					height: 100%;
				}

				.hidden {
					display: none;
				}
			</style>

			<div class="nerd-gui">
				<nerd-header></nerd-header>
				<nerd-workbench></nerd-workbench>
			</div>
		`
  }

  updateAuthState() {
    const workbench = this.querySelector("nerd-workbench")!

    if (this.userId === 0) {
      // Hide workbench, insert nerd-auth
      workbench.classList.add("hidden")
      this.appendChild(this.auth)
    } else {
      // Show workbench, remove nerd-auth
      workbench.classList.remove("hidden")
      this.auth.remove()
    }
  }
}

// Register the custom element
customElements.define("nerd-gui", NerdGui)
