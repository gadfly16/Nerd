const style = `
	nerd-header {
		display: block;
		background: #2c3e50;
		color: white;
		padding: 1rem;
		font-size: 1.2rem;
		font-weight: bold;
	}
`

const html = `
	Nerd - Personal Software Agent Framework
`

export class NerdHeader extends HTMLElement {
  connectedCallback() {
    this.innerHTML = html
  }
}

// Register component and append style
const styleElement = document.createElement("style")
styleElement.textContent = style
document.head.appendChild(styleElement)
customElements.define("nerd-header", NerdHeader)
