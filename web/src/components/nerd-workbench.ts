import "./nerd-header"
import "./nerd-footer"

export class NerdWorkbench extends HTMLElement {
  connectedCallback() {
    this.render()
  }

  private render() {
    this.innerHTML = `
      <style>
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
      </style>

      <nerd-header></nerd-header>
      <div class="board left"></div>
      <div class="board right"></div>
      <nerd-footer></nerd-footer>
    `
  }
}

customElements.define("nerd-workbench", NerdWorkbench)
