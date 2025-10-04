const style = `
	nerd-footer {
		display: block;
		background: #2c3e50;
		color: white;
		padding: 1rem;
		text-align: center;
	}
`

const html = `
	Footer
`

export class NerdFooter extends HTMLElement {
  connectedCallback() {
    this.innerHTML = html
  }
}

// Register component and append style
const styleElement = document.createElement("style")
styleElement.textContent = style
document.head.appendChild(styleElement)
customElements.define("nerd-footer", NerdFooter)
