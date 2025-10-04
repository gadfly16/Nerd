// Root GUI Component - Top-level container for the entire Nerd interface

import "./nerd-auth"
import "./nerd-workbench"
import { system } from "../system"

const style = `
	@font-face {
		font-family: 'Inter';
		src: url('/fonts/InterVariable.woff2');
		font-weight: 100 900;
		font-display: block;
	}

	body {
		margin: 0;
		padding: 0;
	}

	h2 {
		margin: 0 0 0.25em 0;
		font-size: 1.5em;
	}

	.error {
		color: red;
	}

	nerd-gui {
		display: flex;
		flex-direction: column;
		width: 100vw;
		height: 100vh;
		font-family: 'Inter';
		background: #fafafa;
	}

	.hidden {
		display: none;
	}
`

const html = `
	<nerd-workbench></nerd-workbench>
`

export class NerdGui extends HTMLElement {
  userId: number = 0
  private auth = document.createElement("nerd-auth")

  connectedCallback() {
    this.userId = parseInt(this.getAttribute("userid")!, 10)
    system.gui = this
    this.innerHTML = html
    this.updateAuthState()
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

// Register component and append style
const styleElement = document.createElement("style")
styleElement.textContent = style
document.head.appendChild(styleElement)
customElements.define("nerd-gui", NerdGui)
