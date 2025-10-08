// Nerd GUI - Personal Software Agent Graphical User Interface

import { imsg } from "./imsg.js"
import { $ } from "./util.js"
import * as nerd from "./nerd.js"
import "./widgets.js" // Side effect: registers widget components

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
  root: Node
  stopList: Set<number> // Node IDs to stop rendering at

  constructor(root: Node) {
    this.root = root
    this.stopList = new Set()
  }
}

// BoardConfig holds configuration for all ListTrees on a board
class BoardConfig {
  listTrees: ListTreeConfig[]

  constructor() {
    this.listTrees = []
  }
}

// WorkbenchConfig holds configuration for all boards in the workbench
class WorkbenchConfig {
  boards: BoardConfig[]

  constructor() {
    this.boards = [new BoardConfig(), new BoardConfig()]
  }
}

// GUIState holds the complete state of the GUI display configuration
class GUIState {
  workbench: WorkbenchConfig

  constructor() {
    this.workbench = new WorkbenchConfig()
  }
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
      nerd.gui.SwitchToAuth()
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

		nerd-workbench .board.left {
			grid-area: left;
			border: 1px solid #ddd;
		}

		nerd-workbench .board.right {
			grid-area: right;
			border: 1px solid #ddd;
		}

		nerd-workbench nerd-footer {
			grid-area: footer;
		}
	`

  static html = `
		<nerd-header></nerd-header>
		<div class="board left"></div>
		<div class="board right"></div>
		<nerd-footer></nerd-footer>
	`

  // Workbench instance fields
  private boardElements: HTMLElement[] = []

  connectedCallback() {
    this.innerHTML = Workbench.html
    // Cache all board elements in order
    this.boardElements = [
      this.querySelector(".board.left")!,
      this.querySelector(".board.right")!,
    ]
  }

  // renderBoards renders all trees on all boards using ListTree elements
  // Uses GUI state to determine what to render
  renderBoards() {
    const workbenchConfig = nerd.gui.state.workbench

    // Render each board
    for (let i = 0; i < this.boardElements.length; i++) {
      const board = this.boardElements[i]
      const boardConfig = workbenchConfig.boards[i]

      // Clear container
      board.innerHTML = ""

      // Render all ListTrees for this board
      for (const config of boardConfig.listTrees) {
        const listTree = document.createElement("nerd-list-tree") as ListTree
        listTree.SetConfig(config)
        board.appendChild(listTree)
      }
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
      nerd.gui.SwitchToWorkbench(a.userid)
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
  private auth = document.createElement("nerd-auth")
  private workbench = undefined as unknown as Workbench
  private nodes = new Map<number, Node>() // Fast lookup by ID
  private rootNode: Node | null = null

  connectedCallback() {
    this.userId = parseInt(this.getAttribute("userid")!, 10)
    this.admin = this.getAttribute("admin") === "true"
    nerd.SetGUI(this) // Register as singleton for global access
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
    this.rootNode = null
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
    this.initWorkbench()
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

  // initWorkbench loads the tree and initializes the board displays
  private async initWorkbench() {
    try {
      const treeEntry = await this.getTree()
      console.log("TreeEntry received:", treeEntry)
      this.buildNodeTree(treeEntry)
      this.setupDefaultView()
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
      this.rootNode = node
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
    if (!this.rootNode) return

    // Find root display node (for admins, use root; for users, use their node)
    const displayNode = this.admin ? this.rootNode : this.nodes.get(this.userId)
    if (!displayNode) return

    // Create ListTreeConfig for left board
    const leftConfig = new ListTreeConfig(displayNode)
    // Add immediate children to stop list (show 1 level depth)
    for (const child of displayNode.children) {
      leftConfig.stopList.add(child.id)
    }
    this.state.workbench.boards[0].listTrees.push(leftConfig)

    // Create ListTreeConfig for right board (empty stop list - shows full tree)
    const rightConfig = new ListTreeConfig(displayNode)
    // No children added to stop list - renders entire tree recursively
    this.state.workbench.boards[1].listTrees.push(rightConfig)

    // Render both boards
    this.workbench.renderBoards()
  }
}

// Register all components - must happen before HTML parsing completes
// Creates global style tags and defines custom elements
ListTree.register("nerd-list-tree")
Header.register("nerd-header")
Footer.register("nerd-footer")
Workbench.register("nerd-workbench")
Auth.register("nerd-auth")
GUI.register("nerd-gui")
