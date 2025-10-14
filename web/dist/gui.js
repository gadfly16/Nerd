var l=new Map,m=class r{id;name;children;parent=null;constructor(e,t,n=[]){this.id=e,this.name=t,this.children=n}static init(e,t=null){let n=new r(e.nodeId,e.name,[]);return n.parent=t,l.set(n.id,n),e.children&&(n.children=e.children.map(o=>r.init(o,n))),n}collectToDepth(e,t){if(t.add(this.id),e>0)for(let n of this.children)n.collectToDepth(e-1,t)}},f={userId:0,admin:!1},i=class extends HTMLElement{static style="";static register(e){let t=document.createElement("style");t.textContent=this.style,document.head.appendChild(t),customElements.define(e,this)}Query(e){return this.querySelector(e)}Listen(e,t,n){this.addEventListener(e,t,n)}};async function Q(r,e,t={}){let n=await fetch("/api",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:r,targetId:e,payload:t})});if(!n.ok)throw n.status===401&&window.dispatchEvent(new CustomEvent("nerd:unauthorized")),new Error(await n.text()||"Request failed");return await n.json()}async function b(r,e){let t=await fetch("/auth",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:r,payload:e})});if(!t.ok)throw new Error(await t.text()||"Request failed");return await t.json()}async function R(r){return await Q(0,r)}function d(r){return document.createElement(r)}var A=class{rootId;openMap},N=class{trees},W=class{boards},c=class{workbench},v={workbench:{boards:[{trees:[{rootId:1,openMap:new Map([[1,6]])}]},{trees:[{rootId:4,openMap:new Map([[4,2]])}]}]}};var w=class extends i{static style=`
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
	`};w.register("nerd-action");var p=28,a=6,q=p+a,P=640;function U(r){return r*q+p+P-a}var E=class extends i{static style=`
		vertigo-tree {
			display: block;
			padding-right: ${a}px;
		}
	`;config;root;rootElem;resizeObs;connectedCallback(){this.resizeObs=new ResizeObserver(()=>{this.updateWidth()})}disconnectedCallback(){this.resizeObs?.disconnect()}Render(e,t){this.config=e,e.rootId===0&&(e.rootId=t.id);let n=l.get(e.rootId);if(!n)throw new Error(`TreeEntry with id ${e.rootId} not found in registry`);this.root=n;let o=e.openMap.get(e.rootId)??0;return this.innerHTML="",this.addEventListener("vertigo:change",()=>this.updateWidth()),this.rootElem=d("vertigo-node"),this.appendChild(this.rootElem),this.rootElem.Render(n,this.config,0,o),this.parentElement&&this.resizeObs.observe(this.parentElement),this}updateWidth(){let e=this.rootElem.displayDepth(),t=U(e),n=(this.parentElement?.clientWidth||0)-a,o=Math.max(t,n);this.style.width=`${o}px`}},x=class extends i{static style=`
		vertigo-open {
			display: flex;
			align-items: center;
			justify-content: center;
			width: ${p}px;
			background-color: #666;
			cursor: pointer;
			user-select: none;
			font-size: 0.66em;
			color: #bbb;
		}
	`},T=class extends i{static style=`
		vertigo-sidebar {
			display: block;
			width: ${p}px;
			background-color: #666;
		}
	`},k=class extends i{static style=`
		vertigo-header {
			display: block;
			background-color: #999;
			padding: 0.2ch;
			padding-left: 0.5ch;
			color: #666;
			font-size: 1.2em;
			font-weight: 500;
			}
	`},C=class r extends i{static style=`
		vertigo-node {
			display: grid;
			grid-template-columns: ${p}px 1fr;
			grid-template-rows: auto 1fr;
			margin: ${a}px 0 0 ${a}px;
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
	`;te;cfg;depth;parentDispDepth;childElems=[];open;header;sidebar;childrenElem;connectedCallback(){this.innerHTML=r.html,this.open=this.Query("vertigo-open"),this.header=this.Query("vertigo-header"),this.sidebar=this.Query("vertigo-sidebar"),this.childrenElem=this.Query(".children"),this.open.onclick=()=>this.toggleOpen()}dispDepth(){let e=this.cfg.openMap.get(this.te.id);return e!==void 0?e===0?0:e===-1?-1:Math.max(e,this.parentDispDepth-1):this.parentDispDepth===-1?-1:this.parentDispDepth>0?this.parentDispDepth-1:0}Render(e,t,n,o){this.te=e,this.cfg=t,this.depth=n,this.parentDispDepth=o;let s=this.dispDepth(),O=s!==0,h=this.cfg.openMap.get(this.te.id);if(h!==void 0&&h>0?h===-1?this.open.textContent="\u24BE":h<=9?this.open.textContent=String.fromCharCode(9312+h-1):this.open.textContent="\u24C2":this.open.textContent=O?"\u25EF":"\u2B24",this.header.textContent=e.name,O){this.childElems.length===0&&this.createChildren();for(let g=0;g<this.childElems.length;g++)this.childElems[g].Render(this.te.children[g],this.cfg,this.depth+1,s)}else this.childElems.length>0&&this.clearChildren()}toggleOpen(){this.dispDepth()!==0?this.cfg.openMap.set(this.te.id,0):this.cfg.openMap.set(this.te.id,1),this.Render(this.te,this.cfg,this.depth,this.parentDispDepth),this.dispatchEvent(new CustomEvent("vertigo:change",{bubbles:!0}))}createChildren(){for(let e of this.te.children){let t=d("vertigo-node");this.childrenElem.appendChild(t),this.childElems.push(t)}}clearChildren(){for(let e of this.childElems)e.remove();this.childElems=[]}displayDepth(){let e=this.depth;if(this.childElems.length>0)for(let t of this.childElems){let n=t.displayDepth();e=Math.max(e,n)}return e}};E.register("vertigo-tree"),x.register("vertigo-open"),T.register("vertigo-sidebar"),k.register("vertigo-header"),C.register("vertigo-node");var u,L=class extends i{static style=`
		nerd-board {
			display: block;
			background: #555;
			color: #ccc;
			overflow: auto;
		}
	`;config;Render(e){this.config=e,this.innerHTML="";for(let t of e.trees){let n=d("vertigo-tree");this.appendChild(n),n.Render(t,u.dispRoot)}}},M=class r extends i{static style=`
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
	`;logoutButton;connectedCallback(){this.innerHTML=r.html,this.logoutButton=this.Query(".logout"),this.logoutButton.addEventListener("click",()=>this.logout())}async logout(){try{await b(6,{}),u.SwitchToAuth()}catch(e){console.error("Logout failed:",e)}}},D=class r extends i{static style=`
		nerd-footer {
			display: block;
			background: #222;
			color: white;
			padding: 1rem;
			text-align: center;
		}
	`;static html=`
		Footer
	`;connectedCallback(){this.innerHTML=r.html}},I=class r extends i{static style=`
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
	`;regmode=!1;login;register;error;loginToggle;registerToggle;connectedCallback(){this.innerHTML=r.html,this.login=this.Query(".login"),this.register=this.Query(".register"),this.error=this.Query(".error"),this.loginToggle=this.login.querySelector(".toggle"),this.registerToggle=this.register.querySelector(".toggle"),this.login.addEventListener("submit",e=>this.handleSubmit(e,!1)),this.register.addEventListener("submit",e=>this.handleSubmit(e,!0)),this.loginToggle.addEventListener("click",()=>this.toggleMode()),this.registerToggle.addEventListener("click",()=>this.toggleMode())}toggleMode(){this.regmode=!this.regmode,this.login.classList.toggle("hidden"),this.register.classList.toggle("hidden")}async handleSubmit(e,t){e.preventDefault();let n=new FormData(e.target),o=Object.fromEntries(n);try{let s=await b(t?5:4,o);u.SwitchToWorkbench(s.userid)}catch(s){this.showError(s instanceof Error?s.message:"Network error. Please try again.")}}showError(e){this.error.textContent=e}},H=class r extends i{static style=`
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
	`;userId=0;admin=!1;state=new c;dispRoot=null;auth=d("nerd-auth");workbench;connectedCallback(){this.userId=parseInt(this.getAttribute("userid"),10),this.admin=this.getAttribute("admin")==="true",f.userId=this.userId,f.admin=this.admin,u=this,window.addEventListener("nerd:unauthorized",()=>this.SwitchToAuth()),this.innerHTML=r.html,this.workbench=this.Query("nerd-workbench"),this.userId===0?this.SwitchToAuth():this.SwitchToWorkbench(this.userId)}SwitchToAuth(){this.userId=0,this.dispRoot=null,this.state=new c,l.clear(),this.workbench.classList.add("hidden"),this.appendChild(this.auth)}SwitchToWorkbench(e){this.userId=e,this.workbench.classList.remove("hidden"),this.auth.remove(),this.init()}async init(){try{await this.buildNodeTree(),this.state.workbench=v.workbench,this.workbench.Render(v.workbench)}catch(e){console.error("Failed to initialize workbench:",e)}}async buildNodeTree(){let e=this.admin?1:this.userId,t=await R(e);console.log("TreeEntry received:",t),this.dispRoot=m.init(t)}};L.register("nerd-board"),M.register("nerd-header"),D.register("nerd-footer"),I.register("nerd-workbench"),S.register("nerd-auth"),H.register("nerd-gui");
//# sourceMappingURL=gui.js.map
