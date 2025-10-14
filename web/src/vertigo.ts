// Vertigo - Hierarchical tree display design pattern

import * as nerd from "./nerd.js"
import * as config from "./config.js"
import { $ } from "./util.js"

// Layout constants (in pixels)
const W_SIDEBAR = 32 // Width of sidebar/icon block (2ch ≈ 32px at 16px font)
const G = 6 // Gap between nodes (0.5ch ≈ 8px)
const I = W_SIDEBAR + G // Indentation per level (40px)
const W_MIN = 640 // Minimum width for content area (60ch ≈ 960px)

// computeWidthFromDepth calculates required tree width from maximum depth (in pixels)
function computeWidth(maxDepth: number): number {
  return maxDepth * I + W_SIDEBAR + W_MIN - G
}

// Tree represents a displayed subtree using the Vertigo design pattern
export class Tree extends nerd.Component {
  static style = `
		vertigo-tree {
			display: block;
			padding-right: ${G}px;
		}
	`

  config!: config.Vertigo
  root!: nerd.TreeEntry
  rootElem!: VNode
  private resizeObs!: ResizeObserver

  connectedCallback() {
    // Set up ResizeObserver to watch parent container
    // Fires automatically on initial observation and whenever parent size changes
    this.resizeObs = new ResizeObserver(() => {
      this.updateWidth()
    })
  }

  disconnectedCallback() {
    // Clean up observer when removed from DOM
    this.resizeObs?.disconnect()
  }

  // Render displays the tree using Vertigo block layout
  Render(cfg: config.Vertigo, guiDispRoot: nerd.TreeEntry): HTMLElement {
    this.config = cfg

    // rootId: 0 means use guiDispRoot
    if (cfg.rootId === 0) {
      cfg.rootId = guiDispRoot.id
    }

    // Look up the tree root from registry
    const te = nerd.Nodes.get(cfg.rootId)
    if (!te) {
      throw new Error(`TreeEntry with id ${cfg.rootId} not found in registry`)
    }
    this.root = te

    // Get initial depth for root from openMap
    const rootDepth = cfg.openMap.get(cfg.rootId) ?? 0

    this.innerHTML = ""

    // Listen for structure change events from nodes
    this.addEventListener("vertigo:change", () => this.updateWidth())

    // Create root vertigo-node, add to DOM, then render
    this.rootElem = nerd.Create("vertigo-node") as VNode
    this.appendChild(this.rootElem)
    this.rootElem.Render(te, this.config, 0, rootDepth)

    // Start observing parent - triggers initial width calculation
    if (this.parentElement) {
      this.resizeObs.observe(this.parentElement)
    }

    return this
  }

  // updateWidth calculates and sets the tree width based on current open state
  // Called by ResizeObserver (parent size change) or vertigo:change event (structure change)
  updateWidth() {
    const maxDepth = this.rootElem.displayDepth()
    const computedWidth = computeWidth(maxDepth)
    const viewportWidth = (this.parentElement?.clientWidth || 0) - G
    const width = Math.max(computedWidth, viewportWidth)
    this.style.width = `${width}px`
  }
}

// Open displays the clickable open/close icon at header level
class Open extends nerd.Component {
  static style = `
		vertigo-open {
			display: flex;
			align-items: center;
			justify-content: center;
			width: ${W_SIDEBAR}px;
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
			width: ${W_SIDEBAR}px;
			background-color: #666;
		}
	`
}

// Header displays the node name
class Header extends nerd.Component {
  static style = `
		vertigo-header {
			display: block;
			background-color: #999;
			padding: 0.25em;
		}
	`
}

// VNode renders a single node and its children recursively
class VNode extends nerd.Component {
  static style = `
		vertigo-node {
			display: grid;
			grid-template-columns: ${W_SIDEBAR}px 1fr;
			grid-template-rows: auto 1fr;
			margin: ${G}px 0 0 ${G}px;
		}

		vertigo-node > vertigo-open {
			grid-area: 1 / 1;
		}

		vertigo-node > vertigo-header {
			grid-area: 1 / 2;
		}

		vertigo-node > vertigo-sidebar {
			grid-area: 2 / 1;
		}

		vertigo-node > .details {
			grid-area: 2 / 2;
			display: flex;
			flex-direction: column;
		}
	`

  static html = `
		<vertigo-open></vertigo-open>
		<vertigo-header></vertigo-header>
		<vertigo-sidebar></vertigo-sidebar>
		<div class="details">
			<div class="children"></div>
		</div>
	`

  te!: nerd.TreeEntry
  cfg!: config.Vertigo
  depth!: number
  parentDispDepth!: number // Display depth passed from parent
  childElems: VNode[] = []

  // Cached DOM elements
  open!: Open
  header!: Header
  sidebar!: Sidebar
  childrenElem!: HTMLElement

  connectedCallback() {
    this.innerHTML = VNode.html
    this.open = this.Query("vertigo-open")! as Open
    this.header = this.Query("vertigo-header")! as Header
    this.sidebar = this.Query("vertigo-sidebar")! as Sidebar
    this.childrenElem = this.Query(".children")!

    // Attach click handler once
    this.open.onclick = () => this.toggleOpen()
  }

  // dispDepth calculates display depth for children (0 = closed, >0 = open N levels, -1 = infinite)
  private dispDepth(): number {
    const OM_depth = this.cfg.openMap.get(this.te.id)

    if (OM_depth !== undefined) {
      // Node has explicit depth in map
      if (OM_depth === 0) {
        // Explicit stop
        return 0
      } else if (OM_depth === -1) {
        // Infinite
        return -1
      } else {
        // Use max of map depth or parent display depth decremented
        return Math.max(OM_depth, this.parentDispDepth - 1)
      }
    } else {
      // Neutral state - use parent display depth
      if (this.parentDispDepth === -1) {
        // Infinite propagates
        return -1
      } else if (this.parentDispDepth > 0) {
        // Decrement
        return this.parentDispDepth - 1
      } else {
        // Exhausted
        return 0
      }
    }
  }

  // Render updates node state and content (works for both initial and subsequent renders)
  Render(
    te: nerd.TreeEntry,
    cfg: config.Vertigo,
    depth: number,
    parentDispDepth: number,
  ): void {
    this.te = te
    this.cfg = cfg
    this.depth = depth
    this.parentDispDepth = parentDispDepth

    const childDispDepth = this.dispDepth()
    const isOpen = childDispDepth !== 0

    // Update icon and header
    this.open.textContent = isOpen ? "○" : "●"
    this.header.textContent = te.name

    if (isOpen) {
      // Should be open
      if (this.childElems.length === 0) {
        // Children not present - create them
        this.createChildren()
      }
      // Render all children (newly created or existing)
      for (let i = 0; i < this.childElems.length; i++) {
        this.childElems[i].Render(
          this.te.children[i],
          this.cfg,
          this.depth + 1,
          childDispDepth,
        )
      }
    } else {
      // Should be closed
      if (this.childElems.length > 0) {
        // Children present - delete them
        this.clearChildren()
      }
    }
  }

  // toggleOpen handles click on open/close icon
  private toggleOpen() {
    const isCurrentlyOpen = this.dispDepth() !== 0

    if (isCurrentlyOpen) {
      // Currently open - close it with explicit stop signal
      this.cfg.openMap.set(this.te.id, 0)
    } else {
      // Currently closed - open 1 level
      this.cfg.openMap.set(this.te.id, 1)
    }

    // Re-render from this node down
    this.Render(this.te, this.cfg, this.depth, this.parentDispDepth)

    // Notify tree that structure changed (for width recalculation)
    this.dispatchEvent(new CustomEvent("vertigo:change", { bubbles: true }))
  }

  // createChildren creates child VNode elements and adds them to DOM (assumes container is empty)
  private createChildren() {
    for (const child of this.te.children) {
      const childNode = nerd.Create("vertigo-node") as VNode
      this.childrenElem.appendChild(childNode)
      this.childElems.push(childNode)
    }
  }

  // clearChildren removes all child nodes
  private clearChildren() {
    for (const child of this.childElems) {
      child.remove()
    }
    this.childElems = []
  }

  // displayDepth recursively finds the maximum depth of open nodes from this node
  displayDepth(): number {
    let maxDepth = this.depth

    // If we have rendered children, check their depths
    if (this.childElems.length > 0) {
      for (const child of this.childElems) {
        const childMaxDepth = child.displayDepth()
        maxDepth = Math.max(maxDepth, childMaxDepth)
      }
    }

    return maxDepth
  }
}

// Register the Vertigo components
Tree.register("vertigo-tree")
Open.register("vertigo-open")
Sidebar.register("vertigo-sidebar")
Header.register("vertigo-header")
VNode.register("vertigo-node")
