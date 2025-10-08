var E=/^\s+|\s+$|(?<=\>)\s+(?=\<)/gm;function h(n){let e=document.createElement("template");return e.innerHTML=n.replace(E,""),e.content.firstElementChild}var i=class extends HTMLElement{static style="";static register(e){let t=document.createElement("style");t.textContent=this.style,document.head.appendChild(t),customElements.define(e,this)}},d;function v(n){d=n}async function C(n,e,t={}){let r=await fetch("/api",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:n,targetId:e,payload:t})});if(!r.ok)throw r.status===401&&d.SwitchToAuth(),new Error(await r.text()||"Request failed");return await r.json()}async function u(n,e){let t=await fetch("/auth",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:n,payload:e})});if(!t.ok)throw new Error(await t.text()||"Request failed");return await t.json()}var m=class extends i{static style=`
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
	`};m.register("nerd-action");var p=class n{id;name;parent;children;elements;constructor(e,t,r=null){this.id=e,this.name=t,this.parent=r,this.children=[],this.elements=[]}addChild(e,t){let r=new n(e,t,this);return this.children.push(r),r}render(e,t){let r=h(`<div class="nerd-entity">${this.name}</div>`);if(this.elements.push(r),e.appendChild(r),!t.stopList.has(this.id)){let o=h('<div class="nerd-children"></div>');r.appendChild(o);for(let s of this.children)s.render(o,t)}return r}},a=class{root;stopList;constructor(e){this.root=e,this.stopList=new Set}},l=class{listTrees;constructor(){this.listTrees=[]}},g=class{boards;constructor(){this.boards=[new l,new l]}},c=class{workbench;constructor(){this.workbench=new g}},f=class extends i{static style=`
		nerd-list-tree {
			display: block;
		}

		nerd-list-tree .nerd-entity {
			padding: 0.25em;
		}

		nerd-list-tree .nerd-children {
			padding-left: 1em;
		}
	`;config=null;SetConfig(e){this.config=e,this.render()}render(){this.config&&(this.innerHTML="",this.config.root.render(this,this.config))}},b=class n extends i{static style=`
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
	`;connectedCallback(){this.innerHTML=n.html,this.querySelector(".logout").addEventListener("click",()=>this.logout())}async logout(){try{await u(6,{}),d.SwitchToAuth()}catch(e){console.error("Logout failed:",e)}}},w=class n extends i{static style=`
		nerd-footer {
			display: block;
			background: #2c3e50;
			color: white;
			padding: 1rem;
			text-align: center;
		}
	`;static html=`
		Footer
	`;connectedCallback(){this.innerHTML=n.html}},y=class n extends i{static style=`
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
	`;leftContainer;rightContainer;connectedCallback(){this.innerHTML=n.html,this.leftContainer=this.querySelector(".board.left"),this.rightContainer=this.querySelector(".board.right")}renderBoards(){this.leftContainer.innerHTML="",this.rightContainer.innerHTML="";let e=d.state.workbench;for(let t of e.boards[0].listTrees){let r=document.createElement("nerd-list-tree");r.SetConfig(t),this.leftContainer.appendChild(r)}for(let t of e.boards[1].listTrees){let r=document.createElement("nerd-list-tree");r.SetConfig(t),this.rightContainer.appendChild(r)}}},T=class n extends i{static style=`
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
	`;regmode=!1;login=void 0;register=void 0;error=void 0;connectedCallback(){this.innerHTML=n.html,this.login=this.querySelector(".login"),this.register=this.querySelector(".register"),this.error=this.querySelector(".error"),this.attachEventListeners()}attachEventListeners(){this.login.addEventListener("submit",e=>this.handleSubmit(e,!1)),this.register.addEventListener("submit",e=>this.handleSubmit(e,!0)),this.login.querySelector(".toggle").addEventListener("click",()=>this.toggleMode()),this.register.querySelector(".toggle").addEventListener("click",()=>this.toggleMode())}toggleMode(){this.regmode=!this.regmode,this.login.classList.toggle("hidden"),this.register.classList.toggle("hidden")}async handleSubmit(e,t){e.preventDefault();let r=new FormData(e.target),o=Object.fromEntries(r);try{let s=await u(t?5:4,o);d.SwitchToWorkbench(s.userid)}catch(s){this.showError(s instanceof Error?s.message:"Network error. Please try again.")}}showError(e){this.error.textContent=e}},k=class n extends i{static style=`
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
	`;userId=0;admin=!1;state=new c;auth=document.createElement("nerd-auth");nodes=new Map;rootNode=null;connectedCallback(){this.userId=parseInt(this.getAttribute("userid"),10),this.admin=this.getAttribute("admin")==="true",v(this),this.innerHTML=n.html,this.updateAuthState()}SwitchToAuth(){this.userId=0,this.nodes.clear(),this.rootNode=null,this.state=new c;let e=this.querySelector("nerd-workbench");e&&e.classList.add("hidden"),this.appendChild(this.auth)}SwitchToWorkbench(e){this.userId=e;let t=this.querySelector("nerd-workbench");t&&t.classList.remove("hidden"),this.auth.remove(),this.initWorkbench()}updateAuthState(){this.userId===0?this.SwitchToAuth():this.SwitchToWorkbench(this.userId)}async initWorkbench(){try{let e=await this.getTree();console.log("TreeEntry received:",e),this.buildNodeTree(e),this.setupDefaultView()}catch(e){console.error("Failed to initialize workbench:",e)}}async getTree(){let e=this.admin?1:this.userId;return await C(0,e)}buildNodeTree(e,t=null){let r=new p(e.nodeId,e.name,t);if(this.nodes.set(r.id,r),t===null?this.rootNode=r:t.children.push(r),e.children)for(let o of e.children)this.buildNodeTree(o,r);return r}setupDefaultView(){if(!this.rootNode)return;let e=this.querySelector("nerd-workbench");if(!e)return;let t=this.admin?this.rootNode:this.nodes.get(this.userId);if(!t)return;let r=new a(t);for(let s of t.children)r.stopList.add(s.id);this.state.workbench.boards[0].listTrees.push(r);let o=new a(t);this.state.workbench.boards[1].listTrees.push(o),e.renderBoards()}};f.register("nerd-list-tree"),b.register("nerd-header"),w.register("nerd-footer"),y.register("nerd-workbench"),T.register("nerd-auth"),k.register("nerd-gui");
//# sourceMappingURL=gui.js.map
