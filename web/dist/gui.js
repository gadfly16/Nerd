var k=(i=>(i[i.GetTree=0]="GetTree",i[i.CreateChild=1]="CreateChild",i[i.RenameChild=2]="RenameChild",i[i.Shutdown=3]="Shutdown",i[i.AuthenticateUser=4]="AuthenticateUser",i[i.CreateUser=5]="CreateUser",i[i.Logout=6]="Logout",i))(k||{});async function L(n,e,t={}){let r=await fetch("/api",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:n,targetId:e,payload:t})});if(!r.ok)throw new Error(await r.text()||"Request failed");return await r.json()}async function c(n,e){let t=await fetch("/auth",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:n,payload:e})});if(!t.ok)throw new Error(await t.text()||"Request failed");return await t.json()}var E=/^\s+|\s+$|(?<=\>)\s+(?=\<)/gm;function u(n){let e=document.createElement("template");return e.innerHTML=n.replace(E,""),e.content.firstElementChild}var s=class extends HTMLElement{static style="";static register(e){let t=document.createElement("style");t.textContent=this.style,document.head.appendChild(t),customElements.define(e,this)}};var m=class extends s{static style=`
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
	`};m.register("nerd-action");var p=class n{id;name;parent;children;element;constructor(e,t,r=null){this.id=e,this.name=t,this.parent=r,this.children=[],this.element=null}addChild(e,t){let r=new n(e,t,this);return this.children.push(r),r}render(e,t){if(this.element||(this.element=u(`<div class="nerd-entity">${this.name}</div>`)),e.appendChild(this.element),!t.stopList.has(this.id)){let r=u('<div class="nerd-children"></div>');this.element.appendChild(r);for(let a of this.children)a.render(r,t)}}},g=class{stopList;constructor(){this.stopList=new Map}},h=class{root;config;constructor(e){this.root=e,this.config=new g}render(e){this.root.render(e,this.config)}},d=class{trees;constructor(){this.trees=[]}addTree(e){this.trees.push(e)}},f=class n extends s{static style=`
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
	`;connectedCallback(){this.innerHTML=n.html,this.querySelector(".logout").addEventListener("click",()=>this.logout())}async logout(){try{await c(6,{}),l.userId=0,l.updateAuthState()}catch(e){console.error("Logout failed:",e)}}},b=class n extends s{static style=`
		nerd-footer {
			display: block;
			background: #2c3e50;
			color: white;
			padding: 1rem;
			text-align: center;
		}
	`;static html=`
		Footer
	`;connectedCallback(){this.innerHTML=n.html}},w=class n extends s{static style=`
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

		nerd-workbench .board.left {
			grid-area: left;
			border: 1px solid #ddd;
		}

		nerd-workbench .board.right {
			grid-area: right;
			border: 1px solid #ddd;
		}

		nerd-workbench nerd-footer {
			grid-area: footer;
		}
	`;static html=`
		<nerd-header></nerd-header>
		<div class="board left"></div>
		<div class="board right"></div>
		<nerd-footer></nerd-footer>
	`;boards=[];leftContainer;rightContainer;connectedCallback(){this.innerHTML=n.html,this.leftContainer=this.querySelector(".board.left"),this.rightContainer=this.querySelector(".board.right"),this.boards=[new d,new d]}renderBoards(){this.leftContainer.innerHTML="",this.rightContainer.innerHTML="";for(let e of this.boards[0].trees)e.render(this.leftContainer);for(let e of this.boards[1].trees)e.render(this.rightContainer)}},y=class n extends s{static style=`
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
	`;regmode=!1;login=void 0;register=void 0;error=void 0;connectedCallback(){this.innerHTML=n.html,this.login=this.querySelector(".login"),this.register=this.querySelector(".register"),this.error=this.querySelector(".error"),this.attachEventListeners()}attachEventListeners(){this.login.addEventListener("submit",e=>this.handleSubmit(e,!1)),this.register.addEventListener("submit",e=>this.handleSubmit(e,!0)),this.login.querySelector(".toggle").addEventListener("click",()=>this.toggleMode()),this.register.querySelector(".toggle").addEventListener("click",()=>this.toggleMode())}toggleMode(){this.regmode=!this.regmode,this.login.classList.toggle("hidden"),this.register.classList.toggle("hidden")}async handleSubmit(e,t){e.preventDefault();let r=new FormData(e.target),a=Object.fromEntries(r);try{let o=await c(t?5:4,a);l.userId=o.userid,l.updateAuthState()}catch(o){this.showError(o instanceof Error?o.message:"Network error. Please try again.")}}showError(e){this.error.textContent=e}},v=class n extends s{static style=`
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
	`;userId=0;admin=!1;auth=document.createElement("nerd-auth");nodes=new Map;rootNode=null;connectedCallback(){this.userId=parseInt(this.getAttribute("userid"),10),this.admin=this.getAttribute("admin")==="true",l=this,this.innerHTML=n.html,this.updateAuthState()}updateAuthState(){let e=this.querySelector("nerd-workbench");if(this.userId===0){if(this.nodes.clear(),this.rootNode=null,e){let t=e;t.boards=[new d,new d]}e.classList.add("hidden"),this.appendChild(this.auth)}else e.classList.remove("hidden"),this.auth.remove(),this.initWorkbench()}async initWorkbench(){try{let e=await this.getTree();console.log("TreeEntry received:",e),this.buildNodeTree(e),this.setupDefaultView()}catch(e){console.error("Failed to initialize workbench:",e)}}async getTree(){let e=this.admin?1:this.userId;return await L(0,e)}buildNodeTree(e,t=null){let r=new p(e.nodeId,e.name,t);if(this.nodes.set(r.id,r),t===null?this.rootNode=r:t.children.push(r),e.children)for(let a of e.children)this.buildNodeTree(a,r);return r}setupDefaultView(){if(!this.rootNode)return;let e=this.querySelector("nerd-workbench");if(!e)return;let t=this.admin?this.rootNode:this.nodes.get(this.userId);if(!t)return;let r=new h(t);for(let o of t.children)r.config.stopList.set(o.id,o);e.boards[0].addTree(r);let a=new h(t);for(let o of t.children)a.config.stopList.set(o.id,o);e.boards[1].addTree(a),e.renderBoards()}},l;f.register("nerd-header"),b.register("nerd-footer"),w.register("nerd-workbench"),y.register("nerd-auth"),v.register("nerd-gui");
//# sourceMappingURL=gui.js.map
