import { HttpMsgType } from "../httpmsg"

export class NerdAuth extends HTMLElement {
  private mode: "login" | "register" = "login"

  connectedCallback() {
    this.render()
    this.attachEventListeners()
  }

  private render() {
    const isLogin = this.mode === "login"
    this.innerHTML = `
			<style>
				.nerd-auth { padding: 1rem; }
				.nerd-auth h2 { margin: 0 0 1rem 0; }
				.nerd-auth__form { display: flex; flex-direction: column; gap: 0.5rem; }
				.nerd-auth__toggle { margin-top: 1rem; }
				.nerd-auth__error { color: red; margin-top: 0.5rem; }
			</style>
			<div class="nerd-auth">
				<h2>${isLogin ? "Login" : "Create Account"}</h2>
				<form class="nerd-auth__form">
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
						autocomplete="${isLogin ? "current-password" : "new-password"}"
					/>
					<button type="submit">${isLogin ? "Login" : "Register"}</button>
				</form>
				<button class="nerd-auth__toggle">
					${isLogin ? "Need an account? Register" : "Have an account? Login"}
				</button>
				<div class="nerd-auth__error"></div>
			</div>
		`
  }

  private attachEventListeners() {
    const form = this.querySelector(".nerd-auth__form") as HTMLFormElement
    const toggleBtn = this.querySelector(
      ".nerd-auth__toggle",
    ) as HTMLButtonElement

    form.addEventListener("submit", (e) => this.handleSubmit(e))
    toggleBtn.addEventListener("click", () => this.toggleMode())
  }

  private toggleMode() {
    this.mode = this.mode === "login" ? "register" : "login"
    this.render()
    this.attachEventListeners()
  }

  private async handleSubmit(e: Event) {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const formData = new FormData(form)
    const username = formData.get("username") as string
    const password = formData.get("password") as string

    const msgType =
      this.mode === "login"
        ? HttpMsgType.HttpAuthenticateUser
        : HttpMsgType.HttpCreateUser

    try {
      const response = await fetch("/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: msgType,
          payload: { username, password },
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        this.showError(errorText || "Authentication failed")
        return
      }

      // Success - JWT cookie is set, reload to update userid
      window.location.reload()
    } catch (err) {
      this.showError("Network error. Please try again.")
    }
  }

  private showError(message: string) {
    const errorEl = this.querySelector(".nerd-auth__error") as HTMLElement
    if (!errorEl) return
    errorEl.textContent = message
  }
}

customElements.define("nerd-auth", NerdAuth)
