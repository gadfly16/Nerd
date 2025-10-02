export class NerdAuth extends HTMLElement {
	private mode: 'login' | 'register' = 'login';

	connectedCallback() {
		this.render();
		this.attachEventListeners();
	}

	private render() {
		const isLogin = this.mode === 'login';
		this.innerHTML = `
			<div class="auth-container">
				<h2>${isLogin ? 'Login' : 'Create Account'}</h2>
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
						autocomplete="${isLogin ? 'current-password' : 'new-password'}"
					/>
					<button type="submit">${isLogin ? 'Login' : 'Register'}</button>
				</form>
				<button class="toggle-mode">
					${isLogin ? 'Need an account? Register' : 'Have an account? Login'}
				</button>
				<div class="error-message"></div>
			</div>
		`;
	}

	private attachEventListeners() {
		const form = this.querySelector('.auth-form') as HTMLFormElement;
		const toggleBtn = this.querySelector('.toggle-mode') as HTMLButtonElement;

		form.addEventListener('submit', (e) => this.handleSubmit(e));
		toggleBtn.addEventListener('click', () => this.toggleMode());
	}

	private toggleMode() {
		this.mode = this.mode === 'login' ? 'register' : 'login';
		this.render();
		this.attachEventListeners();
	}

	private async handleSubmit(e: Event) {
		e.preventDefault();
		const form = e.target as HTMLFormElement;
		const formData = new FormData(form);
		const username = formData.get('username') as string;
		const password = formData.get('password') as string;

		const msgType = this.mode === 'login' ? 'HttpAuthenticateUser' : 'HttpCreateUser';

		try {
			const response = await fetch('/auth', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					type: msgType,
					payload: { username, password }
				})
			});

			if (!response.ok) {
				const errorText = await response.text();
				this.showError(errorText || 'Authentication failed');
				return;
			}

			// Success - JWT cookie is set, reload to update userid
			window.location.reload();
		} catch (err) {
			this.showError('Network error. Please try again.');
		}
	}

	private showError(message: string) {
		const errorEl = this.querySelector('.error-message') as HTMLElement;
		errorEl.textContent = message;
		errorEl.style.color = 'red';
		errorEl.style.marginTop = '1rem';
	}
}

customElements.define('nerd-auth', NerdAuth);
