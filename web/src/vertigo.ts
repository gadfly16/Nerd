// Vertigo - Hierarchical tree display design pattern

import * as nerd from "./nerd.js"
import * as config from "./config.js"
import { $ } from "./util.js"

// Layout constants (in pixels)
const W_SIDEBAR = 28 // Width of sidebar/icon block (2ch ≈ 32px at 16px font)
const G = 6 // Gap between nodes (0.5ch ≈ 8px)
const I = W_SIDEBAR + G // Indentation per level (40px)
const W_MIN = 640 // Minimum width for content area (60ch ≈ 960px)
const NAME_PADDING = "0.5ch" // Horizontal padding for node names

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

    this.innerHTML = ""

    // Listen for structure change events from nodes
    this.addEventListener("vertigo:change", () => this.updateWidth())

    // Create root vertigo-node, add to DOM, then render
    // Root node gets 0 as inheritedDispDepth (closed by default unless explicit openMap entry)
    this.rootElem = nerd.Create("vertigo-node") as VNode
    this.appendChild(this.rootElem)
    this.rootElem.Render(te, this.config, 0, 0)

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
			font-size: 0.66em;
			color: #bbb;
		}
	`
}

// Sidebar is the visual bar that extends below the open icon when node has children
class Sidebar extends nerd.Component {
  static style = `
		vertigo-sidebar {
			display: flex;
			flex-direction: column;
			justify-content: flex-end;
			width: ${W_SIDEBAR}px;
			background-color: #666;
			color: #bbb;
			padding-bottom: ${NAME_PADDING};
		}

		vertigo-sidebar .name {
			position: sticky;
			bottom: calc(${NAME_PADDING}*2);
			background-color: #666;
			transform: rotate(-90deg) translateY(23px);
			transform-origin: bottom left;
			white-space: nowrap;
		}
	`
}

// Header displays the node name
class Header extends nerd.Component {
  static style = `
		vertigo-header {
			display: block;
			background-color: #999;
			padding: 0.2ch;
			padding-left: ${NAME_PADDING};
			color: #666;
			font-size: 1.2em;
			font-weight: 500;
		}

		vertigo-header .name {
			position: sticky;
			left: ${NAME_PADDING};
			display: inline-block;
			background-color: #999;
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
		<vertigo-header><span class="name"></span></vertigo-header>
		<vertigo-sidebar><span class="name"></span></vertigo-sidebar>
		<div class="details">
			<div class="children"></div>
		</div>
	`

  te!: nerd.TreeEntry
  cfg!: config.Vertigo
  depth!: number
  inheritedDispDepth!: number // Display depth inherited from parent
  childElems: VNode[] = []

  // Cached DOM elements
  open!: Open
  header!: Header
  headerNameElem!: HTMLElement
  sidebar!: Sidebar
  sidebarNameElem!: HTMLElement
  childrenElem!: HTMLElement

  connectedCallback() {
    this.innerHTML = VNode.html
    this.open = this.Query("vertigo-open")! as Open
    this.header = this.Query("vertigo-header")! as Header
    this.headerNameElem = this.header.Query(".name")!
    this.sidebar = this.Query("vertigo-sidebar")! as Sidebar
    this.sidebarNameElem = this.sidebar.Query(".name")!
    this.childrenElem = this.Query(".children")!

    // Attach click handler once
    this.open.onclick = (e) => {
      if (e.shiftKey && e.ctrlKey) {
        this.toggleInfinity()
      } else if (e.shiftKey) {
        this.incrementDepth()
      } else if (e.ctrlKey) {
        this.makeNeutral()
      } else {
        this.toggleOpen()
      }
    }
  }

  // isOpen determines if this node should display its children
  private isOpen(): boolean {
    const ome = this.cfg.openMap[this.te.id]

    if (ome === undefined) {
      // Neutral node - open if inheritedDispDepth allows it
      return this.inheritedDispDepth !== 0
    }

    // Has explicit openMap entry
    return ome.open
  }

  // childrenDepth calculates the depth value to pass to children
  // Only call this when isOpen() returns true
  private childrenDepth(): number {
    const ome = this.cfg.openMap[this.te.id]

    let myDepth: number
    if (ome === undefined) {
      // Neutral node - use inherited depth
      myDepth = this.inheritedDispDepth
    } else if (ome.depth > 0 || ome.depth === -1) {
      // Has specific depth - use it
      myDepth = ome.depth
    } else {
      // depth === 0: neutral (accept inherited)
      myDepth = this.inheritedDispDepth
    }

    // Calculate depth for children
    if (myDepth === -1) {
      return -1 // Infinite propagates
    } else {
      return myDepth - 1 // Decrement
    }
  }

  // Render updates node state and content (works for both initial and subsequent renders)
  Render(
    te: nerd.TreeEntry,
    cfg: config.Vertigo,
    depth: number,
    inheritedDispDepth: number,
  ): void {
    this.te = te
    this.cfg = cfg
    this.depth = depth
    this.inheritedDispDepth = inheritedDispDepth

    // Update icon based on openMap state
    const ome = this.cfg.openMap[this.te.id]
    if (ome !== undefined && ome.open && ome.depth > 0 && ome.depth <= 9) {
      // Node has explicit depth 1-9
      // Circled numbers 1-9 (Unicode: ① = U+2460)
      this.open.textContent = String.fromCharCode(0x2460 + ome.depth - 1)
    } else if (ome !== undefined && ome.open && ome.depth === -1) {
      // Infinite depth
      this.open.textContent = "Ⓘ" // Circled I for infinite
    } else {
      // Neutral or explicitly closed - use matching circles
      this.open.textContent = this.isOpen() ? "◯" : "⬤"
    }

    this.headerNameElem.textContent = te.name
    this.sidebarNameElem.textContent = te.name

    if (this.isOpen()) {
      // Should be open
      if (this.childElems.length === 0) {
        // Children not present - create them
        this.createChildren()
      }
      // Render all children (newly created or existing)
      const childInheritedDepth = this.childrenDepth()
      for (let i = 0; i < this.childElems.length; i++) {
        this.childElems[i].Render(
          this.te.children[i],
          this.cfg,
          this.depth + 1,
          childInheritedDepth,
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

  // toggleOpen handles click on open/close icon - implements state restoration
  private toggleOpen() {
    const ome = this.cfg.openMap[this.te.id]

    if (ome === undefined) {
      // Neutral node - check if currently open or closed
      if (this.inheritedDispDepth === 0) {
        // Currently closed - open it with explicit depth 1
        this.cfg.openMap[this.te.id] = { open: true, depth: 1 }
      } else {
        // Currently open - close it explicitly
        this.cfg.openMap[this.te.id] = { open: false, depth: 0 }
      }
    } else if (ome.open) {
      // Currently open - close it (preserve depth)
      ome.open = false
    } else {
      // Currently closed - reopen it
      if (ome.depth === 0) {
        // Was neutral before closing - delete entry to restore neutral state
        delete this.cfg.openMap[this.te.id]
      } else {
        // Has depth preference - restore to open state
        ome.open = true
      }
    }

    // Re-render from this node down
    this.Render(this.te, this.cfg, this.depth, this.inheritedDispDepth)

    // Notify tree that structure changed (for width recalculation)
    this.dispatchEvent(new CustomEvent("vertigo:change", { bubbles: true }))
  }

  // incrementDepth handles shift-click on open icon - increments explicit depth
  private incrementDepth() {
    const ome = this.cfg.openMap[this.te.id]

    if (ome === undefined) {
      // Neutral node - add explicit depth 1
      this.cfg.openMap[this.te.id] = { open: true, depth: 1 }
    } else if (ome.depth >= 1 && ome.depth < 9) {
      // Has explicit depth 1-8 - increment it
      ome.depth++
      ome.open = true
    } else if (ome.depth === 9) {
      // At max depth - wrap to 1
      ome.depth = 1
      ome.open = true
    } else {
      // depth is 0 or -1 or closed - set to 1
      ome.depth = 1
      ome.open = true
    }

    // Re-render from this node down
    this.Render(this.te, this.cfg, this.depth, this.inheritedDispDepth)

    // Notify tree that structure changed (for width recalculation)
    this.dispatchEvent(new CustomEvent("vertigo:change", { bubbles: true }))
  }

  // makeNeutral handles ctrl-click on open icon - removes explicit state
  private makeNeutral() {
    const ome = this.cfg.openMap[this.te.id]

    if (ome === undefined) {
      // Already neutral - nothing to do
      return
    }

    if (ome.open) {
      // Currently open - remove from openMap (becomes neutral)
      delete this.cfg.openMap[this.te.id]
    } else {
      // Currently closed - set depth to 0 (neutral when closed)
      ome.depth = 0
    }

    // Re-render from this node down
    this.Render(this.te, this.cfg, this.depth, this.inheritedDispDepth)

    // Notify tree that structure changed (for width recalculation)
    this.dispatchEvent(new CustomEvent("vertigo:change", { bubbles: true }))
  }

  // toggleInfinity handles ctrl+shift-click on open icon - toggles infinite depth
  private toggleInfinity() {
    const ome = this.cfg.openMap[this.te.id]

    if (ome === undefined) {
      // Neutral node - set to infinite
      this.cfg.openMap[this.te.id] = { open: true, depth: -1 }
    } else if (ome.depth === -1) {
      // Currently infinite - make neutral
      if (ome.open) {
        // Open infinite -> neutral open (delete entry)
        delete this.cfg.openMap[this.te.id]
      } else {
        // Closed infinite -> neutral closed
        ome.depth = 0
      }
    } else {
      // Has other depth (0, 1-9) - set to infinite and open
      ome.depth = -1
      ome.open = true
    }

    // Re-render from this node down
    this.Render(this.te, this.cfg, this.depth, this.inheritedDispDepth)

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
