var h=class n{id;name;parent;children;constructor(e,t,r=null){this.id=e,this.name=t,this.parent=r,this.children=[]}addChild(e,t){let r=new n(e,t,this);return this.children.push(r),r}collectToDepth(e,t){if(t.add(this.id),e>0)for(let r of this.children)r.collectToDepth(e-1,t)}},m={userId:0,admin:!1},o=class extends HTMLElement{static style="";static register(e){let t=document.createElement("style");t.textContent=this.style,document.head.appendChild(t),customElements.define(e,this)}Query(e){return this.querySelector(e)}Listen(e,t,r){this.addEventListener(e,t,r)}};async function q(n,e,t={}){let r=await fetch("/api",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:n,targetId:e,payload:t})});if(!r.ok)throw r.status===401&&window.dispatchEvent(new CustomEvent("nerd:unauthorized")),new Error(await r.text()||"Request failed");return await r.json()}async function u(n,e){let t=await fetch("/auth",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:n,payload:e})});if(!t.ok)throw new Error(await t.text()||"Request failed");return await t.json()}async function R(n){return await q(0,n)}function s(n){return document.createElement(n)}var H=class{rootId;openList;displayRoot},A=class{trees},N=class{boards},a=class{workbench},p={workbench:{boards:[{trees:[{rootId:0,openList:new Set,displayRoot:1}]},{trees:[{rootId:0,openList:new Set,displayRoot:2}]}]}};var b=class extends o{static style=`
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
	`};b.register("nerd-action");var f=class extends o{static style=`
		vertigo-tree {
			display: block;
		}
	`;config;Render(e,t,r){this.config=e,e.displayRoot!==void 0&&(e.rootId=r.id,e.openList=new Set,e.displayRoot>0&&r.collectToDepth(e.displayRoot-1,e.openList),delete e.displayRoot,t=r),this.innerHTML="";let i=s("vertigo-node");return i.Render(t,this.config),this.appendChild(i),this}},y=class extends o{static style=`
		vertigo-open {
			display: flex;
			align-items: center;
			justify-content: center;
			width: 2em;
			background-color: #666;
			cursor: pointer;
			user-select: none;
		}
	`},w=class extends o{static style=`
		vertigo-sidebar {
			display: block;
			width: 2em;
			background-color: #666;
		}
	`},v=class extends o{static style=`
		vertigo-header {
			display: block;
			min-width: 60ch;
			background-color: #999;
			padding: 0.25em;
		}
	`},k=class extends o{static style=`
		vertigo-node {
			display: grid;
			grid-template-columns: 2em 1fr;
			min-width: calc(2em + 60ch);
			margin: 6px 0 0 6px;
		}

		vertigo-node > vertigo-open {
			grid-column: 1;
			grid-row: 1;
		}

		vertigo-node > vertigo-sidebar {
			grid-column: 1;
		}

		vertigo-node > vertigo-header {
			grid-column: 2;
			grid-row: 1;
		}

		vertigo-node > vertigo-node {
			grid-column: 2;
		}
	`;Render(e,t){this.innerHTML="";let r=t.openList.has(e.id),i=r?e.children.length:0,d=s("vertigo-open");d.textContent=r?"\u25CB":"\u25CF",d.onclick=()=>{t.openList.has(e.id)?t.openList.delete(e.id):t.openList.add(e.id),this.Render(e,t)},this.appendChild(d);let M=s("vertigo-header");if(M.textContent=e.name,this.appendChild(M),r&&i>0){let c=s("vertigo-sidebar");c.style.gridRow=`2 / span ${i}`,this.appendChild(c)}if(r)for(let c of e.children){let I=s("vertigo-node");I.Render(c,t),this.appendChild(I)}return this}};f.register("vertigo-tree"),y.register("vertigo-open"),w.register("vertigo-sidebar"),v.register("vertigo-header"),k.register("vertigo-node");var l,T=class extends o{static style=`
		nerd-board {
			display: block;
			background: #555;
			color: #ccc;
			overflow: auto;
			padding-right: 6px;
		}
	`;config;Render(e){this.config=e,this.innerHTML="";for(let t of e.trees){let r=l.nodes.get(t.rootId),i=s("vertigo-tree");i.Render(t,r,l.displayRoot),this.appendChild(i)}}},x=class n extends o{static style=`
		nerd-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			background: #222;
			color: white;
			padding: 1rem;
			font-size: 1.2rem;
		}
	`;static html=`
		<span>Nerd - Personal Software Agent Framework</span>
		<nerd-action class="logout">Logout</nerd-action>
	`;logoutButton;connectedCallback(){this.innerHTML=n.html,this.logoutButton=this.Query(".logout"),this.logoutButton.addEventListener("click",()=>this.logout())}async logout(){try{await u(6,{}),l.SwitchToAuth()}catch(e){console.error("Logout failed:",e)}}},L=class n extends o{static style=`
		nerd-footer {
			display: block;
			background: #222;
			color: white;
			padding: 1rem;
			text-align: center;
		}
	`;static html=`
		Footer
	`;connectedCallback(){this.innerHTML=n.html}},E=class n extends o{static style=`
		nerd-workbench {
			display: grid;
			grid-template-columns: 1fr 1fr;
			grid-template-rows: auto 1fr auto;
			grid-template-areas:
				"header header"
				"board_0 board_1"
				"footer footer";
			width: 100%;
			height: 100%;
		}

		nerd-workbench nerd-header {
			grid-area: header;
		}

		nerd-workbench nerd-board.board_0 {
			grid-area: board_0;
			border: 0.5em solid #333;
			border-width: 0.5em 0.29em 0.5em 0.5em;
		}

		nerd-workbench nerd-board.board_1 {
			grid-area: board_1;
			border: 0.5em solid #333;
			border-width: 0.5em 0.5em 0.5em 0.29em;
		}

		nerd-workbench nerd-footer {
			grid-area: footer;
		}
	`;static html=`
		<nerd-header></nerd-header>
		<nerd-board class="board_0"></nerd-board>
		<nerd-board class="board_1"></nerd-board>
		<nerd-footer></nerd-footer>
	`;config;boardElements=[];connectedCallback(){this.innerHTML=n.html,this.boardElements=[this.Query("nerd-board.board_0"),this.Query("nerd-board.board_1")]}Render(e){this.config=e;for(let t=0;t<this.boardElements.length;t++)this.boardElements[t].Render(e.boards[t])}},C=class n extends o{static style=`
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
	`;regmode=!1;login;register;error;loginToggle;registerToggle;connectedCallback(){this.innerHTML=n.html,this.login=this.Query(".login"),this.register=this.Query(".register"),this.error=this.Query(".error"),this.loginToggle=this.login.querySelector(".toggle"),this.registerToggle=this.register.querySelector(".toggle"),this.login.addEventListener("submit",e=>this.handleSubmit(e,!1)),this.register.addEventListener("submit",e=>this.handleSubmit(e,!0)),this.loginToggle.addEventListener("click",()=>this.toggleMode()),this.registerToggle.addEventListener("click",()=>this.toggleMode())}toggleMode(){this.regmode=!this.regmode,this.login.classList.toggle("hidden"),this.register.classList.toggle("hidden")}async handleSubmit(e,t){e.preventDefault();let r=new FormData(e.target),i=Object.fromEntries(r);try{let d=await u(t?5:4,i);l.SwitchToWorkbench(d.userid)}catch(d){this.showError(d instanceof Error?d.message:"Network error. Please try again.")}}showError(e){this.error.textContent=e}},S=class n extends o{static style=`
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
	`;userId=0;admin=!1;state=new a;nodes=new Map;displayRoot=null;auth=s("nerd-auth");workbench;connectedCallback(){this.userId=parseInt(this.getAttribute("userid"),10),this.admin=this.getAttribute("admin")==="true",m.userId=this.userId,m.admin=this.admin,l=this,window.addEventListener("nerd:unauthorized",()=>this.SwitchToAuth()),this.innerHTML=n.html,this.workbench=this.Query("nerd-workbench"),this.userId===0?this.SwitchToAuth():this.SwitchToWorkbench(this.userId)}SwitchToAuth(){this.userId=0,this.nodes.clear(),this.displayRoot=null,this.state=new a,this.workbench.classList.add("hidden"),this.appendChild(this.auth)}SwitchToWorkbench(e){this.userId=e,this.workbench.classList.remove("hidden"),this.auth.remove(),this.init()}async init(){try{await this.buildNodeTree(),this.state.workbench=p.workbench,this.workbench.Render(p.workbench)}catch(e){console.error("Failed to initialize workbench:",e)}}async buildNodeTree(){let e=this.admin?1:this.userId,t=await R(e);console.log("TreeEntry received:",t),this.buildNodes(t,null)}buildNodes(e,t){let r=new h(e.nodeId,e.name,t);if(this.nodes.set(r.id,r),t===null?this.displayRoot=r:t.children.push(r),e.children)for(let i of e.children)this.buildNodes(i,r);return r}};T.register("nerd-board"),x.register("nerd-header"),L.register("nerd-footer"),E.register("nerd-workbench"),C.register("nerd-auth"),S.register("nerd-gui");
//# sourceMappingURL=gui.js.map
