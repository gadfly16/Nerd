// Vertigo - Hierarchical tree display design pattern

import * as nerd from "./nerd.js"
import * as config from "./config.js"
import "./util.js" // Side effect: extends DOMRect.prototype

// Layout constants (in pixels)
const W_SIDEBAR = 28 // Width of sidebar/icon block (2ch ≈ 32px at 16px font)
const H_HEADER = 30 // Height of header and open button
const G = 6 // Gap between nodes (0.5ch ≈ 8px)
const I = W_SIDEBAR + G // Indentation per level (40px)
const W_MIN = 320 // Minimum width for content area (60ch ≈ 960px)
const NAME_PADDING = "0.5ch" // Horizontal padding for node names
const SIDEBAR_GAP = 8 // Gap above/below sidebar name text

// TypeInfo stores the display name, measured width, and base hue for a node type
interface TypeInfo {
  name: string
  size: number // 0 means not yet measured
  hue: number // Base hue value (0-360) for HSL color derivation
}

// TypeInfos is a global map from node type to TypeInfo (lazy-initialized widths)
const TypeInfos = new Map<number, TypeInfo>()

// VTree represents a displayed subtree using the Vertigo design pattern
export class VTree extends nerd.Component {
  static style = `
		vertigo-tree {
			display: block;
			padding-right: ${G}px;
			padding-bottom: ${G}px;
		}
	`

  board!: any // Import cycle prevention - Board type from gui.ts
  cfg!: config.Vertigo
  root!: VNode

  // Populate displays the tree using Vertigo block layout
  Populate(board: any, cfg: config.Vertigo): HTMLElement {
    this.board = board
    this.cfg = cfg

    // rootId: 0 means use guiDispRoot
    if (this.cfg.rootID === 0) {
      this.cfg.rootID = nerd.Ctx.dispRoot!.id
      this.cfg.openMap[this.cfg.rootID] = this.cfg.openMap[0]
    }

    // Look up the tree root from registry
    const te = nerd.Registry.get(cfg.rootID)
    if (!te) {
      throw new Error(`TreeEntry with id ${cfg.rootID} not found in registry`)
    }

    // Create root vertigo-node, add to DOM, then populate
    this.root = nerd.Create("vertigo-node") as VNode
    this.appendChild(this.root)
    this.root.Populate(this, te, 0, 0, nerd.Cause.Init)

    // Set initial width
    this.updateWidth()

    return this
  }

  // UpdateOverlay updates dynamic positioning and visibility based on viewport
  // Returns false if tree is below viewport (signals caller to stop iterating)
  UpdateOverlay(): boolean {
    const vp = this.board.viewport
    const bb = this.bbox()

    if (!bb.In(vp)) {
      // Not in viewport - return false if below (stop signal), true if above (continue)
      return bb.top <= vp.bottom
    }

    // Recursively update all visible nodes
    this.root.UpdateOverlay()
    return true
  }

  // updateWidth calculates and sets the tree width based on current open state
  // Called by ResizeObserver (parent size change) or when structure changes
  updateWidth() {
    const computed = this.root.displayDepth() * I + W_SIDEBAR + W_MIN - G
    const viewport = this.board.clientWidth - G
    this.style.width = `${Math.max(computed, viewport)}px`
  }
}

// VNode represents a single node and its children recursively
class VNode extends nerd.Component {
  static style = `
		vertigo-node {
			display: flex;
			margin: ${G}px 0 0 ${G}px;
			overflow: hidden;
		}

		vertigo-node > .side {
			display: flex;
			flex-direction: column;
			width: ${W_SIDEBAR}px;
			flex-shrink: 0;
		}

		vertigo-node > .main {
			display: flex;
			flex-direction: column;
			flex: 1;
			min-width: 0;
		}

		vertigo-node .details {
			display: flex;
			flex-direction: column;
			background-color: hsl(var(--base-hue), 20%, 42%);
			overflow: hidden;
		}

		/* Create animation - roll down */
		@keyframes create {
			from {
				max-height: 0;
				opacity: 0;
			}
			to {
				max-height: var(--measured-height);
				opacity: 1;
			}
		}

		vertigo-node.anim-create {
			animation: create 0.75s ease-out;
		}

		/* Delete animation - roll up */
		@keyframes delete {
			from {
				max-height: var(--measured-height);
				opacity: 1;
			}
			to {
				max-height: 0;
				opacity: 0;
			}
		}

		vertigo-node.anim-delete {
			animation: delete 0.75s ease-in;
		}

		/* Rename animation - bright green flash */
		@keyframes rename {
			from {
				color: #00ff00;
			}
			to {
				color: inherit;
			}
		}

		vertigo-header .name.anim-rename {
			animation: rename 0.75s ease-out;
		}
	`

  static html = `
		<div class="side">
			<vertigo-open></vertigo-open>
			<vertigo-sidebar></vertigo-sidebar>
		</div>
		<div class="main">
			<vertigo-header><span class="name"></span></vertigo-header>
			<div class="details">
				<div class="children"></div>
			</div>
		</div>
	`

  vtree!: VTree
  te: nerd.TreeEntry = new nerd.TreeEntry(0, "", 0, [])
  depth!: number
  inheritedDispDepth!: number // Display depth inherited from parent
  childVNodes = new Map<number, VNode>()
  sidebarNameWidth: number = 0 // Cached width of sidebar name text
  typeInfo!: TypeInfo // Reference to TypeInfo entry for this node's type

  // Cached DOM elements
  open!: Open
  header!: Header
  headerNameElem!: HTMLElement
  sidebar!: Sidebar
  childrenDetail!: HTMLElement

  connectedCallback() {
    this.innerHTML = VNode.html
    this.open = this.Query("vertigo-open")! as Open
    this.header = this.Query("vertigo-header")! as Header
    this.headerNameElem = this.header.Query(".name")!
    this.sidebar = this.Query("vertigo-sidebar")! as Sidebar
    this.childrenDetail = this.Query(".children")!

    // Attach click handler once
    this.open.onclick = (e) => this.openClickHandler(e)
  }

  // Populate updates node state using diff algorithm
  // Compares old tree state (this.te) with new tree state (newTE)
  // and applies minimal DOM updates proportional to changes
  Populate(
    vtree: VTree,
    newTE: nerd.TreeEntry,
    depth: number,
    dispDepth: number,
    cause: nerd.Cause,
  ): void {
    this.vtree = vtree
    this.depth = depth
    this.inheritedDispDepth = dispDepth

    // Update type info if needed (lazy measure)
    this.typeInfo = TypeInfos.get(newTE.nodeType)!
    if (this.typeInfo.size === 0) {
      this.typeInfo.size = this.vtree.board.ctx.measureText(
        this.typeInfo.name,
      ).width
    }

    // Set base hue for color derivation
    this.style.setProperty("--base-hue", this.typeInfo.hue.toString())

    // Update name if changed
    if (this.te.name !== newTE.name) {
      this.setName(newTE.name)
    }

    // Update icon based on openMap state
    const ome = this.vtree.cfg.openMap[newTE.id]
    if (ome !== undefined && ome.open && ome.depth > 0 && ome.depth <= 9) {
      // Explicit depth 1-9
      this.open.textContent = String.fromCharCode(0x2460 + ome.depth - 1)
    } else if (ome !== undefined && ome.open && ome.depth === -1) {
      // Infinite depth
      this.open.textContent = "Ⓘ" // Circled I for infinite
    } else {
      // Neutral or explicitly closed
      this.open.textContent = this.isOpen(newTE.id) ? "◯" : "●"
    }

    // Handle animations based on cause
    if (cause === nerd.Cause.Init) {
      // No animation on initial population
    } else if (cause === nerd.Cause.Create) {
      // Measure natural height and set CSS variable
      const measuredHeight = this.scrollHeight
      this.style.setProperty("--measured-height", `${measuredHeight}px`)
      this.classList.add("anim-create")
      this.addEventListener(
        "animationend",
        () => this.classList.remove("anim-create"),
        { once: true },
      )
    } else if (cause === nerd.Cause.Delete) {
      // Measure current height and set CSS variable
      const measuredHeight = this.scrollHeight
      this.style.setProperty("--measured-height", `${measuredHeight}px`)
      this.classList.add("anim-delete")
      this.addEventListener(
        "animationend",
        () => {
          this.classList.remove("anim-delete")
          this.remove()
        },
        { once: true },
      )
      // Don't process children or update state for deleted nodes
      return
    } else if (cause === nerd.Cause.Match && this.te.name !== newTE.name) {
      // Rename animation
      this.headerNameElem.classList.add("anim-rename")
      this.headerNameElem.addEventListener(
        "animationend",
        () => this.headerNameElem.classList.remove("anim-rename"),
        { once: true },
      )
    }

    // Sort new children by ID in place (this.te.children already sorted from previous pass)
    newTE.children.sort((a, b) => a.id - b.id)

    // Only process children if open
    if (!this.isOpen(newTE.id)) {
      if (this.childVNodes.size > 0) {
        this.clearChildren()
      }
      this.te = newTE // Replace old with new
      return
    }

    const childDispDepth = this.childrenDepth(newTE.id)
    let oldIdx = 0
    let newIdx = 0

    // Diff algorithm - process new children
    while (newIdx < newTE.children.length) {
      const nch = newTE.children[newIdx]
      const och =
        oldIdx < this.te.children.length ? this.te.children[oldIdx] : null

      if (!och || nch.id < och.id) {
        // NEW - either no more old children, or nch not in old array
        const childNode = nerd.Create("vertigo-node") as VNode
        this.childrenDetail.appendChild(childNode)
        this.childVNodes.set(nch.id, childNode)
        // Propagate Init cause, otherwise Create
        const childCause =
          cause === nerd.Cause.Init ? nerd.Cause.Init : nerd.Cause.Create
        childNode.Populate(vtree, nch, depth + 1, childDispDepth, childCause)
        newIdx++
      } else if (nch.id === och.id) {
        // MATCH - check if VNode exists in DOM
        const vnode = this.childVNodes.get(nch.id)
        if (vnode) {
          // VNode exists - update it
          vnode.Populate(
            vtree,
            nch,
            depth + 1,
            childDispDepth,
            nerd.Cause.Match,
          )
        } else {
          // VNode doesn't exist (was closed) - recreate it as Init
          const childNode = nerd.Create("vertigo-node") as VNode
          this.childrenDetail.appendChild(childNode)
          this.childVNodes.set(nch.id, childNode)
          childNode.Populate(
            vtree,
            nch,
            depth + 1,
            childDispDepth,
            nerd.Cause.Init,
          )
        }
        newIdx++
        oldIdx++
      } else {
        // DELETED - och not in new array (nch.id > och.id)
        const vnode = this.childVNodes.get(och.id)
        if (vnode) {
          vnode.Populate(
            vtree,
            och,
            depth + 1,
            childDispDepth,
            nerd.Cause.Delete,
          )
          this.childVNodes.delete(och.id)
        }
        oldIdx++
      }
    }

    // Handle remaining old children (all deleted)
    while (oldIdx < this.te.children.length) {
      const och = this.te.children[oldIdx]
      const vnode = this.childVNodes.get(och.id)
      if (vnode) {
        vnode.Populate(vtree, och, depth + 1, childDispDepth, nerd.Cause.Delete)
        this.childVNodes.delete(och.id)
      }
      oldIdx++
    }

    // Replace old with new after processing complete
    this.te = newTE
  }

  // isOpen determines if this node should display its children
  private isOpen(nodeId: number): boolean {
    const ome = this.vtree.cfg.openMap[nodeId]

    if (ome === undefined) {
      // Neutral node - open if inheritedDispDepth allows it
      return this.inheritedDispDepth !== 0
    }

    // Has explicit openMap entry
    return ome.open
  }

  // childrenDepth calculates the depth value to pass to children
  // Only call this when isOpen() returns true
  private childrenDepth(nodeId: number): number {
    const ome = this.vtree.cfg.openMap[nodeId]

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

  // openClickHandler handles all clicks on open icon based on modifier keys
  private openClickHandler(e: MouseEvent) {
    const ome = this.vtree.cfg.openMap[this.te.id]

    if (e.shiftKey && e.ctrlKey) {
      // Ctrl+Shift: Toggle infinite depth
      if (ome === undefined) {
        // Neutral node - set to infinite
        this.vtree.cfg.openMap[this.te.id] = { open: true, depth: -1 }
      } else if (ome.depth === -1) {
        // Currently infinite - make neutral
        if (ome.open) {
          // Open infinite -> neutral open (delete entry)
          delete this.vtree.cfg.openMap[this.te.id]
        } else {
          // Closed infinite -> neutral closed
          ome.depth = 0
        }
      } else {
        // Has other depth (0, 1-9) - set to infinite and open
        ome.depth = -1
        ome.open = true
      }
    } else if (e.shiftKey) {
      // Shift: Increment explicit depth
      if (ome === undefined) {
        // Neutral node - add explicit depth 1
        this.vtree.cfg.openMap[this.te.id] = { open: true, depth: 1 }
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
    } else if (e.ctrlKey) {
      // Ctrl: Make neutral
      if (ome === undefined) {
        // Already neutral - nothing to do
        return
      }

      if (ome.open) {
        // Currently open - remove from openMap (becomes neutral)
        delete this.vtree.cfg.openMap[this.te.id]
      } else {
        // Currently closed - set depth to 0 (neutral when closed)
        ome.depth = 0
      }
    } else {
      // No modifiers: Toggle open/closed
      if (ome === undefined) {
        // Neutral node - check if currently open or closed
        if (this.inheritedDispDepth === 0) {
          // Currently closed - open it with explicit depth 1
          this.vtree.cfg.openMap[this.te.id] = { open: true, depth: 1 }
        } else {
          // Currently open - close it explicitly
          this.vtree.cfg.openMap[this.te.id] = { open: false, depth: 0 }
        }
      } else if (ome.open) {
        // Currently open - close it (preserve depth)
        ome.open = false
      } else {
        // Currently closed - reopen it
        if (ome.depth === 0) {
          // Was neutral before closing - delete entry to restore neutral state
          delete this.vtree.cfg.openMap[this.te.id]
        } else {
          // Has depth preference - restore to open state
          ome.open = true
        }
      }
    }

    // Re-populate from this node down
    this.Populate(
      this.vtree,
      this.te,
      this.depth,
      this.inheritedDispDepth,
      nerd.Cause.Match,
    )

    // Update tree width and overlay
    this.vtree.updateWidth()
    this.vtree.board.updateOverlay()
  }

  // setName updates the node name and measures its width for canvas rendering
  private setName(name: string) {
    this.headerNameElem.textContent = name
    this.sidebarNameWidth = this.vtree.board.ctx.measureText(name).width
  }

  // createChildren creates child VNode elements and adds them to DOM (assumes container is empty)
  private createChildren() {
    for (const child of this.te.children) {
      const childNode = nerd.Create("vertigo-node") as VNode
      this.childrenDetail.appendChild(childNode)
      this.childVNodes.set(child.id, childNode)
    }
  }

  // clearChildren removes all child nodes
  private clearChildren() {
    for (const child of this.childVNodes.values()) {
      child.remove()
    }
    this.childVNodes.clear()
  }

  // displayDepth recursively finds the maximum depth of open nodes from this node
  displayDepth(): number {
    let maxDepth = this.depth

    // If we have rendered children, check their depths
    if (this.childVNodes.size > 0) {
      for (const child of this.childVNodes.values()) {
        const childMaxDepth = child.displayDepth()
        maxDepth = Math.max(maxDepth, childMaxDepth)
      }
    }

    return maxDepth
  }

  // UpdateOverlay draws this node's overlay elements (type and name) to canvas
  // Returns false if node is below viewport (signals caller to stop iterating siblings)
  UpdateOverlay(): boolean {
    const vp = this.vtree.board.viewport
    const bb = this.bbox()

    if (!bb.In(vp)) {
      // Not in viewport - return false if below (stop signal), true if above (continue)
      return bb.top <= vp.bottom
    }

    // Get sidebar bounding box (viewport coordinates)
    const sb = this.sidebar.bbox()
    const typeRoom = this.typeInfo.size + 2 * SIDEBAR_GAP
    const nameRoom = this.sidebarNameWidth + 2 * SIDEBAR_GAP
    const effNameRoom = sb.height >= typeRoom + nameRoom ? nameRoom : 0

    const ctx = this.vtree.board.ctx
    ctx.fillStyle = "#bbbb"
    ctx.textBaseline = "middle"

    // Draw type name (priority - sticks to top)
    if (sb.height >= typeRoom) {
      // Calculate type anchor position (anchor at top, draws downward with clockwise rotation)
      const typeAnchorY = Math.max(
        sb.top,
        Math.min(vp.top, sb.bottom - typeRoom - effNameRoom),
      )

      // Convert viewport coordinates to canvas coordinates
      const canvasX = sb.left - vp.left
      const canvasY = typeAnchorY - vp.top

      ctx.save()
      ctx.translate(canvasX, canvasY)
      ctx.rotate(Math.PI / 2) // Rotate clockwise to distinguish from node name
      ctx.fillText(this.typeInfo.name, SIDEBAR_GAP, -W_SIDEBAR / 2)
      ctx.restore()
    }

    // Draw node name (sticks to bottom, only if there's room after type)
    if (effNameRoom) {
      // Calculate name anchor position (stick to viewport bottom when possible)
      const nameAnchorY = Math.min(
        sb.bottom,
        Math.max(vp.bottom, sb.top + typeRoom + nameRoom),
      )

      // Convert viewport coordinates to canvas coordinates
      const canvasX = sb.left - vp.left
      const canvasY = nameAnchorY - vp.top

      ctx.save()
      ctx.translate(canvasX, canvasY)
      ctx.rotate(-Math.PI / 2)
      ctx.fillText(this.te.name, SIDEBAR_GAP, W_SIDEBAR / 2 + 1)
      ctx.restore()
    }

    // Recursively update children
    for (const child of this.childVNodes.values()) {
      if (!child.UpdateOverlay()) break
    }

    return true
  }
}

// Open displays the clickable open/close icon at header level
class Open extends nerd.Component {
  static style = `
		vertigo-open {
			display: flex;
			align-items: center;
			justify-content: center;
			flex-shrink: 0;
			height: ${H_HEADER}px;
			background-color: hsl(var(--base-hue), 20%, 35%);
			cursor: pointer;
			user-select: none;
			font-size: 0.66em;
			color: hsl(var(--base-hue), 20%, 70%);
		}
	`
}

// Sidebar is the visual bar that extends below the open icon when node has children
class Sidebar extends nerd.Component {
  static style = `
		vertigo-sidebar {
			display: block;
			flex: 1;
			min-height: 0;
			background-color: hsl(var(--base-hue), 20%, 35%);
		}
	`
}

// Header displays the node name
class Header extends nerd.Component {
  static style = `
		vertigo-header {
			display: flex;
			align-items: center;
			height: ${H_HEADER}px;
			background-color: hsl(var(--base-hue), 5%, 55%);
			padding-left: ${NAME_PADDING};
			color: hsl(var(--base-hue), 15%, 25%);
			font-size: 1.2em;
			font-weight: 500;
			border-right: ${1.5 * G}px solid hsl(var(--base-hue), 20%, 35%);
		}

		vertigo-header .name {
			position: sticky;
			left: ${NAME_PADDING};
			display: inline-block;
		}
	`
}

// Initialize TypeInfos map with all known node types
// Hues centered around blue (240°), clustered closer together
TypeInfos.set(nerd.NodeType.Group, { name: "Group", size: 0, hue: 200 })
TypeInfos.set(nerd.NodeType.Root, { name: "Root", size: 0, hue: 260 })
TypeInfos.set(nerd.NodeType.Authenticator, {
  name: "Authenticator",
  size: 0,
  hue: 220,
})
TypeInfos.set(nerd.NodeType.User, { name: "User", size: 0, hue: 240 })
TypeInfos.set(nerd.NodeType.GUI, { name: "GUI", size: 0, hue: 280 })
TypeInfos.set(nerd.NodeType.TopoUpdater, {
  name: "TopoUpdater",
  size: 0,
  hue: 300,
})

// Register the Vertigo components
VTree.register("vertigo-tree")
Open.register("vertigo-open")
Sidebar.register("vertigo-sidebar")
Header.register("vertigo-header")
VNode.register("vertigo-node")
