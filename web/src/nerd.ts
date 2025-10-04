// Nerd - Personal Software Agent Framework

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

// Base Component class
class NerdComponent extends HTMLElement {
  static style = ""

  static register(name: string) {
    const styleElement = document.createElement("style")
    styleElement.textContent = this.style
    document.head.appendChild(styleElement)
    customElements.define(name, this)
  }
}

// Widgets
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

// Parts
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

  connectedCallback() {
    this.innerHTML = Workbench.html
  }
}

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

  private toggleMode() {
    this.regmode = !this.regmode
    this.login.classList.toggle("hidden")
    this.register.classList.toggle("hidden")
  }

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

  userId: number = 0
  private auth = document.createElement("nerd-auth")

  connectedCallback() {
    this.userId = parseInt(this.getAttribute("userid")!, 10)
    nerd.gui = this
    this.innerHTML = GUI.html
    this.updateAuthState()
  }

  updateAuthState() {
    const workbench = this.querySelector("nerd-workbench")!

    if (this.userId === 0) {
      workbench.classList.add("hidden")
      this.appendChild(this.auth)
    } else {
      workbench.classList.remove("hidden")
      this.auth.remove()
    }
  }
}

// Export namespace
const nerd = {
  NerdComponent,
  Action,
  Header,
  Footer,
  Workbench,
  Auth,
  GUI,
  gui: undefined as unknown as GUI,
  ask,
  imsg,
}

export default nerd

// Register all components
Action.register("nerd-action")
Header.register("nerd-header")
Footer.register("nerd-footer")
Workbench.register("nerd-workbench")
Auth.register("nerd-auth")
GUI.register("nerd-gui")
