// Root GUI Component - Top-level container for the entire Nerd interface
import "./nerd-auth";
class NerdGui extends HTMLElement {
    userId = 0;
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
    }
    connectedCallback() {
        // Read userid from attribute
        const userIdAttr = this.getAttribute("userid");
        this.userId = userIdAttr ? parseInt(userIdAttr, 10) : 0;
        this.render();
    }
    render() {
        if (!this.shadowRoot)
            return;
        const needsAuth = this.userId === 0;
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
                    ${needsAuth
            ? "<nerd-auth></nerd-auth>"
            : `<p>Welcome, User ${this.userId}!</p><p>Main UI coming soon...</p>`}
                </div>
            </div>
        `;
    }
}
// Register the custom element
customElements.define("nerd-gui", NerdGui);
//# sourceMappingURL=nerd-gui.js.map