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
const NAME_PADDING = 8 // Horizontal padding for node names
const SIDEBAR_GAP = 8 // Gap above/below sidebar name text

// TypeInfo stores the display name, measured width, base hue, and values HTML for a node type
interface TypeInfo {
  name: string
  size: number // 0 means not yet measured
  hue: number // Base hue value (0-360) for HSL color derivation
  values?: string // HTML for node-specific values (optional, defaults to empty)
}

// TypeInfos is a global map from node type to TypeInfo (lazy-initialized widths)
const TypeInfos = new Map<number, TypeInfo>()

// VBranch represents a displayed subtree using the Vertigo design pattern
export class VBranch extends nerd.Component {
  static style = `
		v-branch {
			display: block;
			padding-right: ${G}px;
			padding-bottom: ${G}px;
		}
	`

  board!: any // Import cycle prevention - Board type from gui.ts
  cfg!: config.Vertigo
  root!: VNode

  // Update displays the tree using Vertigo block layout
  Update(board: any, cfg: config.Vertigo): HTMLElement {
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

    // Create root v-node, add to DOM, then update
    this.root = nerd.Create("v-node") as VNode
    this.appendChild(this.root)
    this.root.Update(this, te, 0, 0, nerd.Cause.Init)

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
			<v-open></v-open>
			<v-sidebar></v-sidebar>
		</div>
		<div class="main">
			<v-header>
				<form class="rename-form">
					<input type="text" class="name" />
				</form>
				<span class="state-icon">⬒</span>
			</v-header>
			<div class="details">
				<div class="children"></div>
			</div>
		</div>
	`

  vtree!: VBranch
  te: nerd.TreeEntry = new nerd.TreeEntry(0, "", 0, [])
  depth!: number
  inheritedDispDepth!: number // Display depth inherited from parent
  childrenMap = new Map<number, VNode>()
  sidebarNameWidth: number = 0 // Cached width of sidebar name text
  typeInfo!: TypeInfo // Reference to TypeInfo entry for this node's type

  // Cached DOM elements
  vopen!: VOpen
  vheader!: VHeader
  headerNameInput!: HTMLInputElement
  renameForm!: HTMLFormElement
  stateIconSpan!: HTMLSpanElement
  vsidebar!: VSidebar
  detailsDiv!: HTMLDivElement
  vstate: VState | null = null
  childrenDetail!: HTMLElement

  connectedCallback() {
    this.innerHTML = VNode.html
    this.vopen = this.Query("v-open")!
    this.vheader = this.Query("v-header")!
    this.renameForm = this.vheader.Query(".rename-form")!
    this.headerNameInput = this.vheader.Query(".name")!
    this.stateIconSpan = this.vheader.Query(".state-icon")!
    this.vsidebar = this.Query("v-sidebar")!
    this.detailsDiv = this.Query(".details")!
    this.childrenDetail = this.Query(".children")!

    // Attach click handler once
    this.vopen.onclick = (e) => this.openClickHandler(e)

    // Attach state icon click handler
    this.stateIconSpan.onclick = (e) => this.toggleState(e)

    // Attach rename form submit handler
    this.renameForm.onsubmit = (e) => this.handleRenameSubmit(e)
  }

  // Update updates node state using diff algorithm
  // Compares old tree state (this.te) with new tree entry (nte)
  // and applies minimal DOM updates proportional to changes
  Update(
    vbranch: VBranch,
    nte: nerd.TreeEntry,
    depth: number,
    dispDepth: number,
    cause: nerd.Cause,
  ): void {
    this.vtree = vbranch
    this.depth = depth
    this.inheritedDispDepth = dispDepth

    // Update type info if needed (lazy measure)
    this.typeInfo = TypeInfos.get(nte.nodeType)!
    if (this.typeInfo.size === 0) {
      this.typeInfo.size = this.vtree.board.ctx.measureText(
        this.typeInfo.name,
      ).width
    }

    // Set base hue for color derivation
    this.style.setProperty("--base-hue", this.typeInfo.hue.toString())

    // Update name if changed
    if (this.te.name !== nte.name) {
      this.setName(nte.name)
    }

    // Update icon based on openMap state
    const ome = this.vtree.cfg.openMap[nte.id]
    if (ome !== undefined && ome.open && ome.depth > 0 && ome.depth <= 9) {
      // Explicit depth 1-9
      this.vopen.textContent = String.fromCharCode(0x2460 + ome.depth - 1)
    } else if (ome !== undefined && ome.open && ome.depth === -1) {
      // Infinite depth
      this.vopen.textContent = "Ⓘ" // Circled I for infinite
    } else {
      // Neutral or explicitly closed
      this.vopen.textContent = this.isOpen(nte.id) ? "◯" : "●"
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
    } else if (cause === nerd.Cause.Match && this.te.name !== nte.name) {
      // Rename animation
      this.headerNameInput.classList.add("anim-rename")
      this.headerNameInput.addEventListener(
        "animationend",
        () => this.headerNameInput.classList.remove("anim-rename"),
        { once: true },
      )
    }

    // Sort new children by ID in place (this.te.children already sorted from previous pass)
    nte.children.sort((a, b) => a.id - b.id)

    // Only process children if open and destroy them if not
    if (!this.isOpen(nte.id)) {
      if (this.childrenMap.size > 0) {
        this.destroyChildren()
      }
      this.te = nte // Replace old with new
      return
    }

    const childDispDepth = this.childrenDepth(nte.id)
    let oldIdx = 0
    let newIdx = 0

    // Diff algorithm - process new children
    while (newIdx < nte.children.length) {
      const nch = nte.children[newIdx]
      const och =
        oldIdx < this.te.children.length ? this.te.children[oldIdx] : null

      if (!och || nch.id < och.id) {
        // NEW - either no more old children, or nch not in old array
        const childNode = nerd.Create("v-node") as VNode
        this.childrenDetail.appendChild(childNode)
        this.childrenMap.set(nch.id, childNode)
        // Propagate Init cause, otherwise Create
        const childCause =
          cause === nerd.Cause.Init ? nerd.Cause.Init : nerd.Cause.Create
        childNode.Update(vbranch, nch, depth + 1, childDispDepth, childCause)
        newIdx++
      } else if (nch.id === och.id) {
        // MATCH - check if VNode exists in DOM
        const vnode = this.childrenMap.get(nch.id)
        if (vnode) {
          // VNode exists - update it
          vnode.Update(
            vbranch,
            nch,
            depth + 1,
            childDispDepth,
            nerd.Cause.Match,
          )
        } else {
          // VNode doesn't exist (was closed) - recreate it as Init
          const childNode = nerd.Create("v-node") as VNode
          this.childrenDetail.appendChild(childNode)
          this.childrenMap.set(nch.id, childNode)
          childNode.Update(
            vbranch,
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
        const vnode = this.childrenMap.get(och.id)
        if (vnode) {
          vnode.Update(
            vbranch,
            och,
            depth + 1,
            childDispDepth,
            nerd.Cause.Delete,
          )
          this.childrenMap.delete(och.id)
        }
        oldIdx++
      }
    }

    // Handle remaining old children (all deleted)
    while (oldIdx < this.te.children.length) {
      const och = this.te.children[oldIdx]
      const vnode = this.childrenMap.get(och.id)
      if (vnode) {
        vnode.Update(vbranch, och, depth + 1, childDispDepth, nerd.Cause.Delete)
        this.childrenMap.delete(och.id)
      }
      oldIdx++
    }

    // Replace old with new after processing complete
    this.te = nte
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
    this.Update(
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
    this.headerNameInput.value = name
    this.sidebarNameWidth = this.vtree.board.ctx.measureText(name).width
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

  // createChildren creates child VNode elements and adds them to DOM (assumes container is empty)
  private createChildren() {
    for (const child of this.te.children) {
      const childNode = nerd.Create("v-node") as VNode
      this.childrenDetail.appendChild(childNode)
      this.childrenMap.set(child.id, childNode)
    }
  }

  // clearChildren removes all child nodes
  private destroyChildren() {
    for (const child of this.childrenMap.values()) {
      child.remove()
    }
    this.childrenMap.clear()
  }

  // displayDepth recursively finds the maximum depth of open nodes from this node
  displayDepth(): number {
    let maxDepth = this.depth

    // If we have rendered children, check their depths
    if (this.childrenMap.size > 0) {
      for (const child of this.childrenMap.values()) {
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
    const sb = this.vsidebar.bbox()
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
    for (const child of this.childrenMap.values()) {
      if (!child.UpdateOverlay()) break
    }

    return true
  }
}

// Open displays the clickable open/close icon at header level
class VOpen extends nerd.Component {
  static style = `
		v-open {
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

// Sidebar is the visual bar that extends below the open icon when node has details
class VSidebar extends nerd.Component {
  static style = `
		v-sidebar {
			display: block;
			flex: 1;
			min-height: 0;
			background-color: hsl(var(--base-hue), 20%, 35%);
		}
	`
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

// Initialize TypeInfos map with all known node types
// Hues centered around blue (240°), clustered closer together
TypeInfos.set(nerd.NodeType.Group, { name: "Group", size: 0, hue: 200 })
TypeInfos.set(nerd.NodeType.Root, { name: "Root", size: 0, hue: 260 })
TypeInfos.set(nerd.NodeType.Authenticator, {
  name: "Authenticator",
  size: 0,
  hue: 220,
})
TypeInfos.set(nerd.NodeType.User, {
  name: "User",
  size: 0,
  hue: 240,
  values: `
    <fieldset>
      <legend>User</legend>
      <v-value name="password" seal="secret" parm></v-value>
    </fieldset>
  `,
})
TypeInfos.set(nerd.NodeType.GUI, { name: "GUI", size: 0, hue: 280 })
TypeInfos.set(nerd.NodeType.TopoUpdater, {
  name: "TopoUpdater",
  size: 0,
  hue: 300,
})

// Register the Vertigo components
VBranch.register("v-branch")
VOpen.register("v-open")
VSidebar.register("v-sidebar")
VValue.register("v-value")
VState.register("v-state")
VHeader.register("v-header")
VNode.register("v-node")
