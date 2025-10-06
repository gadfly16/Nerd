var m=(t=>(t[t.GetTree=0]="GetTree",t[t.CreateChild=1]="CreateChild",t[t.RenameChild=2]="RenameChild",t[t.Shutdown=3]="Shutdown",t[t.AuthenticateUser=4]="AuthenticateUser",t[t.CreateUser=5]="CreateUser",t[t.Logout=6]="Logout",t))(m||{});async function g(r,e){let a=await fetch("/auth",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:r,payload:e})});if(!a.ok)throw new Error(await a.text()||"Request failed");return await a.json()}var n=class extends HTMLElement{static style="";static register(e){let a=document.createElement("style");a.textContent=this.style,document.head.appendChild(a),customElements.define(e,this)}},s=class extends n{static style=`
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
	`},d=class r extends n{static style=`
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
	`;static html=`
		<span>Nerd - Personal Software Agent Framework</span>
		<nerd-action class="logout">Logout</nerd-action>
	`;connectedCallback(){this.innerHTML=r.html,this.querySelector(".logout").addEventListener("click",()=>this.logout())}async logout(){try{await g(6,{}),i.gui.userId=0,i.gui.updateAuthState()}catch(e){console.error("Logout failed:",e)}}},l=class r extends n{static style=`
		nerd-footer {
			display: block;
			background: #2c3e50;
			color: white;
			padding: 1rem;
			text-align: center;
		}
	`;static html=`
		Footer
	`;connectedCallback(){this.innerHTML=r.html}},c=class r extends n{static style=`
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
	`;connectedCallback(){this.innerHTML=r.html}},h=class r extends n{static style=`
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
	`;regmode=!1;login=void 0;register=void 0;error=void 0;connectedCallback(){this.innerHTML=r.html,this.login=this.querySelector(".login"),this.register=this.querySelector(".register"),this.error=this.querySelector(".error"),this.attachEventListeners()}attachEventListeners(){this.login.addEventListener("submit",e=>this.handleSubmit(e,!1)),this.register.addEventListener("submit",e=>this.handleSubmit(e,!0)),this.login.querySelector(".toggle").addEventListener("click",()=>this.toggleMode()),this.register.querySelector(".toggle").addEventListener("click",()=>this.toggleMode())}toggleMode(){this.regmode=!this.regmode,this.login.classList.toggle("hidden"),this.register.classList.toggle("hidden")}async handleSubmit(e,a){e.preventDefault();let p=new FormData(e.target),f=Object.fromEntries(p);try{let o=await g(a?5:4,f);i.gui.userId=o.userid,i.gui.updateAuthState()}catch(o){this.showError(o instanceof Error?o.message:"Network error. Please try again.")}}showError(e){this.error.textContent=e}},u=class r extends n{static style=`
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
	`;userId=0;auth=document.createElement("nerd-auth");connectedCallback(){this.userId=parseInt(this.getAttribute("userid"),10),i.gui=this,this.innerHTML=r.html,this.updateAuthState()}updateAuthState(){let e=this.querySelector("nerd-workbench");this.userId===0?(e.classList.add("hidden"),this.appendChild(this.auth)):(e.classList.remove("hidden"),this.auth.remove())}},i={NerdComponent:n,Action:s,Header:d,Footer:l,Workbench:c,Auth:h,GUI:u,gui:void 0,ask:g,imsg:m},b=i;s.register("nerd-action"),d.register("nerd-header"),l.register("nerd-footer"),c.register("nerd-workbench"),h.register("nerd-auth"),u.register("nerd-gui");export{b as default};
//# sourceMappingURL=nerd_gui.js.map
