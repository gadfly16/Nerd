const style = `
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

export class NerdAction extends HTMLElement {}

// Register component and append style
const styleElement = document.createElement("style")
styleElement.textContent = style
document.head.appendChild(styleElement)
customElements.define("nerd-action", NerdAction)
