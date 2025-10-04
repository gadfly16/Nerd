import nerd from "../nerd"

export class NerdHeader extends nerd.NerdComponent {
  static style = `
		nerd-header {
			display: block;
			background: #2c3e50;
			color: white;
			padding: 1rem;
			font-size: 1.2rem;
			font-weight: bold;
		}
	`

  static html = `
		Nerd - Personal Software Agent Framework
	`

  connectedCallback() {
    this.innerHTML = NerdHeader.html
  }
}

NerdHeader.register("nerd-header")
