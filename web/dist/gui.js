var o=class extends HTMLElement{mode="login";connectedCallback(){this.render(),this.attachEventListeners()}render(){let e=this.mode==="login";this.innerHTML=`
			<style>
				.nerd-auth { padding: 1rem; }
				.nerd-auth h2 { margin: 0 0 1rem 0; }
				.nerd-auth__form { display: flex; flex-direction: column; gap: 0.5rem; }
				.nerd-auth__toggle { margin-top: 1rem; }
				.nerd-auth__error { color: red; margin-top: 0.5rem; }
			</style>
			<div class="nerd-auth">
				<h2>${e?"Login":"Create Account"}</h2>
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
						autocomplete="${e?"current-password":"new-password"}"
					/>
					<button type="submit">${e?"Login":"Register"}</button>
				</form>
				<button class="nerd-auth__toggle">
					${e?"Need an account? Register":"Have an account? Login"}
				</button>
				<div class="nerd-auth__error"></div>
			</div>
		`}attachEventListeners(){let e=this.querySelector(".nerd-auth__form"),t=this.querySelector(".nerd-auth__toggle");e.addEventListener("submit",r=>this.handleSubmit(r)),t.addEventListener("click",()=>this.toggleMode())}toggleMode(){this.mode=this.mode==="login"?"register":"login",this.render(),this.attachEventListeners()}async handleSubmit(e){e.preventDefault();let t=e.target,r=new FormData(t),i=r.get("username"),d=r.get("password"),l=this.mode==="login"?4:5;try{let n=await fetch("/auth",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:l,payload:{username:i,password:d}})});if(!n.ok){let c=await n.text();this.showError(c||"Authentication failed");return}window.location.reload()}catch{this.showError("Network error. Please try again.")}}showError(e){let t=this.querySelector(".nerd-auth__error");t&&(t.textContent=e)}};customElements.define("nerd-auth",o);var a=class extends HTMLElement{userId=0;connectedCallback(){let e=this.getAttribute("userid");this.userId=e?parseInt(e,10):0,this.render()}render(){let e=this.userId===0;this.innerHTML=`
            <style>
                :host {
                    display: block;
                    width: 100%;
                    height: 100vh;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    background: #fafafa;
                }

                .container {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                }

                .header {
                    background: #2c3e50;
                    color: white;
                    padding: 1rem;
                    font-size: 1.2rem;
                    font-weight: bold;
                }

                .content {
                    flex: 1;
                    padding: 1rem;
                    overflow: auto;
                }
            </style>

            <div class="container">
                <div class="header">
                    Nerd - Personal Software Agent
                </div>
                <div class="content">
                    ${e?"<nerd-auth></nerd-auth>":`<p>Welcome, User ${this.userId}!</p><p>Main UI coming soon...</p>`}
                </div>
            </div>
        `}};customElements.define("nerd-gui",a);
//# sourceMappingURL=gui.js.map
