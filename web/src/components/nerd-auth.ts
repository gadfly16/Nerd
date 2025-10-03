import { imsg } from "../imsg"
import { system } from "../system"

export class NerdAuth extends HTMLElement {
  private register = false
  private loginForm = undefined as unknown as HTMLFormElement
  private registerForm = undefined as unknown as HTMLFormElement
  private errorDiv = undefined as unknown as HTMLDivElement

  connectedCallback() {
    this.innerHTML = `
			<style>
				.nerd-auth { padding: 1rem; }
				.nerd-auth h2 { margin: 0 0 1rem 0; }
				.nerd-auth .auth-form { display: flex; flex-direction: column; gap: 0.5rem; }
				.nerd-auth .toggle { margin-top: 1rem; }
				.nerd-auth .error { color: red; margin-top: 0.5rem; }
				.nerd-auth .hidden { display: none; }
			</style>
			<div class="nerd-auth">
				<form class="auth-form login-form">
					<h2>Login</h2>
					<input type="text" name="username" placeholder="Username" required />
					<input type="password" name="password" placeholder="Password" required />
					<button type="submit">Login</button>
					<button type="button" class="toggle">Need an account? Register</button>
				</form>
				<form class="auth-form register-form hidden">
					<h2>Create Account</h2>
					<input type="text" name="username" placeholder="Username" required />
					<input type="password" name="password" placeholder="Password" required />
					<button type="submit">Register</button>
					<button type="button" class="toggle">Have an account? Login</button>
				</form>
				<div class="error"></div>
			</div>
		`
    this.loginForm = this.querySelector(".login-form")!
    this.registerForm = this.querySelector(".register-form")!
    this.errorDiv = this.querySelector(".error")!

    this.attachEventListeners()
  }

  private attachEventListeners() {
    this.loginForm.addEventListener("submit", (e) =>
      this.handleSubmit(e, false),
    )
    this.registerForm.addEventListener("submit", (e) =>
      this.handleSubmit(e, true),
    )
    this.loginForm
      .querySelector(".toggle")!
      .addEventListener("click", () => this.toggleMode())
    this.registerForm
      .querySelector(".toggle")!
      .addEventListener("click", () => this.toggleMode())
  }

  private toggleMode() {
    this.register = !this.register
    this.loginForm.classList.toggle("hidden")
    this.registerForm.classList.toggle("hidden")
  }

  private async handleSubmit(e: Event, register: boolean) {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    const payload = Object.fromEntries(formData)

    try {
      const response = await fetch("/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: register ? imsg.CreateUser : imsg.AuthenticateUser,
          payload,
        }),
      })

      if (!response.ok) {
        this.showError((await response.text()) || "Authentication failed")
        return
      }

      const data = await response.json()
      system.gui.userId = data.userid
      system.gui.updateAuthState()
    } catch (err) {
      this.showError("Network error. Please try again.")
    }
  }

  private showError(message: string) {
    this.errorDiv.textContent = message
  }
}

customElements.define("nerd-auth", NerdAuth)
