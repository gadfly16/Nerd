var h=new Map,g=class r{id;name;children;parent=null;constructor(e,t,i=[]){this.id=e,this.name=t,this.children=i}static init(e,t=null){let i=new r(e.nodeId,e.name,[]);return i.parent=t,h.set(i.id,i),e.children&&(i.children=e.children.map(s=>r.init(s,i))),i}collectToDepth(e,t){if(t.add(this.id),e>0)for(let i of this.children)i.collectToDepth(e-1,t)}},u={userId:0,admin:!1},n=class extends HTMLElement{static style="";static register(e){let t=document.createElement("style");t.textContent=this.style,document.head.appendChild(t),customElements.define(e,this)}Query(e){return this.querySelector(e)}Listen(e,t,i){this.addEventListener(e,t,i)}};async function z(r,e,t={}){let i=await fetch("/api",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:r,targetId:e,payload:t})});if(!i.ok)throw i.status===401&&window.dispatchEvent(new CustomEvent("nerd:unauthorized")),new Error(await i.text()||"Request failed");return await i.json()}async function f(r,e){let t=await fetch("/auth",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:r,payload:e})});if(!t.ok)throw new Error(await t.text()||"Request failed");return await t.json()}async function H(r){return await z(0,r)}function d(r){return document.createElement(r)}var R=class{rootId;openMap},O=class{trees},A=class{boards},l=class{workbench},y={workbench:{boards:[{trees:[{rootId:1,openMap:{1:{open:!0,depth:6}}}]},{trees:[{rootId:4,openMap:{4:{open:!0,depth:2}}}]}]}};var v=class extends n{static style=`
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
	`};v.register("nerd-action");var c=28,a=6,$=c+a,q=640;function P(r){return r*$+c+q-a}var E=class extends n{static style=`
		vertigo-tree {
			display: block;
			padding-right: ${a}px;
		}
	`;config;root;rootElem;resizeObs;connectedCallback(){this.resizeObs=new ResizeObserver(()=>{this.updateWidth()})}disconnectedCallback(){this.resizeObs?.disconnect()}Render(e,t){this.config=e,e.rootId===0&&(e.rootId=t.id);let i=h.get(e.rootId);if(!i)throw new Error(`TreeEntry with id ${e.rootId} not found in registry`);return this.root=i,this.innerHTML="",this.addEventListener("vertigo:change",()=>this.updateWidth()),this.rootElem=d("vertigo-node"),this.appendChild(this.rootElem),this.rootElem.Render(i,this.config,0,0),this.parentElement&&this.resizeObs.observe(this.parentElement),this}updateWidth(){let e=this.rootElem.displayDepth(),t=P(e),i=(this.parentElement?.clientWidth||0)-a,s=Math.max(t,i);this.style.width=`${s}px`}},w=class extends n{static style=`
		vertigo-open {
			display: flex;
			align-items: center;
			justify-content: center;
			width: ${c}px;
			background-color: #666;
			cursor: pointer;
			user-select: none;
			font-size: 0.66em;
			color: #bbb;
		}
	`},x=class extends n{static style=`
		vertigo-sidebar {
			display: block;
			width: ${c}px;
			background-color: #666;
		}
	`},T=class extends n{static style=`
		vertigo-header {
			display: block;
			background-color: #999;
			padding: 0.2ch;
			padding-left: 0.5ch;
			color: #666;
			font-size: 1.2em;
			font-weight: 500;
		}

		vertigo-header .name {
			position: sticky;
			left: 0.5ch;
			display: inline-block;
			background-color: #999;
		}
	`},k=class r extends n{static style=`
		vertigo-node {
			display: grid;
			grid-template-columns: ${c}px 1fr;
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
		<vertigo-header><span class="name"></span></vertigo-header>
		<vertigo-sidebar></vertigo-sidebar>
		<div class="details">
			<div class="children"></div>
		</div>
	`;te;cfg;depth;inheritedDispDepth;childElems=[];open;header;nameElem;sidebar;childrenElem;connectedCallback(){this.innerHTML=r.html,this.open=this.Query("vertigo-open"),this.header=this.Query("vertigo-header"),this.nameElem=this.Query(".name"),this.sidebar=this.Query("vertigo-sidebar"),this.childrenElem=this.Query(".children"),this.open.onclick=e=>{e.shiftKey&&e.ctrlKey?this.toggleInfinity():e.shiftKey?this.incrementDepth():e.ctrlKey?this.makeNeutral():this.toggleOpen()}}isOpen(){let e=this.cfg.openMap[this.te.id];return e===void 0?this.inheritedDispDepth!==0:e.open}childrenDepth(){let e=this.cfg.openMap[this.te.id],t;return e===void 0?t=this.inheritedDispDepth:e.depth>0||e.depth===-1?t=e.depth:t=this.inheritedDispDepth,t===-1?-1:t-1}Render(e,t,i,s){this.te=e,this.cfg=t,this.depth=i,this.inheritedDispDepth=s;let o=this.cfg.openMap[this.te.id];if(o!==void 0&&o.open&&o.depth>0&&o.depth<=9?this.open.textContent=String.fromCharCode(9312+o.depth-1):o!==void 0&&o.open&&o.depth===-1?this.open.textContent="\u24BE":this.open.textContent=this.isOpen()?"\u25EF":"\u2B24",this.nameElem.textContent=e.name,this.isOpen()){this.childElems.length===0&&this.createChildren();let N=this.childrenDepth();for(let p=0;p<this.childElems.length;p++)this.childElems[p].Render(this.te.children[p],this.cfg,this.depth+1,N)}else this.childElems.length>0&&this.clearChildren()}toggleOpen(){let e=this.cfg.openMap[this.te.id];e===void 0?this.inheritedDispDepth===0?this.cfg.openMap[this.te.id]={open:!0,depth:1}:this.cfg.openMap[this.te.id]={open:!1,depth:0}:e.open?e.open=!1:e.depth===0?delete this.cfg.openMap[this.te.id]:e.open=!0,this.Render(this.te,this.cfg,this.depth,this.inheritedDispDepth),this.dispatchEvent(new CustomEvent("vertigo:change",{bubbles:!0}))}incrementDepth(){let e=this.cfg.openMap[this.te.id];e===void 0?this.cfg.openMap[this.te.id]={open:!0,depth:1}:e.depth>=1&&e.depth<9?(e.depth++,e.open=!0):(e.depth,e.depth=1,e.open=!0),this.Render(this.te,this.cfg,this.depth,this.inheritedDispDepth),this.dispatchEvent(new CustomEvent("vertigo:change",{bubbles:!0}))}makeNeutral(){let e=this.cfg.openMap[this.te.id];e!==void 0&&(e.open?delete this.cfg.openMap[this.te.id]:e.depth=0,this.Render(this.te,this.cfg,this.depth,this.inheritedDispDepth),this.dispatchEvent(new CustomEvent("vertigo:change",{bubbles:!0})))}toggleInfinity(){let e=this.cfg.openMap[this.te.id];e===void 0?this.cfg.openMap[this.te.id]={open:!0,depth:-1}:e.depth===-1?e.open?delete this.cfg.openMap[this.te.id]:e.depth=0:(e.depth=-1,e.open=!0),this.Render(this.te,this.cfg,this.depth,this.inheritedDispDepth),this.dispatchEvent(new CustomEvent("vertigo:change",{bubbles:!0}))}createChildren(){for(let e of this.te.children){let t=d("vertigo-node");this.childrenElem.appendChild(t),this.childElems.push(t)}}clearChildren(){for(let e of this.childElems)e.remove();this.childElems=[]}displayDepth(){let e=this.depth;if(this.childElems.length>0)for(let t of this.childElems){let i=t.displayDepth();e=Math.max(e,i)}return e}};E.register("vertigo-tree"),w.register("vertigo-open"),x.register("vertigo-sidebar"),T.register("vertigo-header"),k.register("vertigo-node");var m,C=class extends n{static style=`
		nerd-board {
			display: block;
			background: #555;
			color: #ccc;
			overflow: auto;
		}
	`;config;Render(e){this.config=e,this.innerHTML="";for(let t of e.trees){let i=d("vertigo-tree");this.appendChild(i),i.Render(t,m.dispRoot)}}},M=class r extends n{static style=`
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
	`;logoutButton;connectedCallback(){this.innerHTML=r.html,this.logoutButton=this.Query(".logout"),this.logoutButton.addEventListener("click",()=>this.logout())}async logout(){try{await f(6,{}),m.SwitchToAuth()}catch(e){console.error("Logout failed:",e)}}},L=class r extends n{static style=`
		nerd-footer {
			display: block;
			background: #222;
			color: white;
			padding: 1rem;
			text-align: center;
		}
	`;static html=`
		Footer
	`;connectedCallback(){this.innerHTML=r.html}},D=class r extends n{static style=`
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
	`;config;boardElements=[];connectedCallback(){this.innerHTML=r.html,this.boardElements=[this.Query("nerd-board.board_0"),this.Query("nerd-board.board_1")]}Render(e){this.config=e;for(let t=0;t<this.boardElements.length;t++)this.boardElements[t].Render(e.boards[t])}},I=class r extends n{static style=`
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
	`;regmode=!1;login;register;error;loginToggle;registerToggle;connectedCallback(){this.innerHTML=r.html,this.login=this.Query(".login"),this.register=this.Query(".register"),this.error=this.Query(".error"),this.loginToggle=this.login.querySelector(".toggle"),this.registerToggle=this.register.querySelector(".toggle"),this.login.addEventListener("submit",e=>this.handleSubmit(e,!1)),this.register.addEventListener("submit",e=>this.handleSubmit(e,!0)),this.loginToggle.addEventListener("click",()=>this.toggleMode()),this.registerToggle.addEventListener("click",()=>this.toggleMode())}toggleMode(){this.regmode=!this.regmode,this.login.classList.toggle("hidden"),this.register.classList.toggle("hidden")}async handleSubmit(e,t){e.preventDefault();let i=new FormData(e.target),s=Object.fromEntries(i);try{let o=await f(t?5:4,s);m.SwitchToWorkbench(o.userid)}catch(o){this.showError(o instanceof Error?o.message:"Network error. Please try again.")}}showError(e){this.error.textContent=e}},S=class r extends n{static style=`
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
	`;userId=0;admin=!1;state=new l;dispRoot=null;auth=d("nerd-auth");workbench;connectedCallback(){this.userId=parseInt(this.getAttribute("userid"),10),this.admin=this.getAttribute("admin")==="true",u.userId=this.userId,u.admin=this.admin,m=this,window.addEventListener("nerd:unauthorized",()=>this.SwitchToAuth()),this.innerHTML=r.html,this.workbench=this.Query("nerd-workbench"),this.userId===0?this.SwitchToAuth():this.SwitchToWorkbench(this.userId)}SwitchToAuth(){this.userId=0,this.dispRoot=null,this.state=new l,h.clear(),this.workbench.classList.add("hidden"),this.appendChild(this.auth)}SwitchToWorkbench(e){this.userId=e,this.workbench.classList.remove("hidden"),this.auth.remove(),this.init()}async init(){try{await this.buildNodeTree(),this.state.workbench=y.workbench,this.workbench.Render(y.workbench)}catch(e){console.error("Failed to initialize workbench:",e)}}async buildNodeTree(){let e=this.admin?1:this.userId,t=await H(e);console.log("TreeEntry received:",t),this.dispRoot=g.init(t)}};C.register("nerd-board"),M.register("nerd-header"),L.register("nerd-footer"),D.register("nerd-workbench"),I.register("nerd-auth"),S.register("nerd-gui");
//# sourceMappingURL=gui.js.map
