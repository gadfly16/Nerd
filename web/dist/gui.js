"use strict";(()=>{var e=class extends HTMLElement{constructor(){super(),this.attachShadow({mode:"open"})}connectedCallback(){this.render()}render(){this.shadowRoot&&(this.shadowRoot.innerHTML=`
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
                    <p>GUI scaffolding ready! \u{1F389}</p>
                    <p>Web Components architecture initialized.</p>
                </div>
            </div>
        `)}};customElements.define("nerd-gui",e);document.addEventListener("DOMContentLoaded",()=>{let t=document.createElement("nerd-gui");document.body.appendChild(t)});})();
//# sourceMappingURL=gui.js.map
