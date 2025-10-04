import { imsg, ask } from "../imsg"
import { system } from "../system"
import "./nerd-action"

const style = `
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

`

const html = `
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

export class NerdAuth extends HTMLElement {
  private regmode = false
  private login = undefined as unknown as HTMLFormElement
  private register = undefined as unknown as HTMLFormElement
  private error = undefined as unknown as HTMLDivElement

  connectedCallback() {
    this.innerHTML = html
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
      system.gui.userId = a.userid
      system.gui.updateAuthState()
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

// Register component and append style
const styleElement = document.createElement("style")
styleElement.textContent = style
document.head.appendChild(styleElement)
customElements.define("nerd-auth", NerdAuth)
