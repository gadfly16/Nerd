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
  element: HTMLElement | null // Cached DOM element when rendered

  constructor(id: number, name: string, parent: Node | null = null) {
    this.id = id
    this.name = name
    this.parent = parent
    this.children = []
    this.element = null
  }

  // addChild creates child node and establishes bidirectional link
  addChild(id: number, name: string): Node {
    const child = new Node(id, name, this)
    this.children.push(child)
    return child
  }

  // render appends this node to container and recursively renders children
  // unless this node is in the display config's stop list
  render(container: HTMLElement, config: DisplayConfig) {
    if (!this.element) {
      this.element = $(`<div class="nerd-entity">${this.name}</div>`)
    }
    container.appendChild(this.element)

    if (!config.stopList.has(this.id)) {
      const childContainer = $(`<div class="nerd-children"></div>`)
      this.element.appendChild(childContainer)
      for (const child of this.children) {
        child.render(childContainer, config)
      }
    }
  }
}

// DisplayConfig controls how a tree is displayed
class DisplayConfig {
  stopList: Map<number, Node>

  constructor() {
    this.stopList = new Map()
  }
}

// Tree represents a subtree view with its display configuration
class Tree {
  root: Node
  config: DisplayConfig

  constructor(root: Node) {
    this.root = root
    this.config = new DisplayConfig()
  }

  // render renders the tree into a container using the display config
  render(container: HTMLElement) {
    this.root.render(container, this.config)
  }
}

// Board contains multiple tree views
class Board {
  trees: Tree[]

  constructor() {
    this.trees = []
  }

  addTree(tree: Tree) {
    this.trees.push(tree)
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

  connectedCallback() {
    this.innerHTML = Header.html
    this.querySelector(".logout")!.addEventListener("click", () =>
      this.logout(),
    )
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
  boards: Board[] = []
  private leftContainer!: HTMLElement
  private rightContainer!: HTMLElement

  connectedCallback() {
    this.innerHTML = Workbench.html
    this.leftContainer = this.querySelector(".board.left")!
    this.rightContainer = this.querySelector(".board.right")!

    // Initialize two boards
    this.boards = [new Board(), new Board()]
  }

  // renderBoards renders all trees on both boards
  renderBoards() {
    // Clear containers
    this.leftContainer.innerHTML = ""
    this.rightContainer.innerHTML = ""

    // Render left board (index 0)
    for (const tree of this.boards[0].trees) {
      tree.render(this.leftContainer)
    }

    // Render right board (index 1)
    for (const tree of this.boards[1].trees) {
      tree.render(this.rightContainer)
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

  connectedCallback() {
    this.innerHTML = Auth.html
    this.login = this.querySelector(".login")!
    this.register = this.querySelector(".register")!
    this.error = this.querySelector(".error")!
    this.attachEventListeners()
  }

  private attachEventListeners() {
    this.login.addEventListener("submit", (e) => this.handleSubmit(e, false))
    this.register.addEventListener("submit", (e) => this.handleSubmit(e, true))
    this.login
      .querySelector(".toggle")!
      .addEventListener("click", () => this.toggleMode())
    this.register
      .querySelector(".toggle")!
      .addEventListener("click", () => this.toggleMode())
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
  private auth = document.createElement("nerd-auth")
  private nodes = new Map<number, Node>() // Fast lookup by ID
  private rootNode: Node | null = null

  connectedCallback() {
    this.userId = parseInt(this.getAttribute("userid")!, 10)
    this.admin = this.getAttribute("admin") === "true"
    nerd.SetGUI(this) // Register as singleton for global access
    this.innerHTML = GUI.html
    this.updateAuthState()
  }

  // SwitchToAuth clears all sensitive data and shows authentication UI
  // Called on logout, session expiry, or authentication failure
  SwitchToAuth() {
    // Clear all sensitive information
    this.userId = 0
    this.nodes.clear()
    this.rootNode = null

    const workbench = this.querySelector("nerd-workbench")
    if (workbench) {
      const wb = workbench as Workbench
      wb.boards = [new Board(), new Board()]
      wb.classList.add("hidden")
    }

    this.appendChild(this.auth)
  }

  // SwitchToWorkbench sets user ID, hides auth, and loads workbench
  // Called after successful authentication
  SwitchToWorkbench(userId: number) {
    this.userId = userId

    const workbench = this.querySelector("nerd-workbench")
    if (workbench) {
      workbench.classList.remove("hidden")
    }

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

    const workbench = this.querySelector("nerd-workbench") as Workbench
    if (!workbench) return

    // Find user node (for admins, use root; for users, use their node)
    const displayNode = this.admin ? this.rootNode : this.nodes.get(this.userId)
    if (!displayNode) return

    // Create tree for left board
    const leftTree = new Tree(displayNode)
    // Add immediate children to stop list (show 1 level depth)
    for (const child of displayNode.children) {
      leftTree.config.stopList.set(child.id, child)
    }
    workbench.boards[0].addTree(leftTree)

    // Create tree for right board (same as left)
    const rightTree = new Tree(displayNode)
    for (const child of displayNode.children) {
      rightTree.config.stopList.set(child.id, child)
    }
    workbench.boards[1].addTree(rightTree)

    // Render both boards
    workbench.renderBoards()
  }
}

// Register all components - must happen before HTML parsing completes
// Creates global style tags and defines custom elements
Header.register("nerd-header")
Footer.register("nerd-footer")
Workbench.register("nerd-workbench")
Auth.register("nerd-auth")
GUI.register("nerd-gui")
