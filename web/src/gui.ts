// Nerd GUI - Personal Software Agent Graphical User Interface

import { imsg } from "./imsg.js"
import { $ } from "./util.js"
import * as nerd from "./nerd.js"
import "./widgets.js" // Side effect: registers widget components

// Global GUI singleton - set during GUI.connectedCallback()
let gui: GUI

// Node represents a node in the in-memory tree structure
// Forms a bidirectional tree with parent/children links
class Node {
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

  // render creates and appends a new DOM element to container
  // recursively renders children unless this node is in the config's stop list
  // returns the created element for potential future reference
  render(container: HTMLElement, config: ListTreeConfig): HTMLElement {
    const element = $(`<div class="nerd-entity">${this.name}</div>`)
    this.elements.push(element)
    container.appendChild(element)

    if (!config.stopList.has(this.id)) {
      const childContainer = $(`<div class="nerd-children"></div>`)
      element.appendChild(childContainer)
      for (const child of this.children) {
        child.render(childContainer, config)
      }
    }

    return element
  }
}

// ListTreeConfig configures a single ListTree instance
class ListTreeConfig {
  root!: Node
  stopList!: Set<number> // Node IDs to stop rendering at
}

// BoardConfig holds configuration for all ListTrees on a board
class BoardConfig {
  listTrees!: ListTreeConfig[]
}

// WorkbenchConfig holds configuration for all boards in the workbench
class WorkbenchConfig {
  boards!: BoardConfig[]
}

// GUIState holds the complete state of the GUI display configuration
class GUIState {
  workbench!: WorkbenchConfig
}

// ListTree renders a tree as a hierarchical list of block elements
// This is a dynamic/adaptive custom element
class ListTree extends nerd.Component {
  static style = `
		nerd-list-tree {
			display: block;
		}

		nerd-list-tree .nerd-entity {
			padding: 0.25em;
		}

		nerd-list-tree .nerd-children {
			padding-left: 1em;
		}
	`

  config: ListTreeConfig | null = null

  // Init configures the ListTree and returns validated/reconciled config
  // If config is null, creates default config based on GUI user/admin state
  Init(config: ListTreeConfig | null): ListTreeConfig {
    if (config) {
      // TODO: Validate config against actual tree
      this.config = config
    } else {
      // Create default config using the display root
      const listTreeConfig = new ListTreeConfig()
      listTreeConfig.root = gui.displayRoot!
      listTreeConfig.stopList = new Set()

      this.config = listTreeConfig
    }

    return this.config
  }

  // SetConfig configures which tree to display
  SetConfig(config: ListTreeConfig) {
    this.config = config
    this.render()
  }

  // render displays the tree using block layout
  private render() {
    if (!this.config) return

    this.innerHTML = ""
    this.config.root.render(this, this.config)
  }
}

// Board is a structural component that contains multiple ListTree elements
class Board extends nerd.Component {
  static style = `
		nerd-board {
			display: block;
			border: 1px solid #ddd;
		}
	`

  // Board instance fields
  config: BoardConfig = new BoardConfig()

  // Init configures the board and returns validated/reconciled config
  // Called after DOM construction to initialize with config
  // If config is null, creates one default ListTree and collects its config
  Init(config: BoardConfig | null): BoardConfig {
    if (config) {
      // Validate and use provided config
      // Create ListTree elements for each config
      const boardConfig = new BoardConfig()
      boardConfig.listTrees = []

      for (const listTreeConfig of config.listTrees) {
        const listTree = document.createElement("nerd-list-tree") as ListTree
        const validatedConfig = listTree.Init(listTreeConfig)
        boardConfig.listTrees.push(validatedConfig)
      }

      this.config = boardConfig
    } else {
      // Create default: one ListTree with its default config
      const boardConfig = new BoardConfig()
      boardConfig.listTrees = []

      const listTree = document.createElement("nerd-list-tree") as ListTree
      const listTreeConfig = listTree.Init(null)
      boardConfig.listTrees.push(listTreeConfig)

      this.config = boardConfig
    }

    return this.config
  }

  // Render displays all ListTrees for this board
  Render() {
    // Clear existing content
    this.innerHTML = ""

    // Render all ListTrees for this board
    for (const listTreeConfig of this.config.listTrees) {
      const listTree = document.createElement("nerd-list-tree") as ListTree
      listTree.SetConfig(listTreeConfig)
      this.appendChild(listTree)
    }
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
			background: #2c3e50;
			color: white;
			padding: 1rem;
			font-size: 1.2rem;
			font-weight: bold;
		}

		nerd-header nerd-action {
			color: white;
		}

		nerd-header nerd-action:hover {
			color: #ddd;
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
    this.logoutButton = this.querySelector(".logout")!
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
			display: block;
			background: #2c3e50;
			color: white;
			padding: 1rem;
			text-align: center;
		}
	`

  static html = `
		Footer
	`

  connectedCallback() {
    this.innerHTML = Footer.html
  }
}

// Workbench is the main authenticated UI with header, footer, and two board areas
// The board areas are placeholders for future agent interaction interfaces
class Workbench extends nerd.Component {
  static style = `
		nerd-workbench {
			display: grid;
			grid-template-columns: 1fr 1fr;
			grid-template-rows: auto 1fr auto;
			grid-template-areas:
				"header header"
				"left right"
				"footer footer";
			width: 100%;
			height: 100%;
		}

		nerd-workbench nerd-header {
			grid-area: header;
		}

		nerd-workbench nerd-board.left {
			grid-area: left;
		}

		nerd-workbench nerd-board.right {
			grid-area: right;
		}

		nerd-workbench nerd-footer {
			grid-area: footer;
		}
	`

  static html = `
		<nerd-header></nerd-header>
		<nerd-board class="left"></nerd-board>
		<nerd-board class="right"></nerd-board>
		<nerd-footer></nerd-footer>
	`

  // Workbench instance fields
  private boardElements: Board[] = []

  connectedCallback() {
    this.innerHTML = Workbench.html
    // Cache all board elements
    const leftBoard = this.querySelector("nerd-board.left")! as Board
    const rightBoard = this.querySelector("nerd-board.right")! as Board
    this.boardElements = [leftBoard, rightBoard]
  }

  // Init configures the workbench and returns validated/reconciled config
  // Called after DOM construction to initialize with config
  // If config is null, creates default config which bubbles up from boards
  Init(config: WorkbenchConfig | null): WorkbenchConfig {
    const workbenchConfig = new WorkbenchConfig()
    workbenchConfig.boards = []

    // Initialize all boards and collect their validated configs
    let i = 0
    for (const board of this.boardElements) {
      const boardConfig = board.Init(config?.boards[i] ?? null)
      workbenchConfig.boards.push(boardConfig)
      i++
    }

    return workbenchConfig
  }

  // RenderBoards renders all boards
  RenderBoards() {
    for (const board of this.boardElements) {
      board.Render()
    }
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
			background: white;
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
  private login = undefined as unknown as HTMLFormElement
  private register = undefined as unknown as HTMLFormElement
  private error = undefined as unknown as HTMLDivElement
  private loginToggle = undefined as unknown as HTMLElement
  private registerToggle = undefined as unknown as HTMLElement

  connectedCallback() {
    this.innerHTML = Auth.html
    this.login = this.querySelector(".login")!
    this.register = this.querySelector(".register")!
    this.error = this.querySelector(".error")!
    this.loginToggle = this.login.querySelector(".toggle")!
    this.registerToggle = this.register.querySelector(".toggle")!
    this.attachEventListeners()
  }

  private attachEventListeners() {
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
    const pl = Object.fromEntries(formData)

    try {
      const a = await nerd.AskAuth(
        regmode ? imsg.CreateUser : imsg.AuthenticateUser,
        pl,
      )
      gui.SwitchToWorkbench(a.userid)
    } catch (err) {
      this.showError(
        err instanceof Error ? err.message : "Network error. Please try again.",
      )
    }
  }

  private showError(error: string) {
    this.error.textContent = error
  }
}

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
			background: #fafafa;
		}

		.hidden {
			display: none;
		}
	`

  static html = `
		<nerd-workbench></nerd-workbench>
	`

  // GUI instance fields
  userId: number = 0
  admin: boolean = false
  state: GUIState = new GUIState()
  nodes = new Map<number, Node>() // Fast lookup by ID
  displayRoot: Node | null = null
  private auth = document.createElement("nerd-auth")
  private workbench = undefined as unknown as Workbench

  connectedCallback() {
    this.userId = parseInt(this.getAttribute("userid")!, 10)
    this.admin = this.getAttribute("admin") === "true"

    // Update global context
    nerd.GUIContext.userId = this.userId
    nerd.GUIContext.admin = this.admin

    // Set global gui reference
    gui = this

    // Listen for unauthorized events
    window.addEventListener("nerd:unauthorized", () => this.SwitchToAuth())

    this.innerHTML = GUI.html
    this.workbench = this.querySelector("nerd-workbench")!
    this.updateAuthState()
  }

  // SwitchToAuth clears all sensitive data and shows authentication UI
  // Called on logout, session expiry, or authentication failure
  SwitchToAuth() {
    // Clear all sensitive information
    this.userId = 0
    this.nodes.clear()
    this.displayRoot = null
    this.state = new GUIState()

    this.workbench.classList.add("hidden")
    this.appendChild(this.auth)
  }

  // SwitchToWorkbench sets user ID, hides auth, and loads workbench
  // Called after successful authentication
  SwitchToWorkbench(userId: number) {
    this.userId = userId

    this.workbench.classList.remove("hidden")
    this.auth.remove()
    this.init()
  }

  // updateAuthState toggles between auth and workbench based on userId
  // Called on initial page load
  updateAuthState() {
    if (this.userId === 0) {
      this.SwitchToAuth()
    } else {
      this.SwitchToWorkbench(this.userId)
    }
  }

  // init loads the tree and initializes the board displays
  private async init() {
    try {
      const treeEntry = await this.getTree()
      console.log("TreeEntry received:", treeEntry)
      this.buildNodeTree(treeEntry)

      // TODO: Load saved state from localStorage
      // const savedState: GUIState | null = null

      // Initialize workbench (creates defaults if savedState is null)
      // Validated config bubbles back up
      this.state.workbench = this.workbench.Init(null)

      // TODO: Save validated state to localStorage

      // Render boards
      this.workbench.RenderBoards()
    } catch (err) {
      console.error("Failed to initialize workbench:", err)
      // TODO: Show error to user
    }
  }

  // getTree fetches the tree structure from the server
  // For admins: returns entire tree from Root
  // For users: returns subtree rooted at user node
  private async getTree(): Promise<nerd.TreeEntry> {
    const targetId = this.admin ? 1 : this.userId
    const tree = await nerd.Ask(imsg.GetTree, targetId)
    return tree as nerd.TreeEntry
  }

  // buildNodeTree recursively builds Node tree from TreeEntry and populates nodes map
  private buildNodeTree(
    entry: nerd.TreeEntry,
    parent: Node | null = null,
  ): Node {
    const node = new Node(entry.nodeId, entry.name, parent)
    this.nodes.set(node.id, node)

    if (parent === null) {
      this.displayRoot = node
    } else {
      parent.children.push(node)
    }

    if (entry.children) {
      for (const childEntry of entry.children) {
        this.buildNodeTree(childEntry, node)
      }
    }

    return node
  }

  // setupDefaultView creates default board/tree configuration
  // Default: both boards show user node with 1 level depth (children in stop list)
  private setupDefaultView() {
    if (!this.displayRoot) return

    // displayRoot is already the correct node (set by getTree based on admin/userId)
    const displayNode = this.displayRoot

    // Create ListTreeConfig for left board
    const leftConfig = new ListTreeConfig()
    leftConfig.root = displayNode
    leftConfig.stopList = new Set()
    // Add immediate children to stop list (show 1 level depth)
    for (const child of displayNode.children) {
      leftConfig.stopList.add(child.id)
    }
    this.state.workbench.boards[0].listTrees.push(leftConfig)

    // Create ListTreeConfig for right board (empty stop list - shows full tree)
    const rightConfig = new ListTreeConfig()
    rightConfig.root = displayNode
    rightConfig.stopList = new Set()
    // No children added to stop list - renders entire tree recursively
    this.state.workbench.boards[1].listTrees.push(rightConfig)

    // Render both boards
    this.workbench.RenderBoards()
  }
}

// Register all components - must happen before HTML parsing completes
// Creates global style tags and defines custom elements
ListTree.register("nerd-list-tree")
Board.register("nerd-board")
Header.register("nerd-header")
Footer.register("nerd-footer")
Workbench.register("nerd-workbench")
Auth.register("nerd-auth")
GUI.register("nerd-gui")
