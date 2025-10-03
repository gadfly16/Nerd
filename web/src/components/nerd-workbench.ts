export class NerdWorkbench extends HTMLElement {
  connectedCallback() {
    this.render()
  }

  private render() {
    this.innerHTML = `
      <style>
        .nerd-workbench {
          display: flex;
          width: 100%;
          gap: 1rem;
          padding: 1rem;
        }

        .nerd-workbench .board {
          flex: 1;
          border: 1px solid #ddd;
        }
      </style>

      <div class="nerd-workbench">
        <div class="board left"></div>
        <div class="board right"></div>
      </div>
    `
  }
}

customElements.define("nerd-workbench", NerdWorkbench)
