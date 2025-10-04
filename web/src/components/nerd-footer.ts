import nerd from "../nerd"

export class NerdFooter extends nerd.NerdComponent {
  static style = `
		nerd-footer {
			display: block;
			background: #2c3e50;
			color: white;
			padding: 1rem;
			text-align: center;
		}
	`

  static html = `
		Footer
	`

  connectedCallback() {
    this.innerHTML = NerdFooter.html
  }
}

NerdFooter.register("nerd-footer")
