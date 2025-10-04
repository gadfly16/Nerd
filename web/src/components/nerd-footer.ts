export class NerdFooter extends HTMLElement {
	connectedCallback() {
		this.render()
	}

	private render() {
		this.innerHTML = `
			<style>
				nerd-footer {
					display: block;
					background: #2c3e50;
					color: white;
					padding: 1rem;
					text-align: center;
				}
			</style>

			Footer
		`
	}
}

customElements.define("nerd-footer", NerdFooter)
