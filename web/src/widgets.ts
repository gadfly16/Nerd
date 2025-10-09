// Widgets - Reusable UI primitives used across multiple components

import * as nerd from "./nerd.js"

// Action renders a clickable link-styled button
export class Action extends nerd.Component {
  static style = `
		nerd-action {
			display: inline;
			background: none;
			border: none;
			color: #aaa;
			text-decoration: underline;
			cursor: pointer;
			padding: 0;
			font-size: 0.75em;
		}

		nerd-action:hover {
			color: #ddd;
		}
	`
}

// Register all widgets
Action.register("nerd-action")
