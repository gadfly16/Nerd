var m=class r{id;name;children;parent=null;constructor(e,t,n=[]){this.id=e,this.name=t,this.children=n}static init(e,t=null){let n=new r(e.nodeId,e.name,[]);return n.parent=t,e.children&&(n.children=e.children.map(i=>r.init(i,n))),n}collectToDepth(e,t){if(t.add(this.id),e>0)for(let n of this.children)n.collectToDepth(e-1,t)}},b={userId:0,admin:!1},o=class extends HTMLElement{static style="";static register(e){let t=document.createElement("style");t.textContent=this.style,document.head.appendChild(t),customElements.define(e,this)}Query(e){return this.querySelector(e)}Listen(e,t,n){this.addEventListener(e,t,n)}};async function F(r,e,t={}){let n=await fetch("/api",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:r,targetId:e,payload:t})});if(!n.ok)throw n.status===401&&window.dispatchEvent(new CustomEvent("nerd:unauthorized")),new Error(await n.text()||"Request failed");return await n.json()}async function f(r,e){let t=await fetch("/auth",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:r,payload:e})});if(!t.ok)throw new Error(await t.text()||"Request failed");return await t.json()}async function N(r){return await F(0,r)}function s(r){return document.createElement(r)}var W=class{rootId;openList;displayRoot},D=class{trees},$=class{boards},l=class{workbench},w={workbench:{boards:[{trees:[{rootId:0,openList:new Set,displayRoot:6}]},{trees:[{rootId:0,openList:new Set,displayRoot:6}]}]}};var v=class extends o{static style=`
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
	`};v.register("nerd-action");var h=32,a=6,P=h+a,U=640;function B(r){return r*P+h+U-a}var E=class extends o{static style=`
		vertigo-tree {
			display: block;
			padding-right: ${a}px;
		}
	`;config;treeRoot;rootNode;Render(e,t,n){return this.config=e,this.treeRoot=t,e.displayRoot!==void 0&&(e.rootId=n.id,e.openList=new Set,e.displayRoot>0&&n.collectToDepth(e.displayRoot-1,e.openList),delete e.displayRoot,t=n,this.treeRoot=t),this.innerHTML="",this.addEventListener("vertigo:change",()=>this.updateWidth()),this.rootNode=s("vertigo-node"),this.rootNode.Render(t,this.config,0),this.appendChild(this.rootNode),this.updateWidth(),this}updateWidth(){requestAnimationFrame(()=>{let e=this.rootNode.displayDepth(),t=B(e),n=(this.parentElement?.clientWidth||0)-a;console.log(`clientWidth: ${n}px`);let i=Math.max(t,n);this.style.width=`${i}px`})}},T=class extends o{static style=`
		vertigo-open {
			display: flex;
			align-items: center;
			justify-content: center;
			width: ${h}px;
			background-color: #666;
			cursor: pointer;
			user-select: none;
		}
	`},x=class extends o{static style=`
		vertigo-sidebar {
			display: block;
			width: ${h}px;
			background-color: #666;
		}
	`},k=class extends o{static style=`
		vertigo-header {
			display: block;
			background-color: #999;
			padding: 0.25em;
		}
	`},L=class extends o{static style=`
		vertigo-node {
			display: grid;
			grid-template-columns: ${h}px 1fr;
			margin: ${a}px 0 0 ${a}px;
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
	`;te;cfg;depth;childElements=[];Render(e,t,n){this.te=e,this.cfg=t,this.depth=n,this.childElements=[],this.innerHTML="";let i=t.openList.has(e.id),d=i?e.children.length:0,u=s("vertigo-open");u.textContent=i?"\u25CB":"\u25CF",this.appendChild(u),u.onclick=()=>{t.openList.has(e.id)?t.openList.delete(e.id):t.openList.add(e.id),this.Render(e,t,n),this.dispatchEvent(new CustomEvent("vertigo:change",{bubbles:!0}))};let A=s("vertigo-header");if(A.textContent=e.name,this.appendChild(A),i&&d>0){let p=s("vertigo-sidebar");p.style.gridRow=`2 / span ${d}`,this.appendChild(p)}if(i)for(let p of e.children){let g=s("vertigo-node");g.Render(p,t,n+1),this.childElements.push(g),this.appendChild(g)}}displayDepth(){let e=this.depth;if(this.cfg.openList.has(this.te.id))for(let t of this.childElements){let n=t.displayDepth();e=Math.max(e,n)}return e}};E.register("vertigo-tree"),T.register("vertigo-open"),x.register("vertigo-sidebar"),k.register("vertigo-header"),L.register("vertigo-node");var c,C=class extends o{static style=`
		nerd-board {
			display: block;
			background: #555;
			color: #ccc;
			overflow: auto;
		}
	`;config;Render(e){this.config=e,this.innerHTML="";for(let t of e.trees){let n=s("vertigo-tree");n.Render(t,c.displayRoot,c.displayRoot),this.appendChild(n)}}},S=class r extends o{static style=`
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
	`;logoutButton;connectedCallback(){this.innerHTML=r.html,this.logoutButton=this.Query(".logout"),this.logoutButton.addEventListener("click",()=>this.logout())}async logout(){try{await f(6,{}),c.SwitchToAuth()}catch(e){console.error("Logout failed:",e)}}},M=class r extends o{static style=`
		nerd-footer {
			display: block;
			background: #222;
			color: white;
			padding: 1rem;
			text-align: center;
		}
	`;static html=`
		Footer
	`;connectedCallback(){this.innerHTML=r.html}},R=class r extends o{static style=`
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
	`;config;boardElements=[];connectedCallback(){this.innerHTML=r.html,this.boardElements=[this.Query("nerd-board.board_0"),this.Query("nerd-board.board_1")]}Render(e){this.config=e;for(let t=0;t<this.boardElements.length;t++)this.boardElements[t].Render(e.boards[t])}},I=class r extends o{static style=`
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
	`;regmode=!1;login;register;error;loginToggle;registerToggle;connectedCallback(){this.innerHTML=r.html,this.login=this.Query(".login"),this.register=this.Query(".register"),this.error=this.Query(".error"),this.loginToggle=this.login.querySelector(".toggle"),this.registerToggle=this.register.querySelector(".toggle"),this.login.addEventListener("submit",e=>this.handleSubmit(e,!1)),this.register.addEventListener("submit",e=>this.handleSubmit(e,!0)),this.loginToggle.addEventListener("click",()=>this.toggleMode()),this.registerToggle.addEventListener("click",()=>this.toggleMode())}toggleMode(){this.regmode=!this.regmode,this.login.classList.toggle("hidden"),this.register.classList.toggle("hidden")}async handleSubmit(e,t){e.preventDefault();let n=new FormData(e.target),i=Object.fromEntries(n);try{let d=await f(t?5:4,i);c.SwitchToWorkbench(d.userid)}catch(d){this.showError(d instanceof Error?d.message:"Network error. Please try again.")}}showError(e){this.error.textContent=e}},H=class r extends o{static style=`
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
	`;userId=0;admin=!1;state=new l;displayRoot=null;auth=s("nerd-auth");workbench;connectedCallback(){this.userId=parseInt(this.getAttribute("userid"),10),this.admin=this.getAttribute("admin")==="true",b.userId=this.userId,b.admin=this.admin,c=this,window.addEventListener("nerd:unauthorized",()=>this.SwitchToAuth()),this.innerHTML=r.html,this.workbench=this.Query("nerd-workbench"),this.userId===0?this.SwitchToAuth():this.SwitchToWorkbench(this.userId)}SwitchToAuth(){this.userId=0,this.displayRoot=null,this.state=new l,this.workbench.classList.add("hidden"),this.appendChild(this.auth)}SwitchToWorkbench(e){this.userId=e,this.workbench.classList.remove("hidden"),this.auth.remove(),this.init()}async init(){try{await this.buildNodeTree(),this.state.workbench=w.workbench,this.workbench.Render(w.workbench)}catch(e){console.error("Failed to initialize workbench:",e)}}async buildNodeTree(){let e=this.admin?1:this.userId,t=await N(e);console.log("TreeEntry received:",t),this.displayRoot=m.init(t)}};C.register("nerd-board"),S.register("nerd-header"),M.register("nerd-footer"),R.register("nerd-workbench"),I.register("nerd-auth"),H.register("nerd-gui");
//# sourceMappingURL=gui.js.map
