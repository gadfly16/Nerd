async function l(t,e){let r=await fetch("/auth",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:t,payload:e})});if(!r.ok)throw new Error(await r.text()||"Request failed");return await r.json()}var n={gui:void 0};var s=class extends HTMLElement{regmode=!1;login=void 0;register=void 0;error=void 0;connectedCallback(){this.innerHTML=`
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
		`,this.login=this.querySelector(".login"),this.register=this.querySelector(".register"),this.error=this.querySelector(".error"),this.attachEventListeners()}attachEventListeners(){this.login.addEventListener("submit",e=>this.handleSubmit(e,!1)),this.register.addEventListener("submit",e=>this.handleSubmit(e,!0)),this.login.querySelector(".toggle").addEventListener("click",()=>this.toggleMode()),this.register.querySelector(".toggle").addEventListener("click",()=>this.toggleMode())}toggleMode(){this.regmode=!this.regmode,this.login.classList.toggle("hidden"),this.register.classList.toggle("hidden")}async handleSubmit(e,r){e.preventDefault();let h=new FormData(e.target),u=Object.fromEntries(h);try{let i=await l(r?5:4,u);n.gui.userId=i.userid,n.gui.updateAuthState()}catch(i){this.showError(i instanceof Error?i.message:"Network error. Please try again.")}}showError(e){this.error.textContent=e}};customElements.define("nerd-auth",s);var o=class extends HTMLElement{connectedCallback(){this.render()}render(){this.innerHTML=`
			<style>
				nerd-header {
					display: block;
					background: #2c3e50;
					color: white;
					padding: 1rem;
					font-size: 1.2rem;
					font-weight: bold;
				}
			</style>

			Nerd - Personal Software Agent
		`}};customElements.define("nerd-header",o);var a=class extends HTMLElement{connectedCallback(){this.render()}render(){this.innerHTML=`
      <style>
        nerd-workbench {
          display: flex;
          flex-direction: column;
          width: 100%;
          height: 100%;
        }

        nerd-workbench .board {
          flex: 1;
          border: 1px solid #ddd;
        }
      </style>

      <nerd-header></nerd-header>
      <div class="board left"></div>
      <div class="board right"></div>
    `}};customElements.define("nerd-workbench",a);var d=class extends HTMLElement{userId=0;auth=document.createElement("nerd-auth");connectedCallback(){this.userId=parseInt(this.getAttribute("userid"),10),n.gui=this,this.render(),this.updateAuthState()}render(){this.innerHTML=`
			<style>
				@font-face {
					font-family: 'Inter';
					src: url('/fonts/InterVariable.woff2');
					font-weight: 100 900;
					font-display: block;
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
			</style>

			<nerd-workbench></nerd-workbench>
		`}updateAuthState(){let e=this.querySelector("nerd-workbench");this.userId===0?(e.classList.add("hidden"),this.appendChild(this.auth)):(e.classList.remove("hidden"),this.auth.remove())}};customElements.define("nerd-gui",d);
//# sourceMappingURL=gui.js.map
