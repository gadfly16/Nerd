// Node - In-memory tree structure

import * as config from "./config.js"
import { $ } from "./util.js"

// Node represents a node in the in-memory tree structure
// Forms a bidirectional tree with parent/children links
export class Node {
  id: number
  name: string
  parent: Node | null
  children: Node[]
  elements: HTMLElement[] // DOM elements for each render (multiple trees/boards)

  constructor(id: number, name: string, parent: Node | null = null) {
    this.id = id
    this.name = name
    this.parent = parent
    this.children = []
    this.elements = []
  }

  // addChild creates child node and establishes bidirectional link
  addChild(id: number, name: string): Node {
    const child = new Node(id, name, this)
    this.children.push(child)
    return child
  }

  // collectToDepth adds node IDs from this node down to specified depth into provided set
  collectToDepth(depth: number, ids: Set<number>) {
    ids.add(this.id)
    if (depth > 0) {
      for (const child of this.children) {
        child.collectToDepth(depth - 1, ids)
      }
    }
  }

  // render creates and appends a new DOM element to container
  // recursively renders children if this node is in the config's openList
  // returns the created element for potential future reference
  render(container: HTMLElement, cfg: config.Vertigo): HTMLElement {
    const element = $(`<div class="nerd-entity">${this.name}</div>`)
    this.elements.push(element)
    container.appendChild(element)

    if (cfg.openList.has(this.id)) {
      const childContainer = $(`<div class="nerd-children"></div>`)
      element.appendChild(childContainer)
      for (const child of this.children) {
        child.render(childContainer, cfg)
      }
    }

    return element
  }
}
