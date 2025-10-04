async function h(t,e){let n=await fetch("/auth",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:t,payload:e})});if(!n.ok)throw new Error(await n.text()||"Request failed");return await n.json()}var r={gui:void 0};var E=`
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
`,s=class extends HTMLElement{},m=document.createElement("style");m.textContent=E;document.head.appendChild(m);customElements.define("nerd-action",s);var x=`
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

`,v=`
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
`,a=class extends HTMLElement{regmode=!1;login=void 0;register=void 0;error=void 0;connectedCallback(){this.innerHTML=v,this.login=this.querySelector(".login"),this.register=this.querySelector(".register"),this.error=this.querySelector(".error"),this.attachEventListeners()}attachEventListeners(){this.login.addEventListener("submit",e=>this.handleSubmit(e,!1)),this.register.addEventListener("submit",e=>this.handleSubmit(e,!0)),this.login.querySelector(".toggle").addEventListener("click",()=>this.toggleMode()),this.register.querySelector(".toggle").addEventListener("click",()=>this.toggleMode())}toggleMode(){this.regmode=!this.regmode,this.login.classList.toggle("hidden"),this.register.classList.toggle("hidden")}async handleSubmit(e,n){e.preventDefault();let b=new FormData(e.target),w=Object.fromEntries(b);try{let o=await h(n?5:4,w);r.gui.userId=o.userid,r.gui.updateAuthState()}catch(o){this.showError(o instanceof Error?o.message:"Network error. Please try again.")}}showError(e){this.error.textContent=e}},u=document.createElement("style");u.textContent=x;document.head.appendChild(u);customElements.define("nerd-auth",a);var k=`
	nerd-header {
		display: block;
		background: #2c3e50;
		color: white;
		padding: 1rem;
		font-size: 1.2rem;
		font-weight: bold;
	}
`,L=`
	Nerd - Personal Software Agent Framework
`,d=class extends HTMLElement{connectedCallback(){this.innerHTML=L}},p=document.createElement("style");p.textContent=k;document.head.appendChild(p);customElements.define("nerd-header",d);var C=`
	nerd-footer {
		display: block;
		background: #2c3e50;
		color: white;
		padding: 1rem;
		text-align: center;
	}
`,M=`
	Footer
`,i=class extends HTMLElement{connectedCallback(){this.innerHTML=M}},g=document.createElement("style");g.textContent=C;document.head.appendChild(g);customElements.define("nerd-footer",i);var T=`
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
`,S=`
	<nerd-header></nerd-header>
	<div class="board left"></div>
	<div class="board right"></div>
	<nerd-footer></nerd-footer>
`,l=class extends HTMLElement{connectedCallback(){this.innerHTML=S}},f=document.createElement("style");f.textContent=T;document.head.appendChild(f);customElements.define("nerd-workbench",l);var H=`
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
`,q=`
	<nerd-workbench></nerd-workbench>
`,c=class extends HTMLElement{userId=0;auth=document.createElement("nerd-auth");connectedCallback(){this.userId=parseInt(this.getAttribute("userid"),10),r.gui=this,this.innerHTML=q,this.updateAuthState()}updateAuthState(){let e=this.querySelector("nerd-workbench");this.userId===0?(e.classList.add("hidden"),this.appendChild(this.auth)):(e.classList.remove("hidden"),this.auth.remove())}},y=document.createElement("style");y.textContent=H;document.head.appendChild(y);customElements.define("nerd-gui",c);
//# sourceMappingURL=main.js.map
