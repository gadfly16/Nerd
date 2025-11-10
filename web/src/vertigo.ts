// Vertigo - Hierarchical tree display design pattern

import * as nerd from "./nerd.js"
import * as config from "./config.js"
import * as typeInfo from "./typeInfo.js"
import "./util.js" // Side effect: extends DOMRect.prototype

// Layout constants (in pixels)
const W_SIDEBAR = 28 // Width of sidebar/icon block (2ch ≈ 32px at 16px font)
const H_HEADER = 30 // Height of header and open button
const G = 6 // Gap between nodes (0.5ch ≈ 8px)
const I = W_SIDEBAR + G // Indentation per level (40px)
const W_MIN = 320 // Minimum width for content area (60ch ≈ 960px)
const NAME_PADDING = 8 // Horizontal padding for node names
const SIDEBAR_GAP = 8 // Gap above/below sidebar name text

// VBranch represents a displayed subtree using the Vertigo design pattern
export class VBranch extends nerd.Component {
  static style = `
		v-branch {
			display: block;
			padding-right: ${G}px;
			padding-bottom: ${G}px;
		}
	`

  static Fresh(p: HTMLElement): VBranch {
    const element = document.createElement("v-branch") as VBranch
    p.appendChild(element)
    return element
  }

  board!: any // Import cycle prevention - Board type from gui.ts
  cfg!: config.Vertigo
  branchRoot!: VNode
  maxDepth: number = 0
  openness: number = 0

  connectedCallback() {
    // Query DOM for parent Board
    this.board = this.closest("nerd-board")
  }

  // Update displays the tree using Vertigo block layout
  Update(cfg: config.Vertigo): HTMLElement {
    this.cfg = cfg

    // Hydrate TypeInfos if not already done
    if (!typeInfo.hydrated) {
      typeInfo.Hydrate(this.board.ctx)
    }

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

    // Create root v-node, add to DOM, then update
    this.branchRoot = VNode.Fresh(this)
    this.maxDepth = this.branchRoot.Update(te, nerd.Cause.Init)

    // Set initial width
    this.updateMaxDepth()

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
    this.branchRoot.UpdateOverlay()
    return true
  }

  // updateWidth calculates and sets the tree width based on maxDepth
  // Called after Update() or by ResizeObserver (parent size change)
  updateMaxDepth() {
    this.maxDepth = this.branchRoot.maxDepth
    const maxDispDepth = this.maxDepth - this.branchRoot.te.depth + 1
    const computed = maxDispDepth * I + W_SIDEBAR + W_MIN - G
    const viewport = this.board.clientWidth - G
    this.style.width = `${Math.max(computed, viewport)}px`
  }
}

// VNode represents a single node and its children recursively
class VNode extends nerd.Component {
  static style = `
		v-node {
			display: flex;
			margin: ${G}px 0 0 ${G}px;
		}

		v-node > .side {
			display: flex;
			flex-direction: column;
			width: ${W_SIDEBAR}px;
			flex-shrink: 0;
		}

		v-node .open-icon {
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

		v-node .side-bar {
			display: block;
			flex: 1;
			min-height: 0;
			background-color: hsl(var(--base-hue), 20%, 35%);
		}

		v-node > .main {
			display: flex;
			flex-direction: column;
			flex: 1;
			min-width: 0;
		}

		v-node .details {
			display: flex;
			flex-direction: column;
			background-color: hsl(var(--base-hue), 20%, 42%);
		}

		/* Create animation - roll down */
		@keyframes create {
			from {
				max-height: 0;
			}
			to {
				max-height: var(--measured-height);
			}
		}

		v-node.anim-create {
			animation: create 0.75s ease-out;
		}

		/* Delete animation - roll up */
		@keyframes delete {
			from {
				max-height: var(--measured-height);
			}
			to {
				max-height: 0;
			}
		}

		v-node.anim-delete {
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

		v-header .name.anim-rename {
			animation: rename 0.75s ease-out;
		}
	`

  static html = `
		<div class="side">
			<div class="open-icon"></div>
			<div class="side-bar"></div>
		</div>
		<div class="main">
			<v-header>
				<form class="rename-form">
					<input type="text" class="name" />
				</form>
				<span class="state-icon">⬒</span>
			</v-header>
			<div class="details"></div>
		</div>
	`

  static Fresh(p: HTMLElement): VNode {
    const element = document.createElement("v-node") as VNode
    p.appendChild(element)
    return element
  }

  parent: VBranch | VNode | null = null
  vbranch!: VBranch
  te: nerd.TreeEntry = new nerd.TreeEntry(0, "", 0, [])
  oldte: nerd.TreeEntry = new nerd.TreeEntry(0, "", 0, [])
  maxDepth: number = 0 // Maximum depth in this node's open subtree
  openness: number = 0
  sidebarNameWidth: number = 0 // Cached width of sidebar name text
  typeInfo!: typeInfo.TypeInfo // Reference to TypeInfo entry for this node's type
  fresh: boolean = true // True until first Update() call
  isOpen: boolean = false // True if node is currently open

  // Cached DOM elements
  vopen: HTMLDivElement | null = null
  vheader!: VHeader
  headerNameInput!: HTMLInputElement
  renameForm!: HTMLFormElement
  stateIconSpan!: HTMLSpanElement
  vsidebar!: HTMLDivElement
  detailsDiv!: HTMLDivElement
  vstate: VState | null = null
  vchildren: VChildren | null = null

  connectedCallback() {
    this.innerHTML = VNode.html

    // Query for parent VNode or VBranch
    this.parent = this.parentElement!.closest("v-node") as VNode | null
    if (this.parent) {
      this.vbranch = this.parent.vbranch
    } else {
      this.vbranch = this.closest("v-branch") as VBranch
      this.parent = this.vbranch
    }

    this.vheader = this.Query("v-header")!
    this.renameForm = this.vheader.Query(".rename-form")!
    this.headerNameInput = this.vheader.Query(".name")!
    this.stateIconSpan = this.vheader.Query(".state-icon")!
    this.vsidebar = this.Query(".side-bar")!
    this.detailsDiv = this.Query(".details")!

    // Attach state icon click handler
    this.stateIconSpan.onclick = (e) => this.toggleState(e)

    // Attach rename form submit handler
    this.renameForm.onsubmit = (e) => this.handleRenameSubmit(e)
  }

  // Update updates node state using diff algorithm
  // Compares old tree state (this.oldte) with new tree entry (this.te)
  // Returns maxDepth: the maximum depth in this node's open subtree
  Update(nte: nerd.TreeEntry, cause: nerd.Cause): number {
    // Store old state and immediately update current state
    this.oldte = this.te
    this.te = nte

    // One-time setup for fresh nodes
    if (this.fresh) {
      // Get type info (already measured during hydration)
      this.typeInfo = typeInfo.TypeInfos.get(this.te.nodeType)!

      // Set base hue for color derivation
      this.style.setProperty("--base-hue", this.typeInfo.hue.toString())

      // Query and setup vopen only if this type can have children
      if (!this.typeInfo.leaf) {
        this.vopen = this.Query(".open-icon")!
        this.vopen.onclick = (e) => this.openClickHandler(e)
      }

      this.fresh = false
    }

    // Update name if changed
    if (this.oldte.name !== this.te.name) {
      this.headerNameInput.value = this.te.name
      this.sidebarNameWidth = this.vbranch.board.ctx.measureText(
        this.te.name,
      ).width
    }

    // Update icon based on openMap state and set isOpen (only if node can have children)
    if (this.vopen) {
      const ome = this.vbranch.cfg.openMap[this.te.id]
      if (ome === undefined) {
        if (this.parent!.openness > 0) {
          this.openness = this.parent!.openness - 1
        } else {
          this.openness = this.parent!.openness
        }
        // Neutral node - icon depends on openRequest
        if (this.openness === 0) {
          this.isOpen = false
          this.vopen.textContent = "○" // Closed due to openRequest limit (U+25CB)
        } else {
          this.isOpen = true
          this.vopen.textContent = "◯" // Open (U+25EF)
        }
      } else {
        this.openness = ome.depth
        // Explicit openMap entry
        if (ome.open && ome.depth > 0 && ome.depth <= 9) {
          this.isOpen = true
          this.vopen.textContent = String.fromCharCode(0x2460 + ome.depth - 1) // ①-⑨
        } else if (ome.open && ome.depth === -1) {
          this.isOpen = true
          this.vopen.textContent = "\uE139" // Infinite depth
        } else {
          this.isOpen = false
          this.vopen.textContent = "●" // Explicitly closed (U+25CF)
        }
      }
    }

    // Handle animations based on cause, deafult is no anim (init)
    if (cause === nerd.Cause.Create) {
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
      return 0
    } else if (cause === nerd.Cause.Match && this.oldte.name !== this.te.name) {
      // Rename animation
      this.headerNameInput.classList.add("anim-rename")
      this.headerNameInput.addEventListener(
        "animationend",
        () => this.headerNameInput.classList.remove("anim-rename"),
        { once: true },
      )
    }

    // Only process children if node is open
    if (!this.isOpen) {
      if (this.vchildren) {
        this.vchildren.remove()
      }
      // Node is closed or is a leaf - maxDepth is just this node's own depth
      this.maxDepth = this.te.depth
      return this.maxDepth
    }

    // Node is open - ensure VChildren exists and update it
    if (!this.vchildren) {
      VChildren.Fresh(this.detailsDiv)
    }
    // Get max depth from children and store it
    this.maxDepth = this.vchildren!.Update(cause)
    return this.maxDepth
  }

  // updateMaxDepth recalculates maxDepth from children and propagates changes upward
  updateMaxDepth(): void {
    const oldMaxDepth = this.maxDepth

    // Find max of children's maxDepth
    this.maxDepth = this.te.depth
    if (this.vchildren) {
      for (const child of this.vchildren.childrenMap.values()) {
        this.maxDepth = Math.max(this.maxDepth, child.maxDepth)
      }
    }

    // Only update parent if necessary
    if (
      this.maxDepth !== oldMaxDepth &&
      (oldMaxDepth === this.parent!.maxDepth ||
        this.maxDepth > this.parent!.maxDepth)
    ) {
      this.parent!.updateMaxDepth()
    }
  }

  // openClickHandler handles all clicks on open icon based on modifier keys
  private openClickHandler(e: MouseEvent) {
    const ome = this.vbranch.cfg.openMap[this.te.id]

    if (e.shiftKey && e.ctrlKey) {
      delete this.vbranch.cfg.openMap[this.te.id]
    } else if (e.shiftKey) {
      // Shift: Increment explicit depth
      if (ome === undefined) {
        // Neutral node - add explicit depth 1
        this.vbranch.cfg.openMap[this.te.id] = { open: true, depth: 1 }
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
      // Ctrl+Shift: Toggle infinite depth
      if (ome === undefined) {
        // Neutral node - set to infinite
        this.vbranch.cfg.openMap[this.te.id] = { open: true, depth: -1 }
      } else if (ome.depth === -1) {
        // Currently infinite - make neutral
        delete this.vbranch.cfg.openMap[this.te.id]
      } else {
        // Has other depth (0, 1-9) - set to infinite and open
        ome.depth = -1
        ome.open = true
      }
    } else {
      // No modifiers: Toggle open/closed
      if (ome === undefined) {
        // Neutral node - check if currently open or closed
        if (this.openness === 0) {
          // Currently closed - open it with explicit depth 1
          this.vbranch.cfg.openMap[this.te.id] = { open: true, depth: 1 }
        } else {
          // Currently open - close it explicitly
          this.vbranch.cfg.openMap[this.te.id] = { open: false, depth: 0 }
        }
      } else if (ome.open) {
        // Currently open - close it (preserve depth)
        ome.open = false
      } else {
        // Currently closed - reopen it
        if (ome.depth === 0) {
          // Was neutral before closing - delete entry to restore neutral state
          delete this.vbranch.cfg.openMap[this.te.id]
        } else {
          // Has depth preference - restore to open state
          ome.open = true
        }
      }
    }

    // Re-populate from this node down
    this.Update(this.te, nerd.Cause.Match)

    // Recalculate maxDepth up the tree - call on parent since this node was just updated
    if (this.parent) {
      this.parent.updateMaxDepth()
    } else {
      // We are the root - update width directly
      this.vbranch.updateMaxDepth()
    }

    // Update overlay
    this.vbranch.board.updateOverlay()
  }

  // toggleState creates or destroys the state detail element
  private toggleState(e: Event) {
    e.preventDefault()
    if (this.vstate) {
      this.vstate.remove()
    } else {
      VState.Fresh(this.detailsDiv)
      this.vstate!.Update()
    }
  }

  // handleRenameSubmit processes the rename form submission
  private async handleRenameSubmit(e: Event) {
    e.preventDefault()

    const newName = this.headerNameInput.value.trim()
    const oldName = this.te.name

    // Check if name actually changed
    if (!newName || newName === oldName) {
      this.headerNameInput.blur()
      return
    }

    // Get parent ID, use 0 for root nodes (special case for user renaming their own node)
    const parentId = this.te.parent?.id || 0

    try {
      await nerd.AskRenameChild(parentId, oldName, newName)
      nerd.Log(nerd.Status.OK, `Renamed "${oldName}" to "${newName}"`)
      this.headerNameInput.blur()
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Rename failed"
      nerd.Log(nerd.Status.Error, msg)
      // Keep input focused so user can fix and retry
    }
  }

  // UpdateOverlay draws this node's overlay elements (type and name) to canvas
  // Returns false if node is below viewport (signals caller to stop iterating siblings)
  UpdateOverlay(): boolean {
    const vp = this.vbranch.board.viewport
    const bb = this.bbox()

    if (!bb.In(vp)) {
      // Not in viewport - return false if below (stop signal), true if above (continue)
      return bb.top <= vp.bottom
    }

    // Get sidebar bounding box (viewport coordinates)
    const sb = this.vsidebar.getBoundingClientRect()
    const typeRoom = this.typeInfo.size + 2 * SIDEBAR_GAP
    const nameRoom = this.sidebarNameWidth + 2 * SIDEBAR_GAP
    const effNameRoom = sb.height >= typeRoom + nameRoom ? nameRoom : 0

    const ctx = this.vbranch.board.ctx
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
    if (this.vchildren) {
      return this.vchildren.UpdateOverlay()
    }

    return true
  }
}

// VChildren displays child VNode elements
class VChildren extends nerd.Component {
  static style = `
		v-children {
			display: block;
		}
	`

  static Fresh(p: HTMLElement): VChildren {
    const element = document.createElement("v-children") as VChildren
    p.appendChild(element)
    return element
  }

  vnode!: VNode
  childrenMap = new Map<number, VNode>()

  connectedCallback() {
    // Query DOM for parent VNode and cache reference in parent
    this.vnode = this.closest("v-node") as VNode
    this.vnode.vchildren = this
  }

  disconnectedCallback() {
    // Clear parent's reference to this children container
    this.vnode.vchildren = null as any
  }

  Update(cause: nerd.Cause): number {
    // Sort new children by ID in place
    this.vnode.te.children.sort((a, b) => a.id - b.id)

    let oldIdx = 0
    let newIdx = 0
    let maxDepth = this.vnode.te.depth

    // Diff algorithm - process new children
    while (newIdx < this.vnode.te.children.length) {
      const nch = this.vnode.te.children[newIdx]
      const och =
        oldIdx < this.vnode.oldte.children.length
          ? this.vnode.oldte.children[oldIdx]
          : null

      if (!och || nch.id < och.id) {
        // NEW - either no more old children, or nch not in old array
        const childNode = VNode.Fresh(this)
        this.childrenMap.set(nch.id, childNode)
        // Propagate Init cause, otherwise Create
        const childCause =
          cause === nerd.Cause.Init ? nerd.Cause.Init : nerd.Cause.Create
        const childMaxDepth = childNode.Update(nch, childCause)
        maxDepth = Math.max(maxDepth, childMaxDepth)
        newIdx++
      } else if (nch.id === och.id) {
        // MATCH - check if VNode exists in DOM
        const vnode = this.childrenMap.get(nch.id)
        if (vnode) {
          // VNode exists - update it
          const childMaxDepth = vnode.Update(nch, nerd.Cause.Match)
          maxDepth = Math.max(maxDepth, childMaxDepth)
        } else {
          // VNode doesn't exist (was closed) - recreate it as Init
          const childNode = VNode.Fresh(this)
          this.childrenMap.set(nch.id, childNode)
          const childMaxDepth = childNode.Update(nch, nerd.Cause.Init)
          maxDepth = Math.max(maxDepth, childMaxDepth)
        }
        newIdx++
        oldIdx++
      } else {
        // DELETED - och not in new array (nch.id > och.id)
        const vnode = this.childrenMap.get(och.id)
        if (vnode) {
          vnode.Update(och, nerd.Cause.Delete)
          this.childrenMap.delete(och.id)
        }
        oldIdx++
      }
    }

    // Handle remaining old children (all deleted)
    while (oldIdx < this.vnode.oldte.children.length) {
      const och = this.vnode.oldte.children[oldIdx]
      const vnode = this.childrenMap.get(och.id)
      if (vnode) {
        vnode.Update(och, nerd.Cause.Delete)
        this.childrenMap.delete(och.id)
      }
      oldIdx++
    }

    return maxDepth
  }

  UpdateOverlay(): boolean {
    for (const child of this.childrenMap.values()) {
      if (!child.UpdateOverlay()) return false
    }
    return true
  }
}

// VValue displays a value
class VValue extends nerd.Component {
  static style = `
		v-value {
			display: block;
		}
	`

  static html = `<span class="value-name"></span> <span class="value-value"></span>`

  static Fresh(p: HTMLElement): VValue {
    const element = document.createElement("v-value") as VValue
    p.appendChild(element)
    return element
  }

  nameSpan!: HTMLSpanElement
  valueSpan!: HTMLSpanElement
  sealSpan: HTMLSpanElement | null = null
  dispSeal!: nerd.Seal
  parm!: boolean
  fresh = true

  connectedCallback() {
    this.innerHTML = VValue.html
    this.nameSpan = this.Query(".value-name")! as HTMLSpanElement
    this.valueSpan = this.Query(".value-value")! as HTMLSpanElement
  }

  Update(value: any) {
    if (this.fresh) {
      const name = this.getAttribute("name")!
      this.nameSpan.textContent = `${name}:`

      // Get display seal from seal attribute
      const seal = this.getAttribute("seal")!
      this.dispSeal = nerd.Seals.get(seal)!

      // Only add sealSpan if not a secret
      if (seal !== "secret") {
        this.sealSpan = document.createElement("span")
        this.appendChild(this.sealSpan)
        this.sealSpan.textContent = seal
      }

      // Check if this is an editable parameter
      this.parm = this.hasAttribute("parm")

      // Underline value and seal if it's a parameter
      if (this.parm) {
        this.valueSpan.style.textDecoration = "underline"
        if (this.sealSpan) {
          this.sealSpan.style.textDecoration = "underline"
        }
      }

      this.fresh = false
    }

    // Update value
    if (this.dispSeal.idea === nerd.Idea.Secret) {
      this.valueSpan.textContent = "••••"
    } else {
      this.valueSpan.textContent = String(value)
    }
  }
}

// VState displays the state detail form
class VState extends nerd.Component {
  static style = `
		v-state {
			display: none;
			padding-top: ${NAME_PADDING * 0.75}px;
			padding-bottom: ${NAME_PADDING * 0.75}px;
			padding-left: ${NAME_PADDING * 3}px;
			border-right: ${1.5 * G}px solid hsl(var(--base-hue), 20%, 38%);
		}

		v-state fieldset {
			border: none;
			padding: 0;
			margin: 0;
		}

		v-state legend {
			margin-left: ${NAME_PADDING * -2}px;
			color: hsl(var(--base-hue), 5%, 65%);
			font-size: 0.85em;
		}
	`

  static html = `
		<fieldset>
			<legend>System</legend>
			<v-value name="id" seal="#"></v-value>
		</fieldset>
	`

  static Fresh(p: HTMLElement): VState {
    const element = document.createElement("v-state") as VState
    p.prepend(element)
    return element
  }

  vnode!: VNode
  valueRegistry = new Map<string, VValue>()
  fresh = true

  connectedCallback() {
    // Query DOM for parent VNode and cache reference in parent
    this.vnode = this.closest("v-node") as VNode
    this.vnode.vstate = this
  }

  disconnectedCallback() {
    // Clear parent's reference to this state detail
    this.vnode.vstate = null as any
  }

  async Update() {
    if (this.fresh) {
      // Build HTML: static system part + node-specific values
      const nodeTypeHTML = this.vnode.typeInfo.values || ""
      this.innerHTML = VState.html + nodeTypeHTML

      // Query all v-value elements and register them by name
      const values = this.querySelectorAll("v-value")
      for (const value of values) {
        const vvalue = value as VValue
        const name = vvalue.getAttribute("name")
        if (name) {
          this.valueRegistry.set(name, vvalue)
        }
      }
    }

    // Fetch state from server (array format: [[name, value], ...])
    const state = await nerd.AskGetState(this.vnode.te.id)

    // Update values by looking up names in registry
    for (const [name, value] of state) {
      const vvalue = this.valueRegistry.get(name)
      if (vvalue) {
        vvalue.Update(value)
      }
    }

    // Show the state panel after it's ready on first populate
    if (this.fresh) {
      this.style.display = "block"
      this.fresh = false
    }
  }
}

// Header displays the node name
class VHeader extends nerd.Component {
  static style = `
		v-header {
			display: flex;
			align-items: center;
			height: ${H_HEADER}px;
			background-color: hsl(var(--base-hue), 5%, 55%);
			padding-left: ${NAME_PADDING}px;
			padding-right: ${NAME_PADDING}px;
			color: hsl(var(--base-hue), 15%, 25%);
			font-size: 1.2em;
			font-weight: 500;
			border-right: ${1.5 * G}px solid hsl(var(--base-hue), 20%, 35%);
		}

		v-header .rename-form {
			position: sticky;
			left: ${NAME_PADDING}px;
			display: flex;
			margin: 0;
			padding: 0;
			min-width: 0;
		}

		v-header .name {
			font-family: 'Inter';
			font-size: 1em;
			font-weight: 500;
			color: inherit;
			background: transparent;
			border: none;
			outline: none;
			padding: 0;
			margin: 0;
			cursor: pointer;
		}

		v-header .name:focus {
			cursor: text;
			text-decoration: underline;
			text-decoration-color: hsl(var(--base-hue), 5%, 85%);
		}

		v-header .state-icon {
			position: sticky;
			right: ${NAME_PADDING}px;
			margin-left: auto;
			cursor: pointer;
			color: hsl(var(--base-hue), 15%, 37%);
		}
		`
}

// Register the Vertigo components
VBranch.register("v-branch")
VChildren.register("v-children")
VValue.register("v-value")
VState.register("v-state")
VHeader.register("v-header")
VNode.register("v-node")
