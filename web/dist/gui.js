var a=new Map,p=class r{id;name;children;parent=null;constructor(e,t,n=[]){this.id=e,this.name=t,this.children=n}static init(e,t=null){let n=new r(e.nodeId,e.name,[]);return n.parent=t,a.set(n.id,n),e.children&&(n.children=e.children.map(o=>r.init(o,n))),n}collectToDepth(e,t){if(t.add(this.id),e>0)for(let n of this.children)n.collectToDepth(e-1,t)}},m={userId:0,admin:!1},i=class extends HTMLElement{static style="";static register(e){let t=document.createElement("style");t.textContent=this.style,document.head.appendChild(t),customElements.define(e,this)}Query(e){return this.querySelector(e)}Listen(e,t,n){this.addEventListener(e,t,n)}};async function N(r,e,t={}){let n=await fetch("/api",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:r,targetId:e,payload:t})});if(!n.ok)throw n.status===401&&window.dispatchEvent(new CustomEvent("nerd:unauthorized")),new Error(await n.text()||"Request failed");return await n.json()}async function u(r,e){let t=await fetch("/auth",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:r,payload:e})});if(!t.ok)throw new Error(await t.text()||"Request failed");return await t.json()}async function H(r){return await N(0,r)}function s(r){return document.createElement(r)}var R=class{rootId;openList;openDepth},A=class{trees},D=class{boards},h=class{workbench},f={workbench:{boards:[{trees:[{rootId:0,openList:new Set,openDepth:6}]},{trees:[{rootId:4,openList:new Set}]}]}};var y=class extends i{static style=`
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
	`};y.register("nerd-action");var l=32,d=6,z=l+d,Q=640;function $(r){return r*z+l+Q-d}var v=class extends i{static style=`
		vertigo-tree {
			display: block;
			padding-right: ${d}px;
		}
	`;config;root;rootElem;resizeObs;connectedCallback(){this.resizeObs=new ResizeObserver(()=>{this.updateWidth()})}disconnectedCallback(){this.resizeObs?.disconnect()}Render(e,t){this.config=e,e.rootId===0&&(e.rootId=t.id);let n=a.get(e.rootId);if(!n)throw new Error(`TreeEntry with id ${e.rootId} not found in registry`);return this.root=n,e.openDepth!==void 0&&e.openDepth>0&&n.collectToDepth(e.openDepth-1,e.openList),this.innerHTML="",this.addEventListener("vertigo:change",()=>this.updateWidth()),this.rootElem=s("vertigo-node"),this.appendChild(this.rootElem),this.rootElem.Render(n,this.config,0),this.parentElement&&this.resizeObs.observe(this.parentElement),this}updateWidth(){let e=this.rootElem.displayDepth(),t=$(e),n=(this.parentElement?.clientWidth||0)-d,o=Math.max(t,n);this.style.width=`${o}px`}},w=class extends i{static style=`
		vertigo-open {
			display: flex;
			align-items: center;
			justify-content: center;
			width: ${l}px;
			background-color: #666;
			cursor: pointer;
			user-select: none;
		}
	`},E=class extends i{static style=`
		vertigo-sidebar {
			display: block;
			width: ${l}px;
			background-color: #666;
		}
	`},x=class extends i{static style=`
		vertigo-header {
			display: block;
			background-color: #999;
			padding: 0.25em;
		}
	`},T=class r extends i{static style=`
		vertigo-node {
			display: grid;
			grid-template-columns: ${l}px 1fr;
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
	`;te;cfg;depth;childElems=[];open;header;sidebar;childrenElem;connectedCallback(){this.innerHTML=r.html,this.open=this.Query("vertigo-open"),this.header=this.Query("vertigo-header"),this.sidebar=this.Query("vertigo-sidebar"),this.childrenElem=this.Query(".children"),this.open.onclick=()=>this.toggleOpen()}Render(e,t,n){this.te=e,this.cfg=t,this.depth=n;let o=t.openList.has(e.id);this.open.textContent=o?"\u25CB":"\u25CF",this.header.textContent=e.name,o&&this.renderChildren()}toggleOpen(){this.cfg.openList.has(this.te.id)?(this.cfg.openList.delete(this.te.id),this.clearChildren(),this.open.textContent="\u25CF"):(this.cfg.openList.add(this.te.id),this.renderChildren(),this.open.textContent="\u25CB"),this.dispatchEvent(new CustomEvent("vertigo:change",{bubbles:!0}))}renderChildren(){for(let e of this.te.children){let t=s("vertigo-node");this.childrenElem.appendChild(t),t.Render(e,this.cfg,this.depth+1),this.childElems.push(t)}}clearChildren(){for(let e of this.childElems)e.remove();this.childElems=[]}displayDepth(){let e=this.depth;if(this.cfg.openList.has(this.te.id))for(let t of this.childElems){let n=t.displayDepth();e=Math.max(e,n)}return e}};v.register("vertigo-tree"),w.register("vertigo-open"),E.register("vertigo-sidebar"),x.register("vertigo-header"),T.register("vertigo-node");var g,k=class extends i{static style=`
		nerd-board {
			display: block;
			background: #555;
			color: #ccc;
			overflow: auto;
		}
	`;config;Render(e){this.config=e,this.innerHTML="";for(let t of e.trees){let n=s("vertigo-tree");this.appendChild(n),n.Render(t,g.dispRoot)}}},L=class r extends i{static style=`
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
	`;logoutButton;connectedCallback(){this.innerHTML=r.html,this.logoutButton=this.Query(".logout"),this.logoutButton.addEventListener("click",()=>this.logout())}async logout(){try{await u(6,{}),g.SwitchToAuth()}catch(e){console.error("Logout failed:",e)}}},C=class r extends i{static style=`
		nerd-footer {
			display: block;
			background: #222;
			color: white;
			padding: 1rem;
			text-align: center;
		}
	`;static html=`
		Footer
	`;connectedCallback(){this.innerHTML=r.html}},M=class r extends i{static style=`
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
	`;regmode=!1;login;register;error;loginToggle;registerToggle;connectedCallback(){this.innerHTML=r.html,this.login=this.Query(".login"),this.register=this.Query(".register"),this.error=this.Query(".error"),this.loginToggle=this.login.querySelector(".toggle"),this.registerToggle=this.register.querySelector(".toggle"),this.login.addEventListener("submit",e=>this.handleSubmit(e,!1)),this.register.addEventListener("submit",e=>this.handleSubmit(e,!0)),this.loginToggle.addEventListener("click",()=>this.toggleMode()),this.registerToggle.addEventListener("click",()=>this.toggleMode())}toggleMode(){this.regmode=!this.regmode,this.login.classList.toggle("hidden"),this.register.classList.toggle("hidden")}async handleSubmit(e,t){e.preventDefault();let n=new FormData(e.target),o=Object.fromEntries(n);try{let c=await u(t?5:4,o);g.SwitchToWorkbench(c.userid)}catch(c){this.showError(c instanceof Error?c.message:"Network error. Please try again.")}}showError(e){this.error.textContent=e}},I=class r extends i{static style=`
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
	`;userId=0;admin=!1;state=new h;dispRoot=null;auth=s("nerd-auth");workbench;connectedCallback(){this.userId=parseInt(this.getAttribute("userid"),10),this.admin=this.getAttribute("admin")==="true",m.userId=this.userId,m.admin=this.admin,g=this,window.addEventListener("nerd:unauthorized",()=>this.SwitchToAuth()),this.innerHTML=r.html,this.workbench=this.Query("nerd-workbench"),this.userId===0?this.SwitchToAuth():this.SwitchToWorkbench(this.userId)}SwitchToAuth(){this.userId=0,this.dispRoot=null,this.state=new h,a.clear(),this.workbench.classList.add("hidden"),this.appendChild(this.auth)}SwitchToWorkbench(e){this.userId=e,this.workbench.classList.remove("hidden"),this.auth.remove(),this.init()}async init(){try{await this.buildNodeTree(),this.state.workbench=f.workbench,this.workbench.Render(f.workbench)}catch(e){console.error("Failed to initialize workbench:",e)}}async buildNodeTree(){let e=this.admin?1:this.userId,t=await H(e);console.log("TreeEntry received:",t),this.dispRoot=p.init(t)}};k.register("nerd-board"),L.register("nerd-header"),C.register("nerd-footer"),M.register("nerd-workbench"),S.register("nerd-auth"),I.register("nerd-gui");
//# sourceMappingURL=gui.js.map
