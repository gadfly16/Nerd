var p=class r{id;name;children;parent=null;constructor(e,t,n=[]){this.id=e,this.name=t,this.children=n}static init(e,t=null){let n=new r(e.nodeId,e.name,[]);return n.parent=t,e.children&&(n.children=e.children.map(o=>r.init(o,n))),n}collectToDepth(e,t){if(t.add(this.id),e>0)for(let n of this.children)n.collectToDepth(e-1,t)}},g={userId:0,admin:!1},i=class extends HTMLElement{static style="";static register(e){let t=document.createElement("style");t.textContent=this.style,document.head.appendChild(t),customElements.define(e,this)}Query(e){return this.querySelector(e)}Listen(e,t,n){this.addEventListener(e,t,n)}};async function N(r,e,t={}){let n=await fetch("/api",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:r,targetId:e,payload:t})});if(!n.ok)throw n.status===401&&window.dispatchEvent(new CustomEvent("nerd:unauthorized")),new Error(await n.text()||"Request failed");return await n.json()}async function m(r,e){let t=await fetch("/auth",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:r,payload:e})});if(!t.ok)throw new Error(await t.text()||"Request failed");return await t.json()}async function R(r){return await N(0,r)}function s(r){return document.createElement(r)}var I=class{rootId;openList;displayRoot},H=class{trees},A=class{boards},a=class{workbench},b={workbench:{boards:[{trees:[{rootId:0,openList:new Set,displayRoot:6}]},{trees:[{rootId:0,openList:new Set,displayRoot:6}]}]}};var f=class extends i{static style=`
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
	`};f.register("nerd-action");var h=32,d=6,D=h+d,z=640;function Q(r){return r*D+h+z-d}var y=class extends i{static style=`
		vertigo-tree {
			display: block;
			padding-right: ${d}px;
		}
	`;config;treeRoot;rootNode;resizeObserver;connectedCallback(){this.resizeObserver=new ResizeObserver(()=>{this.updateWidth()})}disconnectedCallback(){this.resizeObserver?.disconnect()}Render(e,t,n){return this.config=e,this.treeRoot=t,e.displayRoot!==void 0&&(e.rootId=n.id,e.openList=new Set,e.displayRoot>0&&n.collectToDepth(e.displayRoot-1,e.openList),delete e.displayRoot,t=n,this.treeRoot=t),this.innerHTML="",this.addEventListener("vertigo:change",()=>this.updateWidth()),this.rootNode=s("vertigo-node"),this.appendChild(this.rootNode),this.rootNode.Render(t,this.config,0),this.parentElement&&this.resizeObserver.observe(this.parentElement),this}updateWidth(){let e=this.rootNode.displayDepth(),t=Q(e),n=(this.parentElement?.clientWidth||0)-d;console.log(`clientWidth: ${n}px`);let o=Math.max(t,n);this.style.width=`${o}px`}},v=class extends i{static style=`
		vertigo-open {
			display: flex;
			align-items: center;
			justify-content: center;
			width: ${h}px;
			background-color: #666;
			cursor: pointer;
			user-select: none;
		}
	`},w=class extends i{static style=`
		vertigo-sidebar {
			display: block;
			width: ${h}px;
			background-color: #666;
		}
	`},E=class extends i{static style=`
		vertigo-header {
			display: block;
			background-color: #999;
			padding: 0.25em;
		}
	`},x=class r extends i{static style=`
		vertigo-node {
			display: grid;
			grid-template-columns: ${h}px 1fr;
			grid-template-rows: auto 1fr;
			margin: ${d}px 0 0 ${d}px;
		}

		vertigo-node > vertigo-open {
			grid-area: 1 / 1;
		}

		vertigo-node > vertigo-header {
			grid-area: 1 / 2;
		}

		vertigo-node > vertigo-sidebar {
			grid-area: 2 / 1;
		}

		vertigo-node > .details {
			grid-area: 2 / 2;
			display: flex;
			flex-direction: column;
		}
	`;static html=`
		<vertigo-open></vertigo-open>
		<vertigo-header></vertigo-header>
		<vertigo-sidebar></vertigo-sidebar>
		<div class="details">
			<div class="children"></div>
		</div>
	`;te;cfg;depth;childElements=[];open;header;sidebar;childrenContainer;connectedCallback(){this.innerHTML=r.html,this.open=this.Query("vertigo-open"),this.header=this.Query("vertigo-header"),this.sidebar=this.Query("vertigo-sidebar"),this.childrenContainer=this.Query(".children"),this.open.onclick=()=>this.toggleOpen()}Render(e,t,n){this.te=e,this.cfg=t,this.depth=n;let o=t.openList.has(e.id);this.open.textContent=o?"\u25CB":"\u25CF",this.header.textContent=e.name,this.sidebar.style.display=o&&e.children.length>0?"block":"none",o?this.renderChildren():this.clearChildren()}toggleOpen(){this.cfg.openList.has(this.te.id)?(this.cfg.openList.delete(this.te.id),this.clearChildren()):(this.cfg.openList.add(this.te.id),this.renderChildren());let e=this.cfg.openList.has(this.te.id);this.open.textContent=e?"\u25CB":"\u25CF",this.sidebar.style.display=e&&this.te.children.length>0?"block":"none",this.dispatchEvent(new CustomEvent("vertigo:change",{bubbles:!0}))}renderChildren(){this.clearChildren();for(let e of this.te.children){let t=s("vertigo-node");this.childrenContainer.appendChild(t),t.Render(e,this.cfg,this.depth+1),this.childElements.push(t)}}clearChildren(){for(let e of this.childElements)e.remove();this.childElements=[]}displayDepth(){let e=this.depth;if(this.cfg.openList.has(this.te.id))for(let t of this.childElements){let n=t.displayDepth();e=Math.max(e,n)}return e}};y.register("vertigo-tree"),v.register("vertigo-open"),w.register("vertigo-sidebar"),E.register("vertigo-header"),x.register("vertigo-node");var l,T=class extends i{static style=`
		nerd-board {
			display: block;
			background: #555;
			color: #ccc;
			overflow: auto;
		}
	`;config;Render(e){this.config=e,this.innerHTML="";for(let t of e.trees){let n=s("vertigo-tree");this.appendChild(n),n.Render(t,l.displayRoot,l.displayRoot)}}},k=class r extends i{static style=`
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
	`;logoutButton;connectedCallback(){this.innerHTML=r.html,this.logoutButton=this.Query(".logout"),this.logoutButton.addEventListener("click",()=>this.logout())}async logout(){try{await m(6,{}),l.SwitchToAuth()}catch(e){console.error("Logout failed:",e)}}},C=class r extends i{static style=`
		nerd-footer {
			display: block;
			background: #222;
			color: white;
			padding: 1rem;
			text-align: center;
		}
	`;static html=`
		Footer
	`;connectedCallback(){this.innerHTML=r.html}},L=class r extends i{static style=`
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
	`;config;boardElements=[];connectedCallback(){this.innerHTML=r.html,this.boardElements=[this.Query("nerd-board.board_0"),this.Query("nerd-board.board_1")]}Render(e){this.config=e;for(let t=0;t<this.boardElements.length;t++)this.boardElements[t].Render(e.boards[t])}},S=class r extends i{static style=`
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
	`;regmode=!1;login;register;error;loginToggle;registerToggle;connectedCallback(){this.innerHTML=r.html,this.login=this.Query(".login"),this.register=this.Query(".register"),this.error=this.Query(".error"),this.loginToggle=this.login.querySelector(".toggle"),this.registerToggle=this.register.querySelector(".toggle"),this.login.addEventListener("submit",e=>this.handleSubmit(e,!1)),this.register.addEventListener("submit",e=>this.handleSubmit(e,!0)),this.loginToggle.addEventListener("click",()=>this.toggleMode()),this.registerToggle.addEventListener("click",()=>this.toggleMode())}toggleMode(){this.regmode=!this.regmode,this.login.classList.toggle("hidden"),this.register.classList.toggle("hidden")}async handleSubmit(e,t){e.preventDefault();let n=new FormData(e.target),o=Object.fromEntries(n);try{let c=await m(t?5:4,o);l.SwitchToWorkbench(c.userid)}catch(c){this.showError(c instanceof Error?c.message:"Network error. Please try again.")}}showError(e){this.error.textContent=e}},M=class r extends i{static style=`
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
	`;userId=0;admin=!1;state=new a;displayRoot=null;auth=s("nerd-auth");workbench;connectedCallback(){this.userId=parseInt(this.getAttribute("userid"),10),this.admin=this.getAttribute("admin")==="true",g.userId=this.userId,g.admin=this.admin,l=this,window.addEventListener("nerd:unauthorized",()=>this.SwitchToAuth()),this.innerHTML=r.html,this.workbench=this.Query("nerd-workbench"),this.userId===0?this.SwitchToAuth():this.SwitchToWorkbench(this.userId)}SwitchToAuth(){this.userId=0,this.displayRoot=null,this.state=new a,this.workbench.classList.add("hidden"),this.appendChild(this.auth)}SwitchToWorkbench(e){this.userId=e,this.workbench.classList.remove("hidden"),this.auth.remove(),this.init()}async init(){try{await this.buildNodeTree(),this.state.workbench=b.workbench,this.workbench.Render(b.workbench)}catch(e){console.error("Failed to initialize workbench:",e)}}async buildNodeTree(){let e=this.admin?1:this.userId,t=await R(e);console.log("TreeEntry received:",t),this.displayRoot=p.init(t)}};T.register("nerd-board"),k.register("nerd-header"),C.register("nerd-footer"),L.register("nerd-workbench"),S.register("nerd-auth"),M.register("nerd-gui");
//# sourceMappingURL=gui.js.map
