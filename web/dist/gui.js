var p=class r{id;name;parent;children;constructor(e,t,n=null){this.id=e,this.name=t,this.parent=n,this.children=[]}addChild(e,t){let n=new r(e,t,this);return this.children.push(n),n}collectToDepth(e,t){if(t.add(this.id),e>0)for(let n of this.children)n.collectToDepth(e-1,t)}},g={userId:0,admin:!1},o=class extends HTMLElement{static style="";static register(e){let t=document.createElement("style");t.textContent=this.style,document.head.appendChild(t),customElements.define(e,this)}Query(e){return this.querySelector(e)}Listen(e,t,n){this.addEventListener(e,t,n)}};async function P(r,e,t={}){let n=await fetch("/api",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:r,targetId:e,payload:t})});if(!n.ok)throw n.status===401&&window.dispatchEvent(new CustomEvent("nerd:unauthorized")),new Error(await n.text()||"Request failed");return await n.json()}async function b(r,e){let t=await fetch("/auth",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:r,payload:e})});if(!t.ok)throw new Error(await t.text()||"Request failed");return await t.json()}async function N(r){return await P(0,r)}function d(r){return document.createElement(r)}var D=class{rootId;openList;displayRoot},W=class{trees},q=class{boards},h=class{workbench},y={workbench:{boards:[{trees:[{rootId:0,openList:new Set,displayRoot:6}]},{trees:[{rootId:0,openList:new Set,displayRoot:6}]}]}};var w=class extends o{static style=`
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
	`};w.register("nerd-action");var F=32,v=6,B=F+v,G=640;function Q(r){return r*B+F+G-v}var x=class extends o{static style=`
		vertigo-tree {
			display: block;
			padding-right: 8px;
		}
	`;config;Render(e,t,n){this.config=e,e.displayRoot!==void 0&&(e.rootId=n.id,e.openList=new Set,e.displayRoot>0&&n.collectToDepth(e.displayRoot-1,e.openList),delete e.displayRoot,t=n),this.innerHTML="";let i=d("vertigo-node"),s=i.Render(t,this.config,0);return this.appendChild(i),requestAnimationFrame(()=>{let a=Q(s),l=(this.parentElement?.clientWidth||0)-v;console.log(`clientWidth: ${l}px`);let c=Math.max(a,l);this.style.width=`${c}px`}),this}},k=class extends o{static style=`
		vertigo-open {
			display: flex;
			align-items: center;
			justify-content: center;
			width: 32px;
			background-color: #666;
			cursor: pointer;
			user-select: none;
		}
	`},T=class extends o{static style=`
		vertigo-sidebar {
			display: block;
			width: 32px;
			background-color: #666;
		}
	`},E=class extends o{static style=`
		vertigo-header {
			display: block;
			background-color: #999;
			padding: 0.25em;
		}
	`},L=class extends o{static style=`
		vertigo-node {
			display: grid;
			grid-template-columns: 32px 1fr;
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
	`;Render(e,t,n){this.innerHTML="";let i=t.openList.has(e.id),s=i?e.children.length:0,a=d("vertigo-open");a.textContent=i?"\u25CB":"\u25CF",a.onclick=()=>{t.openList.has(e.id)?t.openList.delete(e.id):t.openList.add(e.id),this.Render(e,t,n)},this.appendChild(a);let l=d("vertigo-header");l.textContent=e.name,this.appendChild(l);let c=n;if(i&&s>0){let m=d("vertigo-sidebar");m.style.gridRow=`2 / span ${s}`,this.appendChild(m)}if(i)for(let m of e.children){let A=d("vertigo-node"),j=A.Render(m,t,n+1);c=Math.max(c,j),this.appendChild(A)}return c}};x.register("vertigo-tree"),k.register("vertigo-open"),T.register("vertigo-sidebar"),E.register("vertigo-header"),L.register("vertigo-node");var u,C=class extends o{static style=`
		nerd-board {
			display: block;
			background: #555;
			color: #ccc;
			overflow: auto;
		}
	`;config;Render(e){this.config=e,this.innerHTML="";for(let t of e.trees){let n=u.nodes.get(t.rootId),i=d("vertigo-tree");i.Render(t,n,u.displayRoot),this.appendChild(i)}}},M=class r extends o{static style=`
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
	`;logoutButton;connectedCallback(){this.innerHTML=r.html,this.logoutButton=this.Query(".logout"),this.logoutButton.addEventListener("click",()=>this.logout())}async logout(){try{await b(6,{}),u.SwitchToAuth()}catch(e){console.error("Logout failed:",e)}}},S=class r extends o{static style=`
		nerd-footer {
			display: block;
			background: #222;
			color: white;
			padding: 1rem;
			text-align: center;
		}
	`;static html=`
		Footer
	`;connectedCallback(){this.innerHTML=r.html}},I=class r extends o{static style=`
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
	`;config;boardElements=[];connectedCallback(){this.innerHTML=r.html,this.boardElements=[this.Query("nerd-board.board_0"),this.Query("nerd-board.board_1")]}Render(e){this.config=e;for(let t=0;t<this.boardElements.length;t++)this.boardElements[t].Render(e.boards[t])}},R=class r extends o{static style=`
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
	`;regmode=!1;login;register;error;loginToggle;registerToggle;connectedCallback(){this.innerHTML=r.html,this.login=this.Query(".login"),this.register=this.Query(".register"),this.error=this.Query(".error"),this.loginToggle=this.login.querySelector(".toggle"),this.registerToggle=this.register.querySelector(".toggle"),this.login.addEventListener("submit",e=>this.handleSubmit(e,!1)),this.register.addEventListener("submit",e=>this.handleSubmit(e,!0)),this.loginToggle.addEventListener("click",()=>this.toggleMode()),this.registerToggle.addEventListener("click",()=>this.toggleMode())}toggleMode(){this.regmode=!this.regmode,this.login.classList.toggle("hidden"),this.register.classList.toggle("hidden")}async handleSubmit(e,t){e.preventDefault();let n=new FormData(e.target),i=Object.fromEntries(n);try{let s=await b(t?5:4,i);u.SwitchToWorkbench(s.userid)}catch(s){this.showError(s instanceof Error?s.message:"Network error. Please try again.")}}showError(e){this.error.textContent=e}},H=class r extends o{static style=`
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
	`;userId=0;admin=!1;state=new h;nodes=new Map;displayRoot=null;auth=d("nerd-auth");workbench;connectedCallback(){this.userId=parseInt(this.getAttribute("userid"),10),this.admin=this.getAttribute("admin")==="true",g.userId=this.userId,g.admin=this.admin,u=this,window.addEventListener("nerd:unauthorized",()=>this.SwitchToAuth()),this.innerHTML=r.html,this.workbench=this.Query("nerd-workbench"),this.userId===0?this.SwitchToAuth():this.SwitchToWorkbench(this.userId)}SwitchToAuth(){this.userId=0,this.nodes.clear(),this.displayRoot=null,this.state=new h,this.workbench.classList.add("hidden"),this.appendChild(this.auth)}SwitchToWorkbench(e){this.userId=e,this.workbench.classList.remove("hidden"),this.auth.remove(),this.init()}async init(){try{await this.buildNodeTree(),this.state.workbench=y.workbench,this.workbench.Render(y.workbench)}catch(e){console.error("Failed to initialize workbench:",e)}}async buildNodeTree(){let e=this.admin?1:this.userId,t=await N(e);console.log("TreeEntry received:",t),this.buildNodes(t,null)}buildNodes(e,t){let n=new p(e.nodeId,e.name,t);if(this.nodes.set(n.id,n),t===null?this.displayRoot=n:t.children.push(n),e.children)for(let i of e.children)this.buildNodes(i,n);return n}};C.register("nerd-board"),M.register("nerd-header"),S.register("nerd-footer"),I.register("nerd-workbench"),R.register("nerd-auth"),H.register("nerd-gui");
//# sourceMappingURL=gui.js.map
