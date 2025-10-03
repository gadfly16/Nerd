import { imsg } from "../imsg"
import { system } from "../system"

export class NerdAuth extends HTMLElement {
  private register = false
  private authHeader = undefined as unknown as HTMLHeadingElement
  private submitButton = undefined as unknown as HTMLButtonElement
  private toggleButton = undefined as unknown as HTMLButtonElement
  private errorDiv = undefined as unknown as HTMLDivElement
  private form = undefined as unknown as HTMLFormElement

  connectedCallback() {
    this.innerHTML = `
			<style>
				.nerd-auth { padding: 1rem; }
				.nerd-auth .auth-header { margin: 0 0 1rem 0; }
				.nerd-auth .auth-form { display: flex; flex-direction: column; gap: 0.5rem; }
				.nerd-auth .toggle { margin-top: 1rem; }
				.nerd-auth .error { color: red; margin-top: 0.5rem; }
			</style>
			<div class="nerd-auth">
				<h2 class="auth-header"></h2>
				<form class="auth-form">
					<input
						type="text"
						name="username"
						placeholder="Username"
						required
						autocomplete="username"
					/>
					<input
						type="password"
						name="password"
						placeholder="Password"
						required
						autocomplete="current-password"
					/>
					<button type="submit">Login</button>
				</form>
				<button class="toggle"></button>
				<div class="error"></div>
			</div>
		`
    this.authHeader = this.querySelector(".auth-header")!
    this.submitButton = this.querySelector(".auth-form button")!
    this.toggleButton = this.querySelector(".toggle")!
    this.errorDiv = this.querySelector(".error")!
    this.form = this.querySelector(".auth-form")!

    this.updateMode()
    this.attachEventListeners()
  }

  private updateMode() {
    this.authHeader.textContent = this.register ? "Create Account" : "Login"
    this.submitButton.textContent = this.register ? "Register" : "Login"
    this.toggleButton.textContent = this.register
      ? "Have an account? Login"
      : "Need an account? Register"
  }

  private attachEventListeners() {
    this.form.addEventListener("submit", (e) => this.handleSubmit(e))
    this.toggleButton.addEventListener("click", () => this.toggleMode())
  }

  private toggleMode() {
    this.register = !this.register
    this.updateMode()
  }

  private async handleSubmit(e: Event) {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    const payload = Object.fromEntries(formData)

    try {
      const response = await fetch("/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: this.register ? imsg.CreateUser : imsg.AuthenticateUser,
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
