// Nerd GUI - Personal Software Agent Graphical User Interface

import { imsg } from "./imsg.js"
import { $ } from "./util.js"
import * as nerd from "./nerd.js"
import * as config from "./config.js"
import * as vertigo from "./vertigo.js"

// Side effect imports to trigger component registration
import "./widgets.js"
import "./vertigo.js"

// Global GUI singleton - set during GUI.connectedCallback()
let gui: GUI

// Board is a structural component that contains multiple ListTree elements
class Board extends nerd.Component {
  static style = `
		nerd-board {
			display: block;
			background: #555;
			color: #ccc;
			overflow: auto;
			padding-right: 6px;
		}
	`

  config!: config.Board

  // Render displays all Vertigo trees for this board
  Render(cfg: config.Board) {
    this.config = cfg
    this.innerHTML = ""

    for (const treeCfg of cfg.trees) {
      const treeRoot = gui.nodes.get(treeCfg.rootId)!
      const vertigoTree = nerd.Create("vertigo-tree") as vertigo.Tree
      vertigoTree.Render(treeCfg, treeRoot, gui.displayRoot!)
      this.appendChild(vertigoTree)
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
			background: #222;
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
			display: block;
			background: #222;
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
				"board_0 board_1"
				"footer footer";
			width: 100%;
			height: 100%;
		}

		nerd-workbench nerd-header {
			grid-area: header;
		}

		nerd-workbench nerd-board.board_0 {
			grid-area: board_0;
			border: 0.5em solid #333;
			border-width: 0.5em 0.29em 0.5em 0.5em;
		}

		nerd-workbench nerd-board.board_1 {
			grid-area: board_1;
			border: 0.5em solid #333;
			border-width: 0.5em 0.5em 0.5em 0.29em;
		}

		nerd-workbench nerd-footer {
			grid-area: footer;
		}
	`

  static html = `
		<nerd-header></nerd-header>
		<nerd-board class="board_0"></nerd-board>
		<nerd-board class="board_1"></nerd-board>
		<nerd-footer></nerd-footer>
	`

  // Workbench instance fields
  config!: config.Workbench
  private boardElements: Board[] = []

  connectedCallback() {
    this.innerHTML = Workbench.html
    this.boardElements = [
      this.Query<Board>("nerd-board.board_0")!,
      this.Query<Board>("nerd-board.board_1")!,
    ]
  }

  // Render displays all boards with their configs
  Render(cfg: config.Workbench) {
    this.config = cfg
    for (let i = 0; i < this.boardElements.length; i++) {
      this.boardElements[i].Render(cfg.boards[i])
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
			background: #fff;
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
  state: config.State = new config.State()
  nodes = new Map<number, nerd.Node>() // Fast lookup by ID
  displayRoot: nerd.Node | null = null
  private auth = nerd.Create("nerd-auth") as Auth
  private workbench!: Workbench

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
    this.workbench = this.Query("nerd-workbench")! as Workbench

    // Show auth or workbench based on initial userId
    if (this.userId === 0) {
      this.SwitchToAuth()
    } else {
      this.SwitchToWorkbench(this.userId)
    }
  }

  // SwitchToAuth clears all sensitive data and shows authentication UI
  // Called on logout, session expiry, or authentication failure
  SwitchToAuth() {
    // Clear all sensitive information
    this.userId = 0
    this.nodes.clear()
    this.displayRoot = null
    this.state = new config.State()

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

  // init loads the tree and initializes the board displays
  private async init() {
    try {
      await this.buildNodeTree()

      // TODO: Load saved state from localStorage
      // const savedState: config.State | null = null

      // Store config and render workbench (displayRoot macros expanded during render)
      this.state.workbench = config.defaultState.workbench
      this.workbench.Render(config.defaultState.workbench)

      // TODO: Save state to localStorage
    } catch (err) {
      console.error("Failed to initialize workbench:", err)
      // TODO: Show error to user
    }
  }

  // buildNodeTree fetches tree from server and builds Node tree structure
  private async buildNodeTree() {
    const targetId = this.admin ? 1 : this.userId
    const treeEntry = await nerd.AskGetTree(targetId)
    console.log("TreeEntry received:", treeEntry)
    this.buildNodes(treeEntry, null)
  }

  // buildNodes recursively builds Node tree from TreeEntry and populates nodes map
  private buildNodes(
    entry: nerd.TreeEntry,
    parent: nerd.Node | null,
  ): nerd.Node {
    const node = new nerd.Node(entry.nodeId, entry.name, parent)
    this.nodes.set(node.id, node)

    if (parent === null) {
      this.displayRoot = node
    } else {
      parent.children.push(node)
    }

    if (entry.children) {
      for (const childEntry of entry.children) {
        this.buildNodes(childEntry, node)
      }
    }

    return node
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
