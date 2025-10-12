// Vertigo - Hierarchical tree display design pattern

import * as nerd from "./nerd.js"
import * as config from "./config.js"
import { $ } from "./util.js"

// Tree represents a displayed subtree using the Vertigo design pattern
export class Tree extends nerd.Component {
  static style = `
		vertigo-tree {
			display: block;
		}
	`

  config!: config.Vertigo

  // Render displays the tree using Vertigo block layout
  Render(
    cfg: config.Vertigo,
    treeRoot: nerd.Node,
    guiDisplayRoot: nerd.Node,
  ): HTMLElement {
    this.config = cfg

    // Expand displayRoot macro if present
    if (cfg.displayRoot !== undefined) {
      cfg.rootId = guiDisplayRoot.id
      cfg.openList = new Set()
      if (cfg.displayRoot > 0) {
        guiDisplayRoot.collectToDepth(cfg.displayRoot - 1, cfg.openList)
      }
      delete cfg.displayRoot

      treeRoot = guiDisplayRoot
    }

    this.innerHTML = ""

    // Create root vertigo-node and render it
    const rootDisplay = nerd.Create("vertigo-node") as Node
    rootDisplay.Render(treeRoot, this.config)
    this.appendChild(rootDisplay)

    return this
  }
}

// Open displays the clickable open/close icon at header level
class Open extends nerd.Component {
  static style = `
		vertigo-open {
			display: flex;
			align-items: center;
			justify-content: center;
			width: 2em;
			background-color: #666;
			cursor: pointer;
			user-select: none;
		}
	`
}

// Sidebar is the visual bar that extends below the open icon when node has children
class Sidebar extends nerd.Component {
  static style = `
		vertigo-sidebar {
			display: block;
			width: 2em;
			background-color: #666;
		}
	`
}

// Header displays the node name
class Header extends nerd.Component {
  static style = `
		vertigo-header {
			display: block;
			min-width: 60ch;
			background-color: #999;
			padding: 0.25em;
		}
	`
}

// Node renders a single node and its children recursively
class Node extends nerd.Component {
  static style = `
		vertigo-node {
			display: grid;
			grid-template-columns: 2em 1fr;
			min-width: calc(2em + 60ch);
			margin: 6px 0 0 6px;
		}

		vertigo-node > vertigo-open {
			grid-column: 1;
			grid-row: 1;
		}

		vertigo-node > vertigo-sidebar {
			grid-column: 1;
		}

		vertigo-node > vertigo-header {
			grid-column: 2;
			grid-row: 1;
		}

		vertigo-node > vertigo-node {
			grid-column: 2;
		}
	`

  // Render displays this node and recursively renders children
  Render(dataNode: nerd.Node, cfg: config.Vertigo): HTMLElement {
    this.innerHTML = ""

    const isOpen = cfg.openList.has(dataNode.id)
    const childCount = isOpen ? dataNode.children.length : 0

    // Create open icon block
    const open = nerd.Create("vertigo-open") as Open
    open.textContent = isOpen ? "○" : "●"
    open.onclick = () => {
      if (cfg.openList.has(dataNode.id)) {
        cfg.openList.delete(dataNode.id)
      } else {
        cfg.openList.add(dataNode.id)
      }
      this.Render(dataNode, cfg)
    }
    this.appendChild(open)

    // Create header with name
    const header = nerd.Create("vertigo-header") as Header
    header.textContent = dataNode.name
    this.appendChild(header)

    // Create sidebar extension if open and has children
    if (isOpen && childCount > 0) {
      const sidebar = nerd.Create("vertigo-sidebar") as Sidebar
      sidebar.style.gridRow = `2 / span ${childCount}`
      this.appendChild(sidebar)
    }

    // Render children if open
    if (isOpen) {
      for (const child of dataNode.children) {
        const childDisplay = nerd.Create("vertigo-node") as Node
        childDisplay.Render(child, cfg)
        this.appendChild(childDisplay)
      }
    }

    return this
  }
}

// Register the Vertigo components
Tree.register("vertigo-tree")
Open.register("vertigo-open")
Sidebar.register("vertigo-sidebar")
Header.register("vertigo-header")
Node.register("vertigo-node")
