var C=/^\s+|\s+$|(?<=\>)\s+(?=\<)/gm;function c(r){let e=document.createElement("template");return e.innerHTML=r.replace(C,""),e.content.firstElementChild}var i=class extends HTMLElement{static style="";static register(e){let t=document.createElement("style");t.textContent=this.style,document.head.appendChild(t),customElements.define(e,this)}},s;function L(r){s=r}async function E(r,e,t={}){let n=await fetch("/api",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:r,targetId:e,payload:t})});if(!n.ok)throw n.status===401&&s.SwitchToAuth(),new Error(await n.text()||"Request failed");return await n.json()}async function u(r,e){let t=await fetch("/auth",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:r,payload:e})});if(!t.ok)throw new Error(await t.text()||"Request failed");return await t.json()}var g=class extends i{static style=`
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
	`};g.register("nerd-action");var m=class r{id;name;parent;children;elements;constructor(e,t,n=null){this.id=e,this.name=t,this.parent=n,this.children=[],this.elements=[]}addChild(e,t){let n=new r(e,t,this);return this.children.push(n),n}render(e,t){let n=c(`<div class="nerd-entity">${this.name}</div>`);if(this.elements.push(n),e.appendChild(n),!t.stopList.has(this.id)){let o=c('<div class="nerd-children"></div>');n.appendChild(o);for(let d of this.children)d.render(o,t)}return n}},l=class{root;stopList;constructor(e){this.root=e,this.stopList=new Set}},a=class{listTrees;constructor(){this.listTrees=[]}},p=class{boards;constructor(){this.boards=[new a,new a]}},h=class{workbench;constructor(){this.workbench=new p}},f=class extends i{static style=`
		nerd-list-tree {
			display: block;
		}

		nerd-list-tree .nerd-entity {
			padding: 0.25em;
		}

		nerd-list-tree .nerd-children {
			padding-left: 1em;
		}
	`;config=null;SetConfig(e){this.config=e,this.render()}render(){this.config&&(this.innerHTML="",this.config.root.render(this,this.config))}},b=class extends i{static style=`
		nerd-board {
			display: block;
			border: 1px solid #ddd;
		}
	`;config=new a;Render(){this.innerHTML="";for(let e of this.config.listTrees){let t=document.createElement("nerd-list-tree");t.SetConfig(e),this.appendChild(t)}}},w=class r extends i{static style=`
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
	`;logoutButton;connectedCallback(){this.innerHTML=r.html,this.logoutButton=this.querySelector(".logout"),this.logoutButton.addEventListener("click",()=>this.logout())}async logout(){try{await u(6,{}),s.SwitchToAuth()}catch(e){console.error("Logout failed:",e)}}},y=class r extends i{static style=`
		nerd-footer {
			display: block;
			background: #2c3e50;
			color: white;
			padding: 1rem;
			text-align: center;
		}
	`;static html=`
		Footer
	`;connectedCallback(){this.innerHTML=r.html}},T=class r extends i{static style=`
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

		nerd-workbench nerd-board.left {
			grid-area: left;
		}

		nerd-workbench nerd-board.right {
			grid-area: right;
		}

		nerd-workbench nerd-footer {
			grid-area: footer;
		}
	`;static html=`
		<nerd-header></nerd-header>
		<nerd-board class="left"></nerd-board>
		<nerd-board class="right"></nerd-board>
		<nerd-footer></nerd-footer>
	`;boardElements=[];connectedCallback(){this.innerHTML=r.html;let e=this.querySelector("nerd-board.left"),t=this.querySelector("nerd-board.right");this.boardElements=[e,t],e.config=s.state.workbench.boards[0],t.config=s.state.workbench.boards[1]}RenderBoards(){for(let e of this.boardElements)e.Render()}},k=class r extends i{static style=`
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
	`;regmode=!1;login=void 0;register=void 0;error=void 0;loginToggle=void 0;registerToggle=void 0;connectedCallback(){this.innerHTML=r.html,this.login=this.querySelector(".login"),this.register=this.querySelector(".register"),this.error=this.querySelector(".error"),this.loginToggle=this.login.querySelector(".toggle"),this.registerToggle=this.register.querySelector(".toggle"),this.attachEventListeners()}attachEventListeners(){this.login.addEventListener("submit",e=>this.handleSubmit(e,!1)),this.register.addEventListener("submit",e=>this.handleSubmit(e,!0)),this.loginToggle.addEventListener("click",()=>this.toggleMode()),this.registerToggle.addEventListener("click",()=>this.toggleMode())}toggleMode(){this.regmode=!this.regmode,this.login.classList.toggle("hidden"),this.register.classList.toggle("hidden")}async handleSubmit(e,t){e.preventDefault();let n=new FormData(e.target),o=Object.fromEntries(n);try{let d=await u(t?5:4,o);s.SwitchToWorkbench(d.userid)}catch(d){this.showError(d instanceof Error?d.message:"Network error. Please try again.")}}showError(e){this.error.textContent=e}},v=class r extends i{static style=`
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
	`;userId=0;admin=!1;state=new h;auth=document.createElement("nerd-auth");workbench=void 0;nodes=new Map;rootNode=null;connectedCallback(){this.userId=parseInt(this.getAttribute("userid"),10),this.admin=this.getAttribute("admin")==="true",L(this),this.innerHTML=r.html,this.workbench=this.querySelector("nerd-workbench"),this.updateAuthState()}SwitchToAuth(){this.userId=0,this.nodes.clear(),this.rootNode=null,this.state=new h,this.workbench.classList.add("hidden"),this.appendChild(this.auth)}SwitchToWorkbench(e){this.userId=e,this.workbench.classList.remove("hidden"),this.auth.remove(),this.initWorkbench()}updateAuthState(){this.userId===0?this.SwitchToAuth():this.SwitchToWorkbench(this.userId)}async initWorkbench(){try{let e=await this.getTree();console.log("TreeEntry received:",e),this.buildNodeTree(e),this.setupDefaultView()}catch(e){console.error("Failed to initialize workbench:",e)}}async getTree(){let e=this.admin?1:this.userId;return await E(0,e)}buildNodeTree(e,t=null){let n=new m(e.nodeId,e.name,t);if(this.nodes.set(n.id,n),t===null?this.rootNode=n:t.children.push(n),e.children)for(let o of e.children)this.buildNodeTree(o,n);return n}setupDefaultView(){if(!this.rootNode)return;let e=this.admin?this.rootNode:this.nodes.get(this.userId);if(!e)return;let t=new l(e);for(let o of e.children)t.stopList.add(o.id);this.state.workbench.boards[0].listTrees.push(t);let n=new l(e);this.state.workbench.boards[1].listTrees.push(n),this.workbench.RenderBoards()}};f.register("nerd-list-tree"),b.register("nerd-board"),w.register("nerd-header"),y.register("nerd-footer"),T.register("nerd-workbench"),k.register("nerd-auth"),v.register("nerd-gui");
//# sourceMappingURL=gui.js.map
