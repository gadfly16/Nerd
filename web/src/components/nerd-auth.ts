import { imsg, ask } from "../imsg"
import { system } from "../system"

export class NerdAuth extends HTMLElement {
  private regmode = false
  private login = undefined as unknown as HTMLFormElement
  private register = undefined as unknown as HTMLFormElement
  private error = undefined as unknown as HTMLDivElement

  connectedCallback() {
    this.innerHTML = `
			<style>
				nerd-auth {
					display: flex;
					justify-content: center;
					align-items: center;
					width: 100vw;
					height: 100vh;
				}

				nerd-auth .auth-box {
					width: 20rem;
					padding: 2rem;
					border: 1px solid #ddd;
					border-radius: 0.5rem;
					background: white;
				}

				nerd-auth h2 {
					margin: 0 0 1rem 0;
				}

				nerd-auth form {
					display: flex;
					flex-direction: column;
					gap: 0.5rem;
				}

				nerd-auth .toggle {
					margin-top: 1rem;
				}

				nerd-auth .error {
					color: red;
					margin-top: 0.5rem;
				}

				.hidden {
					display: none;
				}
			</style>
			<div class="auth-box">
				<form class="login">
					<h2>Login</h2>
					<input type="text" name="username" placeholder="Username" required />
					<input type="password" name="password" placeholder="Password" required />
					<button type="submit">Login</button>
					<button type="button" class="toggle">Need an account? Register</button>
				</form>
				<form class="register hidden">
					<h2>Create Account</h2>
					<input type="text" name="username" placeholder="Username" required />
					<input type="password" name="password" placeholder="Password" required />
					<button type="submit">Register</button>
					<button type="button" class="toggle">Have an account? Login</button>
				</form>
				<div class="error"></div>
			</div>
		`
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

customElements.define("nerd-auth", NerdAuth)
