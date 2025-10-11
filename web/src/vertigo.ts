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

// Node renders a single node and its children recursively
class Node extends nerd.Component {
  static style = `
		vertigo-node .nerd-entity {
			padding: 0.25em;
		}

		vertigo-node .nerd-children {
			padding-left: 1em;
		}
	`

  // Render displays this node and recursively renders children
  Render(dataNode: nerd.Node, cfg: config.Vertigo): HTMLElement {
    const element = $(`<div class="nerd-entity">${dataNode.name}</div>`)
    this.appendChild(element)

    if (cfg.openList.has(dataNode.id)) {
      const childContainer = $(`<div class="nerd-children"></div>`)
      element.appendChild(childContainer)

      // Recursion: create vertigo-node for each child
      for (const child of dataNode.children) {
        const childDisplay = nerd.Create("vertigo-node") as Node
        childDisplay.Render(child, cfg)
        childContainer.appendChild(childDisplay)
      }
    }

    return this
  }
}

// Register the Vertigo components
Tree.register("vertigo-tree")
Node.register("vertigo-node")
