// Nerd GUI - Main Entry Point
// Vanilla TypeScript with Web Components architecture
// Import root component
import "./components/nerd-gui";
// Initialize the GUI when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
    // Create and mount the root GUI component
    const gui = document.createElement("nerd-gui");
    document.body.appendChild(gui);
});
//# sourceMappingURL=main.js.map