var i=class extends HTMLElement{static style="";static register(e){let n=document.createElement("style");n.textContent=this.style,document.head.appendChild(n),customElements.define(e,this)}},a=class extends i{static style=`
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
	`};a.register("nerd-action");var r={NerdComponent:i,NerdAction:a,gui:void 0};async function u(t,e){let n=await fetch("/auth",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:t,payload:e})});if(!n.ok)throw new Error(await n.text()||"Request failed");return await n.json()}var s=class t extends r.NerdComponent{static style=`
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
	`;static html=`
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
	`;regmode=!1;login=void 0;register=void 0;error=void 0;connectedCallback(){this.innerHTML=t.html,this.login=this.querySelector(".login"),this.register=this.querySelector(".register"),this.error=this.querySelector(".error"),this.attachEventListeners()}attachEventListeners(){this.login.addEventListener("submit",e=>this.handleSubmit(e,!1)),this.register.addEventListener("submit",e=>this.handleSubmit(e,!0)),this.login.querySelector(".toggle").addEventListener("click",()=>this.toggleMode()),this.register.querySelector(".toggle").addEventListener("click",()=>this.toggleMode())}toggleMode(){this.regmode=!this.regmode,this.login.classList.toggle("hidden"),this.register.classList.toggle("hidden")}async handleSubmit(e,n){e.preventDefault();let m=new FormData(e.target),p=Object.fromEntries(m);try{let o=await u(n?5:4,p);r.gui.userId=o.userid,r.gui.updateAuthState()}catch(o){this.showError(o instanceof Error?o.message:"Network error. Please try again.")}}showError(e){this.error.textContent=e}};s.register("nerd-auth");var d=class t extends r.NerdComponent{static style=`
		nerd-header {
			display: block;
			background: #2c3e50;
			color: white;
			padding: 1rem;
			font-size: 1.2rem;
			font-weight: bold;
		}
	`;static html=`
		Nerd - Personal Software Agent Framework
	`;connectedCallback(){this.innerHTML=t.html}};d.register("nerd-header");var l=class t extends r.NerdComponent{static style=`
		nerd-footer {
			display: block;
			background: #2c3e50;
			color: white;
			padding: 1rem;
			text-align: center;
		}
	`;static html=`
		Footer
	`;connectedCallback(){this.innerHTML=t.html}};l.register("nerd-footer");var c=class t extends r.NerdComponent{static style=`
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
	`;static html=`
		<nerd-header></nerd-header>
		<div class="board left"></div>
		<div class="board right"></div>
		<nerd-footer></nerd-footer>
	`;connectedCallback(){this.innerHTML=t.html}};c.register("nerd-workbench");var h=class t extends r.NerdComponent{static style=`
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
	`;static html=`
		<nerd-workbench></nerd-workbench>
	`;userId=0;auth=document.createElement("nerd-auth");connectedCallback(){this.userId=parseInt(this.getAttribute("userid"),10),r.gui=this,this.innerHTML=t.html,this.updateAuthState()}updateAuthState(){let e=this.querySelector("nerd-workbench");this.userId===0?(e.classList.add("hidden"),this.appendChild(this.auth)):(e.classList.remove("hidden"),this.auth.remove())}};h.register("nerd-gui");
//# sourceMappingURL=main.js.map
