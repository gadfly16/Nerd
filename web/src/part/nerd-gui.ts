import nerd from "../nerd"
import "./nerd-auth"
import "./nerd-workbench"

export class NerdGui extends nerd.NerdComponent {
  static style = `
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

  static html = `
		<nerd-workbench></nerd-workbench>
	`

  userId: number = 0
  private auth = document.createElement("nerd-auth")

  connectedCallback() {
    this.userId = parseInt(this.getAttribute("userid")!, 10)
    nerd.gui = this
    this.innerHTML = NerdGui.html
    this.updateAuthState()
  }

  updateAuthState() {
    const workbench = this.querySelector("nerd-workbench")!

    if (this.userId === 0) {
      workbench.classList.add("hidden")
      this.appendChild(this.auth)
    } else {
      workbench.classList.remove("hidden")
      this.auth.remove()
    }
  }
}

NerdGui.register("nerd-gui")
