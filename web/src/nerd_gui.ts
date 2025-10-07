// Nerd GUI - Personal Software Agent Graphical User Interface

// Interface Message Types - Must match internal/imsg/imsg.go
enum imsg {
  GetTree = 0,
  CreateChild,
  RenameChild,
  Shutdown,
  AuthenticateUser,
  CreateUser,
  Logout,
}

// TreeEntry represents a node and its children - Must match api/msg/types.go
interface TreeEntry {
  nodeId: number
  name: string
  children: TreeEntry[]
}

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

// $() creates an HTMLElement from a template string
// Strips whitespace for cleaner template literals
const _dollarRegexp = /^\s+|\s+$|(?<=\>)\s+(?=\<)/gm
function $(html: string): HTMLElement {
  const template = document.createElement("template")
  template.innerHTML = html.replace(_dollarRegexp, "")
  const result = template.content.firstElementChild
  return result as HTMLElement
}

// ask sends a message to the server and returns the response payload
// Throws on HTTP errors or network failures
async function ask(type: imsg, pl: any): Promise<any> {
  const response = await fetch("/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, payload: pl }),
  })

  if (!response.ok) {
    throw new Error((await response.text()) || "Request failed")
  }

  return await response.json()
}

// NerdComponent provides base functionality for all custom elements
// Uses global style injection rather than shadow DOM for simplicity
class NerdComponent extends HTMLElement {
  static style = ""

  // register creates a global style tag and defines the custom element
  static register(name: string) {
    const styleElement = document.createElement("style")
    styleElement.textContent = this.style
    document.head.appendChild(styleElement)
    customElements.define(name, this)
  }
}

// Widgets are reusable UI primitives used across multiple components

// Action renders a clickable link-styled button
class Action extends NerdComponent {
  static style = `
		nerd-action {
			display: inline;
			background: none;
			border: none;
			color: #0066cc;
			text-decoration: underline;
			cursor: pointer;
			padding: 0;
			font: inherit;
		}

		nerd-action:hover {
			color: #0052a3;
		}
	`
}

// Parts are application-specific structural components

// Header displays the app title and logout action
class Header extends NerdComponent {
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
      await ask(imsg.Logout, {})
      nerd.gui.userId = 0
      nerd.gui.updateAuthState()
    } catch (err) {
      console.error("Logout failed:", err)
    }
  }
}

class Footer extends NerdComponent {
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
class Workbench extends NerdComponent {
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
class Auth extends NerdComponent {
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
      const a = await ask(regmode ? imsg.CreateUser : imsg.AuthenticateUser, pl)
      nerd.gui.userId = a.userid
      nerd.gui.updateAuthState()
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
class GUI extends NerdComponent {
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
    nerd.gui = this // Register as singleton for global access
    this.innerHTML = GUI.html
    this.updateAuthState()
  }

  // updateAuthState toggles between auth and workbench based on userId
  // Called after login/logout to update the UI
  updateAuthState() {
    const workbench = this.querySelector("nerd-workbench")!

    if (this.userId === 0) {
      workbench.classList.add("hidden")
      this.appendChild(this.auth)
    } else {
      workbench.classList.remove("hidden")
      this.auth.remove()
      this.initWorkbench()
    }
  }

  // initWorkbench loads the tree and initializes the board displays
  private async initWorkbench() {
    try {
      const treeEntry = await this.getTree()
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
  private async getTree(): Promise<TreeEntry> {
    const targetId = this.admin ? 1 : this.userId
    const tree = await ask(imsg.GetTree, { targetId })
    return tree as TreeEntry
  }

  // buildNodeTree recursively builds Node tree from TreeEntry and populates nodes map
  private buildNodeTree(entry: TreeEntry, parent: Node | null = null): Node {
    const node = new Node(entry.nodeId, entry.name, parent)
    this.nodes.set(node.id, node)

    if (parent === null) {
      this.rootNode = node
    } else {
      parent.children.push(node)
    }

    for (const childEntry of entry.children) {
      this.buildNodeTree(childEntry, node)
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

// Export namespace - provides unified access to components and API
// gui field is set during GUI.connectedCallback() for singleton access
const nerd = {
  NerdComponent,
  Action,
  Header,
  Footer,
  Workbench,
  Auth,
  GUI,
  gui: undefined as unknown as GUI, // Set at runtime by GUI component
  ask,
  imsg,
}

export default nerd

// Register all components - must happen before HTML parsing completes
// Creates global style tags and defines custom elements
Action.register("nerd-action")
Header.register("nerd-header")
Footer.register("nerd-footer")
Workbench.register("nerd-workbench")
Auth.register("nerd-auth")
GUI.register("nerd-gui")
