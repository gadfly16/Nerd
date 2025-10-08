var L=/^\s+|\s+$|(?<=\>)\s+(?=\<)/gm;function l(r){let e=document.createElement("template");return e.innerHTML=r.replace(L,""),e.content.firstElementChild}var o=class extends HTMLElement{static style="";static register(e){let t=document.createElement("style");t.textContent=this.style,document.head.appendChild(t),customElements.define(e,this)}},a;function v(r){a=r}async function T(r,e,t={}){let n=await fetch("/api",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:r,targetId:e,payload:t})});if(!n.ok)throw n.status===401&&a.SwitchToAuth(),new Error(await n.text()||"Request failed");return await n.json()}async function c(r,e){let t=await fetch("/auth",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:r,payload:e})});if(!t.ok)throw new Error(await t.text()||"Request failed");return await t.json()}var u=class extends o{static style=`
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
	`};u.register("nerd-action");var m=class r{id;name;parent;children;element;constructor(e,t,n=null){this.id=e,this.name=t,this.parent=n,this.children=[],this.element=null}addChild(e,t){let n=new r(e,t,this);return this.children.push(n),n}render(e,t){if(this.element||(this.element=l(`<div class="nerd-entity">${this.name}</div>`)),e.appendChild(this.element),!t.stopList.has(this.id)){let n=l('<div class="nerd-children"></div>');this.element.appendChild(n);for(let s of this.children)s.render(n,t)}}},p=class{stopList;constructor(){this.stopList=new Map}},h=class{root;config;constructor(e){this.root=e,this.config=new p}render(e){this.root.render(e,this.config)}},d=class{trees;constructor(){this.trees=[]}addTree(e){this.trees.push(e)}},g=class r extends o{static style=`
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
	`;connectedCallback(){this.innerHTML=r.html,this.querySelector(".logout").addEventListener("click",()=>this.logout())}async logout(){try{await c(6,{}),a.SwitchToAuth()}catch(e){console.error("Logout failed:",e)}}},f=class r extends o{static style=`
		nerd-footer {
			display: block;
			background: #2c3e50;
			color: white;
			padding: 1rem;
			text-align: center;
		}
	`;static html=`
		Footer
	`;connectedCallback(){this.innerHTML=r.html}},b=class r extends o{static style=`
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
	`;boards=[];leftContainer;rightContainer;connectedCallback(){this.innerHTML=r.html,this.leftContainer=this.querySelector(".board.left"),this.rightContainer=this.querySelector(".board.right"),this.boards=[new d,new d]}renderBoards(){this.leftContainer.innerHTML="",this.rightContainer.innerHTML="";for(let e of this.boards[0].trees)e.render(this.leftContainer);for(let e of this.boards[1].trees)e.render(this.rightContainer)}},w=class r extends o{static style=`
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
	`;regmode=!1;login=void 0;register=void 0;error=void 0;connectedCallback(){this.innerHTML=r.html,this.login=this.querySelector(".login"),this.register=this.querySelector(".register"),this.error=this.querySelector(".error"),this.attachEventListeners()}attachEventListeners(){this.login.addEventListener("submit",e=>this.handleSubmit(e,!1)),this.register.addEventListener("submit",e=>this.handleSubmit(e,!0)),this.login.querySelector(".toggle").addEventListener("click",()=>this.toggleMode()),this.register.querySelector(".toggle").addEventListener("click",()=>this.toggleMode())}toggleMode(){this.regmode=!this.regmode,this.login.classList.toggle("hidden"),this.register.classList.toggle("hidden")}async handleSubmit(e,t){e.preventDefault();let n=new FormData(e.target),s=Object.fromEntries(n);try{let i=await c(t?5:4,s);a.SwitchToWorkbench(i.userid)}catch(i){this.showError(i instanceof Error?i.message:"Network error. Please try again.")}}showError(e){this.error.textContent=e}},y=class r extends o{static style=`
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
	`;userId=0;admin=!1;auth=document.createElement("nerd-auth");nodes=new Map;rootNode=null;connectedCallback(){this.userId=parseInt(this.getAttribute("userid"),10),this.admin=this.getAttribute("admin")==="true",v(this),this.innerHTML=r.html,this.updateAuthState()}SwitchToAuth(){this.userId=0,this.nodes.clear(),this.rootNode=null;let e=this.querySelector("nerd-workbench");if(e){let t=e;t.boards=[new d,new d],t.classList.add("hidden")}this.appendChild(this.auth)}SwitchToWorkbench(e){this.userId=e;let t=this.querySelector("nerd-workbench");t&&t.classList.remove("hidden"),this.auth.remove(),this.initWorkbench()}updateAuthState(){this.userId===0?this.SwitchToAuth():this.SwitchToWorkbench(this.userId)}async initWorkbench(){try{let e=await this.getTree();console.log("TreeEntry received:",e),this.buildNodeTree(e),this.setupDefaultView()}catch(e){console.error("Failed to initialize workbench:",e)}}async getTree(){let e=this.admin?1:this.userId;return await T(0,e)}buildNodeTree(e,t=null){let n=new m(e.nodeId,e.name,t);if(this.nodes.set(n.id,n),t===null?this.rootNode=n:t.children.push(n),e.children)for(let s of e.children)this.buildNodeTree(s,n);return n}setupDefaultView(){if(!this.rootNode)return;let e=this.querySelector("nerd-workbench");if(!e)return;let t=this.admin?this.rootNode:this.nodes.get(this.userId);if(!t)return;let n=new h(t);for(let i of t.children)n.config.stopList.set(i.id,i);e.boards[0].addTree(n);let s=new h(t);for(let i of t.children)s.config.stopList.set(i.id,i);e.boards[1].addTree(s),e.renderBoards()}};g.register("nerd-header"),f.register("nerd-footer"),b.register("nerd-workbench"),w.register("nerd-auth"),y.register("nerd-gui");
//# sourceMappingURL=gui.js.map
