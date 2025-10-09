var x=/^\s+|\s+$|(?<=\>)\s+(?=\<)/gm;function u(n){let e=document.createElement("template");return e.innerHTML=n.replace(x,""),e.content.firstElementChild}var g={userId:0,admin:!1},o=class extends HTMLElement{static style="";static register(e){let t=document.createElement("style");t.textContent=this.style,document.head.appendChild(t),customElements.define(e,this)}};async function E(n,e,t={}){let r=await fetch("/api",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:n,targetId:e,payload:t})});if(!r.ok)throw r.status===401&&window.dispatchEvent(new CustomEvent("nerd:unauthorized")),new Error(await r.text()||"Request failed");return await r.json()}async function f(n,e){let t=await fetch("/auth",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:n,payload:e})});if(!t.ok)throw new Error(await t.text()||"Request failed");return await t.json()}var d=class{rootId;stopList},a=class{listTrees},h=class{boards},l=class{workbench};var m=class extends o{static style=`
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
	`};m.register("nerd-action");var c,p=class n{id;name;parent;children;elements;constructor(e,t,r=null){this.id=e,this.name=t,this.parent=r,this.children=[],this.elements=[]}addChild(e,t){let r=new n(e,t,this);return this.children.push(r),r}render(e,t){let r=u(`<div class="nerd-entity">${this.name}</div>`);if(this.elements.push(r),e.appendChild(r),!t.stopList.has(this.id)){let i=u('<div class="nerd-children"></div>');r.appendChild(i);for(let s of this.children)s.render(i,t)}return r}},b=class extends o{static style=`
		nerd-list-tree {
			display: block;
		}

		nerd-list-tree .nerd-entity {
			padding: 0.25em;
		}

		nerd-list-tree .nerd-children {
			padding-left: 1em;
		}
	`;config=null;Init(e){if(e)this.config=e;else{let t=new d;t.rootId=c.displayRoot.id,t.stopList=new Set,this.config=t}return this.config}SetConfig(e){this.config=e,this.render()}render(){if(!this.config)return;this.innerHTML="";let e=c.nodes.get(this.config.rootId);e&&e.render(this,this.config)}},w=class extends o{static style=`
		nerd-board {
			display: block;
			border: 1px solid #ddd;
		}
	`;config=new a;Init(e){if(e){let t=new a;t.listTrees=[];for(let r of e.listTrees){let s=document.createElement("nerd-list-tree").Init(r);t.listTrees.push(s)}this.config=t}else{let t=new a;t.listTrees=[];let i=document.createElement("nerd-list-tree").Init(null);t.listTrees.push(i),this.config=t}return this.config}Render(){this.innerHTML="";for(let e of this.config.listTrees){let t=document.createElement("nerd-list-tree");t.SetConfig(e),this.appendChild(t)}}},y=class n extends o{static style=`
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
	`;logoutButton;connectedCallback(){this.innerHTML=n.html,this.logoutButton=this.querySelector(".logout"),this.logoutButton.addEventListener("click",()=>this.logout())}async logout(){try{await f(6,{}),c.SwitchToAuth()}catch(e){console.error("Logout failed:",e)}}},T=class n extends o{static style=`
		nerd-footer {
			display: block;
			background: #2c3e50;
			color: white;
			padding: 1rem;
			text-align: center;
		}
	`;static html=`
		Footer
	`;connectedCallback(){this.innerHTML=n.html}},k=class n extends o{static style=`
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
	`;boardElements=[];connectedCallback(){this.innerHTML=n.html;let e=this.querySelector("nerd-board.left"),t=this.querySelector("nerd-board.right");this.boardElements=[e,t]}Init(e){let t=new h;t.boards=[];let r=0;for(let i of this.boardElements){let s=i.Init(e?.boards[r]??null);t.boards.push(s),r++}return t}RenderBoards(){for(let e of this.boardElements)e.Render()}},L=class n extends o{static style=`
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
	`;regmode=!1;login=void 0;register=void 0;error=void 0;loginToggle=void 0;registerToggle=void 0;connectedCallback(){this.innerHTML=n.html,this.login=this.querySelector(".login"),this.register=this.querySelector(".register"),this.error=this.querySelector(".error"),this.loginToggle=this.login.querySelector(".toggle"),this.registerToggle=this.register.querySelector(".toggle"),this.attachEventListeners()}attachEventListeners(){this.login.addEventListener("submit",e=>this.handleSubmit(e,!1)),this.register.addEventListener("submit",e=>this.handleSubmit(e,!0)),this.loginToggle.addEventListener("click",()=>this.toggleMode()),this.registerToggle.addEventListener("click",()=>this.toggleMode())}toggleMode(){this.regmode=!this.regmode,this.login.classList.toggle("hidden"),this.register.classList.toggle("hidden")}async handleSubmit(e,t){e.preventDefault();let r=new FormData(e.target),i=Object.fromEntries(r);try{let s=await f(t?5:4,i);c.SwitchToWorkbench(s.userid)}catch(s){this.showError(s instanceof Error?s.message:"Network error. Please try again.")}}showError(e){this.error.textContent=e}},v=class n extends o{static style=`
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
	`;userId=0;admin=!1;state=new l;nodes=new Map;displayRoot=null;auth=document.createElement("nerd-auth");workbench=void 0;connectedCallback(){this.userId=parseInt(this.getAttribute("userid"),10),this.admin=this.getAttribute("admin")==="true",g.userId=this.userId,g.admin=this.admin,c=this,window.addEventListener("nerd:unauthorized",()=>this.SwitchToAuth()),this.innerHTML=n.html,this.workbench=this.querySelector("nerd-workbench"),this.updateAuthState()}SwitchToAuth(){this.userId=0,this.nodes.clear(),this.displayRoot=null,this.state=new l,this.workbench.classList.add("hidden"),this.appendChild(this.auth)}SwitchToWorkbench(e){this.userId=e,this.workbench.classList.remove("hidden"),this.auth.remove(),this.init()}updateAuthState(){this.userId===0?this.SwitchToAuth():this.SwitchToWorkbench(this.userId)}async init(){try{let e=await this.getTree();console.log("TreeEntry received:",e),this.buildNodeTree(e),this.state.workbench=this.workbench.Init(null),this.workbench.RenderBoards()}catch(e){console.error("Failed to initialize workbench:",e)}}async getTree(){let e=this.admin?1:this.userId;return await E(0,e)}buildNodeTree(e,t=null){let r=new p(e.nodeId,e.name,t);if(this.nodes.set(r.id,r),t===null?this.displayRoot=r:t.children.push(r),e.children)for(let i of e.children)this.buildNodeTree(i,r);return r}setupDefaultView(){if(!this.displayRoot)return;let e=this.displayRoot,t=new d;t.rootId=e.id,t.stopList=new Set;for(let i of e.children)t.stopList.add(i.id);this.state.workbench.boards[0].listTrees.push(t);let r=new d;r.rootId=e.id,r.stopList=new Set,this.state.workbench.boards[1].listTrees.push(r),this.workbench.RenderBoards()}};b.register("nerd-list-tree"),w.register("nerd-board"),y.register("nerd-header"),T.register("nerd-footer"),k.register("nerd-workbench"),L.register("nerd-auth"),v.register("nerd-gui");
//# sourceMappingURL=gui.js.map
