import "./nerd-header"
import "./nerd-footer"

const style = `
	nerd-workbench {
		display: grid;
		grid-template-columns: 1fr 1fr;
		grid-template-rows: auto 1fr auto;
		grid-template-areas:
			"header header"
			"left right"
			"footer footer";
		width: 100%;
		height: 100%;
	}

	nerd-workbench nerd-header {
		grid-area: header;
	}

	nerd-workbench .board.left {
		grid-area: left;
		border: 1px solid #ddd;
	}

	nerd-workbench .board.right {
		grid-area: right;
		border: 1px solid #ddd;
	}

	nerd-workbench nerd-footer {
		grid-area: footer;
	}
`

const html = `
	<nerd-header></nerd-header>
	<div class="board left"></div>
	<div class="board right"></div>
	<nerd-footer></nerd-footer>
`

export class NerdWorkbench extends HTMLElement {
  connectedCallback() {
    this.innerHTML = html
  }
}

// Register component and append style
const styleElement = document.createElement("style")
styleElement.textContent = style
document.head.appendChild(styleElement)
customElements.define("nerd-workbench", NerdWorkbench)
