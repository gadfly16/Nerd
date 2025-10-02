// Root GUI Component - Top-level container for the entire Nerd interface

class NerdGui extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
    }

    private render() {
        if (!this.shadowRoot) return;

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    width: 100%;
                    height: 100vh;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    background: #fafafa;
                }

                .container {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                }

                .header {
                    background: #2c3e50;
                    color: white;
                    padding: 1rem;
                    font-size: 1.2rem;
                    font-weight: bold;
                }

                .content {
                    flex: 1;
                    padding: 1rem;
                    overflow: auto;
                }
            </style>

            <div class="container">
                <div class="header">
                    Nerd - Personal Software Agent
                </div>
                <div class="content">
                    <p>GUI scaffolding ready! 🎉</p>
                    <p>Web Components architecture initialized.</p>
                </div>
            </div>
        `;
    }
}

// Register the custom element
customElements.define('nerd-gui', NerdGui);
