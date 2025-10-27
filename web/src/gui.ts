// Nerd GUI - Personal Software Agent Graphical User Interface

import { imsg } from "./imsg.js"
import { $ } from "./util.js"
import * as nerd from "./nerd.js"
import * as config from "./config.js"
import * as vertigo from "./vertigo.js"

// Side effect imports to trigger component registration
import "./widgets.js"
import "./vertigo.js"

// Design constants
export const BOARDER = 8 // Board border width in pixels
export const STATUS_S = 20 // Status indicator size in pixels
export const FOOTER_H = 32 // Footer height in pixels

// Global GUI singleton - set during GUI.connectedCallback()
let gui: GUI

// GUI is the root component that manages authentication state
// Shows Auth component when userId is 0, otherwise shows Workbench
// userId is injected by server via template replacement in index.html
class GUI extends nerd.Component {
  static style = `
		@font-face {
			font-family: 'Inter';
			src: url('/fonts/InterVariable.woff2');
			font-weight: 100 900;
			font-display: block;
		}

		body {
			margin: 0;
			padding: 0;
		}

		h2 {
			margin: 0 0 0.25em 0;
			font-size: 1.5em;
		}

		.error {
			color: red;
		}

		nerd-gui {
			display: flex;
			flex-direction: column;
			width: 100vw;
			height: 100vh;
			font-family: 'Inter';
			background: #fff;
		}

		.hidden {
			display: none;
		}
	`

  // GUI instance fields
  private auth = nerd.Create("nerd-auth") as Auth
  private workbench = nerd.Create("nerd-workbench") as Workbench

  connectedCallback() {
    gui = this

    // Get userID and admin flag from index.html, and add them to global context
    nerd.Ctx.userID = parseInt(this.getAttribute("userid")!, 10)
    nerd.Ctx.admin = this.getAttribute("admin") === "true"

    // Append both auth and workbench to DOM (one will be hidden)
    this.appendChild(this.auth)
    this.appendChild(this.workbench)

    // Listen for unauthorized events
    window.addEventListener("nerd:unauthorized", () => this.SwitchToAuth())

    // Show auth or workbench based on initial userId
    if (nerd.Ctx.userID === 0) {
      this.SwitchToAuth()
    } else {
      this.SwitchToWorkbench()
    }
  }

  // SwitchToAuth clears all sensitive data and shows authentication UI
  // Called on logout, session expiry, or authentication failure
  SwitchToAuth() {
    // Cleanup workbench when switching away
    this.workbench.Cleanup()

    // Hide workbench, show auth
    this.workbench.Hide()
    this.auth.Show()
  }

  // SwitchToWorkbench hides auth and loads workbench
  SwitchToWorkbench() {
    // Cleanup auth when switching away
    this.auth.Cleanup()

    // Hide auth, show workbench
    this.auth.Hide()
    this.workbench.Show()
    this.workbench.Populate()
  }
}

// Workbench is the main authenticated UI with header, footer, and two board areas
class Workbench extends nerd.Component {
  static style = `
		nerd-workbench {
			display: grid;
			grid-template-rows: auto 1fr auto;
			width: 100%;
			height: 100%;
		}

		nerd-workbench .arena {
			display: flex;
			padding: 0 ${BOARDER}px ${BOARDER}px 0;
			overflow: hidden;
			background: #333;
		}

		nerd-workbench nerd-board {
			flex: 1;
			min-width: 0;
			min-height: 0;
			margin: ${BOARDER}px 0 0 ${BOARDER}px;
			overflow: auto;
		}

		nerd-workbench canvas {
			position: absolute;
			pointer-events: none;
			z-index: 10;
		}
	`

  static html = `
		<nerd-header></nerd-header>
		<div class="arena">
			<nerd-board class="board_0"></nerd-board>
			<nerd-board class="board_1"></nerd-board>
		</div>
		<nerd-footer></nerd-footer>
	`

  // Workbench instance fields
  cfg!: config.Workbench
  private boardElements: Board[] = []
  private saveTimer: number | null = null
  private ws: WebSocket | null = null
  private guiNodeId: number = 0
  private footer!: Footer

  connectedCallback() {
    this.innerHTML = Workbench.html
    this.boardElements = [
      this.Query("nerd-board.board_0") as Board,
      this.Query("nerd-board.board_1") as Board,
    ]
    this.footer = this.Query("nerd-footer") as Footer
  }

  // Populate loads the tree and populates the board displays
  async Populate() {
    try {
      // Fetch tree from server and initialize with parent pointers
      const targetId = nerd.Ctx.admin ? 1 : nerd.Ctx.userID
      const data = await nerd.AskGetTree(targetId)
      nerd.Ctx.dispRoot = nerd.TreeEntry.init(data)

      // Load saved config from localStorage or use deep copy of default
      const savedCfg = this.loadConfig()
      this.cfg = savedCfg || structuredClone(config.defaultWorkbench)

      // Populate all boards with their configs
      for (let i = 0; i < this.boardElements.length; i++) {
        this.boardElements[i].Populate(this, i)
      }

      // Start auto-save timer
      this.startAutoSave()

      // Setup WebSocket connection
      this.setupWebSocket()
    } catch (err) {
      console.error("Failed to populate workbench:", err)
      // TODO: Show error to user
    }
  }

  // loadConfig retrieves the saved workbench config from localStorage
  // TODO: Implement encryption of user configs
  private loadConfig(): config.Workbench | null {
    const key = `nerd:workbench:${nerd.Ctx.userID}`
    const json = localStorage.getItem(key)
    if (!json) return null

    try {
      return JSON.parse(json) as config.Workbench
    } catch (err) {
      console.error("Failed to parse saved config:", err)
      return null
    }
  }

  // saveConfig persists the current workbench config to localStorage
  // TODO: Implement encryption of user configs
  private saveConfig() {
    const key = `nerd:workbench:${nerd.Ctx.userID}`
    const json = JSON.stringify(this.cfg)
    localStorage.setItem(key, json)
  }

  // startAutoSave begins periodic config saves every 2 seconds
  private startAutoSave() {
    this.saveTimer = window.setInterval(() => this.saveConfig(), 2000)
  }

  // stopAutoSave cancels the periodic save timer
  private stopAutoSave() {
    if (this.saveTimer !== null) {
      clearInterval(this.saveTimer)
      this.saveTimer = null
    }
  }

  // Cleanup stops all workbench operations and clears all data
  Cleanup() {
    // Stop WebSocket connection
    this.closeWebSocket()

    // Stop auto-save timer
    this.stopAutoSave()

    // Clear all sensitive information
    nerd.Ctx.userID = 0
    nerd.Ctx.dispRoot = null
    nerd.Nodes.clear()

    // Clear all boards
    for (const board of this.boardElements) {
      board.Clear()
    }
  }

  // setupWebSocket establishes WebSocket connection for real-time updates
  private setupWebSocket() {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
    const wsUrl = `${protocol}//${window.location.host}/ws`

    this.ws = new WebSocket(wsUrl)

    this.ws.onopen = () => {
      nerd.Log(nerd.Status.OK, "WebSocket connected")
    }

    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data)
      this.handleWebSocketMessage(msg)
    }

    this.ws.onerror = (error) => {
      nerd.Log(nerd.Status.Error, "WebSocket error")
    }

    this.ws.onclose = (event) => {
      const reason = event.reason || "Connection closed"
      nerd.Log(nerd.Status.Error, reason)
    }
  }

  // closeWebSocket closes the WebSocket connection
  private closeWebSocket() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
      nerd.Log(nerd.Status.OK, "Closed WebSocket")
    }
  }

  // handleWebSocketMessage processes incoming WebSocket messages
  private handleWebSocketMessage(msg: any) {
    if (msg.type === "init") {
      // Store GUI node ID for future Subscribe messages
      this.guiNodeId = msg.guiNodeId
      console.log(`GUI node ID: ${this.guiNodeId}`)
    } else {
      // Handle other message types (UpdateTopo, InfoUpdate, etc.)
      console.log("Received WebSocket message:", msg)
    }
  }
}

// Board is a structural component that contains multiple ListTree elements
class Board extends nerd.Component {
  static style = `
		nerd-board {
			display: block;
			position: relative;
			background: #555;
			color: #ccc;
			overflow: auto;
			scrollbar-width: none; /* Firefox */
			overscroll-behavior: none; /* Prevent bounce/rubber-band effect */
		}

		nerd-board::-webkit-scrollbar {
			display: none; /* Chrome, Safari, Edge */
		}
	`

  static html = ``

  workbench!: Workbench
  cfg!: config.Board
  viewport!: DOMRect
  private trees: vertigo.VTree[] = []
  canvas!: HTMLCanvasElement
  ctx!: CanvasRenderingContext2D
  private isDragging = false
  private dragStartX = 0
  private dragStartY = 0
  private dragScrollLeft = 0
  private dragScrollTop = 0
  private resizeObs!: ResizeObserver
  private rafScheduled = false

  connectedCallback() {
    this.innerHTML = Board.html

    // MMB drag scrolling
    this.addEventListener("mousedown", (e) => this.handleMouseDown(e))
    this.addEventListener("mousemove", (e) => this.handleMouseMove(e))
    this.addEventListener("mouseup", () => this.handleMouseUp())
    this.addEventListener("mouseleave", () => this.handleMouseUp())

    // Scroll listener - batch updates with RAF to avoid redundant calculations
    this.addEventListener("scroll", () => {
      if (!this.rafScheduled) {
        this.rafScheduled = true
        requestAnimationFrame(() => {
          this.rafScheduled = false
          this.updateOverlay()
        })
      }
    })
  }

  disconnectedCallback() {
    this.resizeObs?.disconnect()
  }

  // Clear removes all trees from the board
  Clear() {
    for (const tree of this.trees) {
      tree.remove()
    }
    this.trees = []
  }

  private resizeCanvas() {
    this.viewport = this.bbox()

    // Position canvas absolutely in screen coordinates to overlay board
    this.canvas.style.left = `${this.viewport.left}px`
    this.canvas.style.top = `${this.viewport.top}px`

    // Size canvas to match board's content area
    this.canvas.width = this.viewport.width
    this.canvas.height = this.viewport.height

    // Re-apply font after canvas resize (clears context state)
    this.ctx.font = "400 16px Inter"
  }

  private updateOverlay() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

    for (const tree of this.trees) {
      if (!tree.UpdateOverlay()) break
    }
  }

  private handleMouseDown(e: MouseEvent) {
    if (e.button !== 1) return // Only middle mouse button
    e.preventDefault()

    this.isDragging = true
    this.dragStartX = e.pageX
    this.dragStartY = e.pageY
    this.dragScrollLeft = this.scrollLeft
    this.dragScrollTop = this.scrollTop
  }

  private handleMouseMove(e: MouseEvent) {
    if (!this.isDragging) return
    e.preventDefault()

    const dx = e.pageX - this.dragStartX
    const dy = e.pageY - this.dragStartY
    this.scrollLeft = this.dragScrollLeft - dx
    this.scrollTop = this.dragScrollTop - dy
  }

  private handleMouseUp() {
    this.isDragging = false
  }

  // Populate displays all Vertigo trees for this board
  // Assumes board is already clear
  Populate(workbench: Workbench, index: number) {
    this.workbench = workbench
    this.cfg = workbench.cfg.boards[index]

    // Create canvas and append to parent (arena) to avoid scrolling with board content
    this.canvas = document.createElement("canvas")
    this.parentElement!.appendChild(this.canvas)
    this.ctx = this.canvas.getContext("2d")!

    // Size canvas to match board viewport
    this.resizeCanvas()

    for (const treeCfg of this.cfg.trees) {
      const vertigoTree = nerd.Create("vertigo-tree") as vertigo.VTree
      this.appendChild(vertigoTree)
      vertigoTree.Populate(this, treeCfg)
      this.trees.push(vertigoTree)
    }

    // Watch for size changes
    this.resizeObs = new ResizeObserver(() => {
      this.resizeCanvas()
      // Recalculate tree widths (no re-render needed)
      for (const tree of this.trees) {
        tree.updateWidth()
      }
      this.updateOverlay()
    })
    this.resizeObs.observe(this)

    // Trigger initial overlay update
    this.updateOverlay()
  }
}

// Parts are application-specific structural components

// Header displays the app title and logout action
class Header extends nerd.Component {
  static style = `
		nerd-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			background: #444;
			color: white;
			padding: 1rem;
			font-size: 1.2rem;
		}
	`

  static html = `
		<span>Nerd - Personal Software Agent Framework</span>
		<nerd-action class="logout">Logout</nerd-action>
	`

  // Header instance fields
  private logoutButton!: HTMLElement

  connectedCallback() {
    this.innerHTML = Header.html
    this.logoutButton = this.Query(".logout")!
    this.logoutButton.addEventListener("click", () => this.logout())
  }

  // logout clears the HttpOnly cookie on the server and updates UI to show auth screen
  private async logout() {
    try {
      await nerd.AskAuth(imsg.Logout, {})
      gui.SwitchToAuth()
    } catch (err) {
      console.error("Logout failed:", err)
    }
  }
}

class Footer extends nerd.Component {
  static style = `
		nerd-footer {
			display: flex;
			align-items: center;
			background: #444;
			height: ${FOOTER_H}px;
		}

		nerd-footer .status {
			display: flex;
			align-items: center;
			padding: ${BOARDER}px;
			opacity: 0.5;
		}

		nerd-footer .icon {
			width: ${STATUS_S}px;
			height: ${STATUS_S}px;
			background: hsl(var(--base-hue), 90%, 35%);
		}

		nerd-footer .message {
			height: ${STATUS_S}px;
			display: flex;
			align-items: center;
			padding: 0 6px;
			background: hsl(var(--base-hue), 20%, 75%);
			color: hsl(var(--base-hue), 60%, 20%);
			font-size: 14px;
		}
	`

  static html = `
		<div class="status">
			<div class="icon"></div>
			<div class="message"></div>
		</div>
	`

  connectedCallback() {
    this.innerHTML = Footer.html
    nerd.Ctx.status = this.Query(".status")!
    nerd.Ctx.statusMessage = this.Query(".message")!
  }
}

// Auth provides login and registration forms with toggle between modes
// Automatically logs in user after successful registration
class Auth extends nerd.Component {
  static style = `
		nerd-auth {
			display: flex;
			justify-content: center;
			align-items: center;
			width: 100vw;
			height: 100vh;
		}

		nerd-auth .auth-box {
			width: 20em;
			padding: 1.5em;
			border: 1px solid #ddd;
			border-radius: 0.5em;
			background: #fff;
		}

		nerd-auth form {
			display: flex;
			flex-direction: column;
			gap: 0.666em;
		}

		nerd-auth .error {
			margin-top: 1em;
		}
	`

  static html = `
		<div class="auth-box">
			<form class="login">
				<h2>Login</h2>
				<input type="text" name="username" placeholder="Username" required />
				<input type="password" name="password" placeholder="Password" required />
				<button type="submit">Login</button>
				<nerd-action class="toggle">Need an account? Register</nerd-action>
			</form>
			<form class="register hidden">
				<h2>Create Account</h2>
				<input type="text" name="username" placeholder="Username" required />
				<input type="password" name="password" placeholder="Password" required />
				<button type="submit">Register</button>
				<nerd-action class="toggle">Have an account? Login</nerd-action>
			</form>
			<div class="error"></div>
		</div>
	`

  // Auth instance fields
  private regmode = false
  private login!: HTMLFormElement
  private register!: HTMLFormElement
  private error!: HTMLDivElement
  private loginToggle!: HTMLElement
  private registerToggle!: HTMLElement

  connectedCallback() {
    this.innerHTML = Auth.html
    this.login = this.Query(".login")! as HTMLFormElement
    this.register = this.Query(".register")! as HTMLFormElement
    this.error = this.Query(".error")! as HTMLDivElement
    this.loginToggle = this.login.querySelector(".toggle")! as HTMLElement
    this.registerToggle = this.register.querySelector(".toggle")! as HTMLElement

    // Event listeners
    this.login.addEventListener("submit", (e) => this.handleSubmit(e, false))
    this.register.addEventListener("submit", (e) => this.handleSubmit(e, true))
    this.loginToggle.addEventListener("click", () => this.toggleMode())
    this.registerToggle.addEventListener("click", () => this.toggleMode())
  }

  // toggleMode switches between login and registration forms
  private toggleMode() {
    this.regmode = !this.regmode
    this.login.classList.toggle("hidden")
    this.register.classList.toggle("hidden")
  }

  // handleSubmit sends credentials to server and updates app state on success
  private async handleSubmit(e: Event, regmode: boolean) {
    e.preventDefault()

    const formData = new FormData(e.target as HTMLFormElement)
    const imt = regmode ? imsg.CreateChild : imsg.AuthenticateUser
    const pl = Object.fromEntries(formData)

    try {
      const a = await nerd.AskAuth(imt, pl)
      nerd.Ctx.userID = a.id
      nerd.Ctx.admin = a.admin
      gui.SwitchToWorkbench()
    } catch (err) {
      this.showError(
        err instanceof Error ? err.message : "Network error. Please try again.",
      )
    }
  }

  private showError(error: string) {
    this.error.textContent = error
  }

  // Cleanup clears all form fields and errors
  Cleanup() {
    // Reset both forms
    this.login.reset()
    this.register.reset()

    // Clear error message
    this.error.textContent = ""

    // Reset to login mode if in register mode
    if (this.regmode) {
      this.toggleMode()
    }
  }
}

// Register all components - must happen before HTML parsing completes
// Creates global style tags and defines custom elements
Board.register("nerd-board")
Header.register("nerd-header")
Footer.register("nerd-footer")
Workbench.register("nerd-workbench")
Auth.register("nerd-auth")
GUI.register("nerd-gui")
