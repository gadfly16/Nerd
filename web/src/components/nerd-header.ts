export class NerdHeader extends HTMLElement {
	connectedCallback() {
		this.render()
	}

	private render() {
		this.innerHTML = `
			<style>
				.nerd-header {
					background: #2c3e50;
					color: white;
					padding: 1rem;
					font-size: 1.2rem;
					font-weight: bold;
				}
			</style>

			<div class="nerd-header">
				Nerd - Personal Software Agent
			</div>
		`
	}
}

customElements.define("nerd-header", NerdHeader)
