var x=/^\s+|\s+$|(?<=\>)\s+(?=\<)/gm;function u(r){let e=document.createElement("template");return e.innerHTML=r.replace(x,""),e.content.firstElementChild}var g={userId:0,admin:!1},o=class extends HTMLElement{static style="";static register(e){let t=document.createElement("style");t.textContent=this.style,document.head.appendChild(t),customElements.define(e,this)}Query(e){return this.querySelector(e)}Listen(e,t,n){this.addEventListener(e,t,n)}};async function v(r,e,t={}){let n=await fetch("/api",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:r,targetId:e,payload:t})});if(!n.ok)throw n.status===401&&window.dispatchEvent(new CustomEvent("nerd:unauthorized")),new Error(await n.text()||"Request failed");return await n.json()}async function m(r,e){let t=await fetch("/auth",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:r,payload:e})});if(!t.ok)throw new Error(await t.text()||"Request failed");return await t.json()}var d=class{rootId;stopList},a=class{listTrees},h=class{boards},l=class{workbench};var f=class extends o{static style=`
		nerd-action {
			display: inline;
			background: none;
			border: none;
			color: #aaa;
			text-decoration: underline;
			cursor: pointer;
			padding: 0;
			font-size: 0.75em;
		}

		nerd-action:hover {
			color: #ddd;
		}
	`};f.register("nerd-action");var c,p=class r{id;name;parent;children;elements;constructor(e,t,n=null){this.id=e,this.name=t,this.parent=n,this.children=[],this.elements=[]}addChild(e,t){let n=new r(e,t,this);return this.children.push(n),n}render(e,t){let n=u(`<div class="nerd-entity">${this.name}</div>`);if(this.elements.push(n),e.appendChild(n),!t.stopList.has(this.id)){let i=u('<div class="nerd-children"></div>');n.appendChild(i);for(let s of this.children)s.render(i,t)}return n}},b=class extends o{static style=`
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
			background: #555;
			color: #ccc;
		}
	`;config=new a;Init(e){if(e){let t=new a;t.listTrees=[];for(let n of e.listTrees){let s=document.createElement("nerd-list-tree").Init(n);t.listTrees.push(s)}this.config=t}else{let t=new a;t.listTrees=[];let i=document.createElement("nerd-list-tree").Init(null);t.listTrees.push(i),this.config=t}return this.config}Render(){this.innerHTML="";for(let e of this.config.listTrees){let t=document.createElement("nerd-list-tree");t.SetConfig(e),this.appendChild(t)}}},T=class r extends o{static style=`
		nerd-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			background: #333;
			color: white;
			padding: 1rem;
			font-size: 1.2rem;
		}
	`;static html=`
		<span>Nerd - Personal Software Agent Framework</span>
		<nerd-action class="logout">Logout</nerd-action>
	`;logoutButton;connectedCallback(){this.innerHTML=r.html,this.logoutButton=this.Query(".logout"),this.logoutButton.addEventListener("click",()=>this.logout())}async logout(){try{await m(6,{}),c.SwitchToAuth()}catch(e){console.error("Logout failed:",e)}}},y=class r extends o{static style=`
		nerd-footer {
			display: block;
			background: #333;
			color: white;
			padding: 1rem;
			text-align: center;
		}
	`;static html=`
		Footer
	`;connectedCallback(){this.innerHTML=r.html}},L=class r extends o{static style=`
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
			border: 0.5em solid #444;
			border-width: 0.5em 0.29em 0.5em 0.5em;
		}

		nerd-workbench nerd-board.right {
			grid-area: right;
			border: 0.5em solid #444;
			border-width: 0.5em 0.5em 0.5em 0.29em;
		}

		nerd-workbench nerd-footer {
			grid-area: footer;
		}
	`;static html=`
		<nerd-header></nerd-header>
		<nerd-board class="left"></nerd-board>
		<nerd-board class="right"></nerd-board>
		<nerd-footer></nerd-footer>
	`;boardElements=[];connectedCallback(){this.innerHTML=r.html;let e=this.Query("nerd-board.left"),t=this.Query("nerd-board.right");this.boardElements=[e,t]}Init(e){let t=new h;t.boards=[];let n=0;for(let i of this.boardElements){let s=i.Init(e?.boards[n]??null);t.boards.push(s),n++}return t}RenderBoards(){for(let e of this.boardElements)e.Render()}},k=class r extends o{static style=`
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
			background: #fff;
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
	`;regmode=!1;login=void 0;register=void 0;error=void 0;loginToggle=void 0;registerToggle=void 0;connectedCallback(){this.innerHTML=r.html,this.login=this.Query(".login"),this.register=this.Query(".register"),this.error=this.Query(".error"),this.loginToggle=this.login.querySelector(".toggle"),this.registerToggle=this.register.querySelector(".toggle"),this.attachEventListeners()}attachEventListeners(){this.login.addEventListener("submit",e=>this.handleSubmit(e,!1)),this.register.addEventListener("submit",e=>this.handleSubmit(e,!0)),this.loginToggle.addEventListener("click",()=>this.toggleMode()),this.registerToggle.addEventListener("click",()=>this.toggleMode())}toggleMode(){this.regmode=!this.regmode,this.login.classList.toggle("hidden"),this.register.classList.toggle("hidden")}async handleSubmit(e,t){e.preventDefault();let n=new FormData(e.target),i=Object.fromEntries(n);try{let s=await m(t?5:4,i);c.SwitchToWorkbench(s.userid)}catch(s){this.showError(s instanceof Error?s.message:"Network error. Please try again.")}}showError(e){this.error.textContent=e}},E=class r extends o{static style=`
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
			background: #fff;
		}

		.hidden {
			display: none;
		}
	`;static html=`
		<nerd-workbench></nerd-workbench>
	`;userId=0;admin=!1;state=new l;nodes=new Map;displayRoot=null;auth=document.createElement("nerd-auth");workbench=void 0;connectedCallback(){this.userId=parseInt(this.getAttribute("userid"),10),this.admin=this.getAttribute("admin")==="true",g.userId=this.userId,g.admin=this.admin,c=this,window.addEventListener("nerd:unauthorized",()=>this.SwitchToAuth()),this.innerHTML=r.html,this.workbench=this.Query("nerd-workbench"),this.updateAuthState()}SwitchToAuth(){this.userId=0,this.nodes.clear(),this.displayRoot=null,this.state=new l,this.workbench.classList.add("hidden"),this.appendChild(this.auth)}SwitchToWorkbench(e){this.userId=e,this.workbench.classList.remove("hidden"),this.auth.remove(),this.init()}updateAuthState(){this.userId===0?this.SwitchToAuth():this.SwitchToWorkbench(this.userId)}async init(){try{let e=await this.getTree();console.log("TreeEntry received:",e),this.buildNodeTree(e),this.state.workbench=this.workbench.Init(null),this.workbench.RenderBoards()}catch(e){console.error("Failed to initialize workbench:",e)}}async getTree(){let e=this.admin?1:this.userId;return await v(0,e)}buildNodeTree(e,t=null){let n=new p(e.nodeId,e.name,t);if(this.nodes.set(n.id,n),t===null?this.displayRoot=n:t.children.push(n),e.children)for(let i of e.children)this.buildNodeTree(i,n);return n}setupDefaultView(){if(!this.displayRoot)return;let e=this.displayRoot,t=new d;t.rootId=e.id,t.stopList=new Set;for(let i of e.children)t.stopList.add(i.id);this.state.workbench.boards[0].listTrees.push(t);let n=new d;n.rootId=e.id,n.stopList=new Set,this.state.workbench.boards[1].listTrees.push(n),this.workbench.RenderBoards()}};b.register("nerd-list-tree"),w.register("nerd-board"),T.register("nerd-header"),y.register("nerd-footer"),L.register("nerd-workbench"),k.register("nerd-auth"),E.register("nerd-gui");
//# sourceMappingURL=gui.js.map
