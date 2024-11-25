<script>
	export let data;
	export let mode = "safe";
	export const prerender = true;
	import Card from "../Card.svelte";
	import PriorityQueue from "$lib/PriorityQueue.js";
	import EditSidebar from "./EditSidebar.svelte";
	import SubmissionDialogue from "./SubmissionDialogue.svelte";
	import {onMount} from "svelte"
	import addSiteIcon from "$lib/img/add-site.svg";
	import trashIcon from "$lib/img/trash.svg";
	
	let showRestrictedInEditMode = false;
	let showDeadCheckbox = false;

	$: showRestricted = mode == "all" || showRestrictedInEditMode;
	$: showDead = mode == "edit" || showDeadCheckbox;
	let navEl = null;
	let mainEl = null;
	let oldScrollPosition = 0;
	let showNav = false;

	let inHeadingMode = false;
	let newHeadingText = "";
	let newHeadingTag = "h1";
	let approvalDialogueVisible = false;
	let approvalDialogueApprove = false;

	$: addButtonText = inHeadingMode ? "Add Heading" : "Add Site";


	let currentEdits = {
		sitelist: [],
		sites: {},
		version: "",
		comments: [],
	}

	let sitelist = data.sitelist;

	let siteOpenInSidebar = "";
	let newSiteInsertPosition = -1;

	if (mode == "edit")
	{
		currentEdits.sitelist = data.sitelist.slice();
		currentEdits.sites = JSON.parse(JSON.stringify(data.sites));

		//currentEdits.sitelist.splice(1,5);
		//data.sitelist.splice(21, 17);

		sitelist = computeDiff(data, currentEdits);
	}

	let openRevision = "current"


	onMount(function(){

		loadRevision();
	});

	async function loadRevision()
	{
		let query = window.location.search.substring(1);
		let params = query.split("&");

		for(let k of params)
		{
			let [a,b] = k.split("=")
			if(a == 'revision')
			{
				let rawResult = await fetch("/api/revision/"+b);
				let result = await rawResult.json();

				if(result && result.sitelist)
				{
					openRevision = decodeURIComponent(b);
					currentEdits.sitelist = result.sitelist;
					currentEdits.sites = result.sites;
					currentEdits.comments = result.comments;

					sitelist = computeDiff(data, currentEdits);
				}
			}
		}
	}


	function insertIndex(block)
	{
		if(block.op == "del")
			return block.editIndex;
		return block.editIndex+1
	}

	// implement this https://blog.jcoglan.com/2017/02/12/the-myers-diff-algorithm-part-1/
	function areEntriesEqual(entry1, entry2)
	{
		if(entry1.site && entry2.site)
			return entry1.site == entry2.site;
		
		if(entry1.tag && entry2.tag)
			return entry1.tag == entry2.tag && entry1.text == entry2.text;
		return false;
	}

	function computeDiff(baseVersion, currentEdits)
	{
		let worklist = new PriorityQueue();
		let fastestPaths = [];

		worklist.push({priority: 0, value: [0,0]})
		fastestPaths["0/0"] = {cost: 0, backtrack: null, op: "start"};


		function cost(i,j){
			if(fastestPaths[i + "/" + j] == undefined)
				return Infinity;
			return fastestPaths[i + "/" + j].cost;
		}

		while(true)
		{
			let {value: [i,j]} = worklist.pop();

			let curCost = fastestPaths[i + "/" + j].cost;
			let backtrack = i + "/" + j;

			if(i == baseVersion.sitelist.length && j == currentEdits.sitelist.length)
			{			
				break;
			}

			if(i < baseVersion.sitelist.length && j < currentEdits.sitelist.length && areEntriesEqual(baseVersion.sitelist[i], currentEdits.sitelist[j]) && curCost <= cost(i+1,j+1))
			{
				fastestPaths[(i+1)+"/"+(j+1)] = {cost: curCost , backtrack, op:"same"};
				worklist.push({priority: curCost, value:[i+1,j+1]});
			}

			if(i <= baseVersion.sitelist.length && curCost+1 <= cost(i+1,j))
			{
				fastestPaths[(i+1)+"/"+j] = {cost: curCost + 1, backtrack, op:"del"};
				worklist.push({priority: curCost+1, value:[i+1,j]});
			}

			if(j <= currentEdits.sitelist.length && curCost+1 < cost(i,j+1))
			{
				fastestPaths[i+"/"+(j+1)] = {cost: curCost + 1, backtrack, op:"ins"};
				worklist.push({priority: curCost+1, value:[i,j+1]});
			}
		}

		let at = baseVersion.sitelist.length	+ "/" + currentEdits.sitelist.length;
		let ops = [];

		while(at != "0/0")
		{
			ops.push(fastestPaths[at].op);
			at = fastestPaths[at].backtrack;
		}

		let combinedSiteList = [];
		let i = 0;
		let j = 0;

		while(ops.length)
		{
			let op = ops.pop();

			if(op == "ins")
			{
				combinedSiteList.push({...currentEdits.sitelist[j], op, editIndex:j});
				j++;
			}

			if(op == "same")
			{
				let newOp = "same"

				if(currentEdits.sitelist[j].site)
				{
					let site1 = currentEdits.sites[currentEdits.sitelist[j].site];
					let site2 = baseVersion.sites[baseVersion.sitelist[i].site];

					if(site1.updated != site2.updated || site1.protocol != site2.protocol)
					{
						newOp = "update";
					}

					for(let key of ["name","description","tags"])
					{
						if (site1[key] != site2[key])
						{
							newOp = "diff";
							break;
						}
					}

					
				}

				

				combinedSiteList.push({...currentEdits.sitelist[j], op: newOp, editIndex:j});
				//console.log(op	+ " - " + currentVersion.sitelist[j].site)
				i++;
				j++;

			}
			if (op == "del")
			{
				combinedSiteList.push({...baseVersion.sitelist[i], op, editIndex:j});
				//console.log(op	+ " - " + baseVersion.sitelist[i].site)
				i++;
			}
		}

		return combinedSiteList;
	}

	function removeIndexFromSites(block)
	{
		currentEdits.sitelist.splice(block.editIndex, 1)

		if(block.site)
		{
			let removeFromSites = true;
			for(let i = 0; i < currentEdits.sitelist.length; i++)
			{
				if(currentEdits.sitelist[i].site == block.site)
				{
					removeFromSites = false;
					break;
				}
			}
			if(removeFromSites)
			{
				delete currentEdits.sites[block.site]
			}

		}
		sitelist = computeDiff(data, currentEdits);
	}

	function addHeading()
	{
		currentEdits.sitelist.splice(newSiteInsertPosition, 0, {tag: newHeadingTag, text: newHeadingText});
		sitelist = computeDiff(data, currentEdits);
		newSiteInsertPosition = -1;
		siteOpenInSidebar = "";
	}

	function removeHeading(block)
	{
		currentEdits.sitelist.splice(block.editIndex, 1);
		sitelist = computeDiff(data, currentEdits);
	}

	function restoreSitelistItem(block)
	{
		console.log("running restore")

		let blockCopy = JSON.parse(JSON.stringify(block));
		delete blockCopy.op;
		delete blockCopy.editIndex

		currentEdits.sitelist.splice(block.editIndex, 0, blockCopy);

		if(block.site && !currentEdits.sites[block.site])
			currentEdits.sites[block.site] = data.sites[block.site];

		sitelist = computeDiff(data, currentEdits);

	}


	function closeSite(ev)
	{
		siteOpenInSidebar = "";
		approvalDialogueVisible = false;
		approvalDialogueApprove = false;
		
	}

	function saveSite(ev)
	{
		let originalLink = ev.detail.originalLink;
		delete ev.detail.originalLink;

		ev.detail.updated = new Date().toISOString().substring(0,10);

		currentEdits.sites[ev.detail.link] = ev.detail;

		if(newSiteInsertPosition != -1)
		{
			currentEdits.sitelist.splice(newSiteInsertPosition, 0, {site: ev.detail.link});
		}

		newSiteInsertPosition = -1;
		siteOpenInSidebar = "";

		sitelist = computeDiff(data, currentEdits);

		console.log(sitelist)
	}

	import menuICON from "$lib/img/hamburger-menu-icon.svg";

	function shouldShowSite(site, showDead, showRestricted, mode, op)
	{
		let tags = new Set(site.tags.split(","));

		console.log(op)

		if(mode == "edit" && op != "same")
			return true;


		if(tags.has("restricted") && !showRestricted)
			return false;

		if((tags.has("dead") || tags.has("redirect")) && !showDead)
			return false;

		return true;
	}

	function getHeadingAnchor(text)
	{
		text = text.trim();
		return text.replace(/[^A-Za-z0-9 ]/g,"").replace(/ +/g,"_")
	}

	function toggleTocView()
	{
		showNav = !showNav;

		let htmlTag = document.getElementsByTagName('html')[0];
		if(showNav)
		{
			oldScrollPosition = htmlTag.scrollTop;
			htmlTag.scrollTop = 0;
			mainEl.style.display = "none";

		}
		else {
			mainEl.style.display = "block";
			setTimeout(() => {
				htmlTag.scrollTop = oldScrollPosition;				
			}, 0)
		}
	}

	function linkHandler()
	{
		if(navEl.classList.contains("show"))
		{
			let htmlTag = document.getElementsByTagName('html')[0];
			mainEl.style.display = "block";

			setTimeout(() => {
				//mainScroll.scrollTop = mainScroll.scrollTop + 60
				
				htmlTag.scrollTop = htmlTag.scrollTop - 60;
				oldScrollPosition = 0;
				showNav = false;

			},10);
		}
	}

	function openSite(siteName)
	{
		if(mode == "edit" && currentEdits.sites[siteName])
		{
			newSiteInsertPosition = -1;
			siteOpenInSidebar = siteName;
		}
	}

</script>

<div class='main-container'>
	<div class='mobile-nav-bar' on:click={toggleTocView}>
		<img class='icon' src={menuICON} height=30 width=30 style="magin: 10px"/>
		<span style="margin-left: 20px; vertical-align: middle;">Table of Contents</span></div>
	<nav bind:this={navEl} class={showNav ? "show" : ""}>
		{#each data.sitelist as block}
			{#if block.tag=="h1"}
				<a 
					on:click={linkHandler}
					href={"#" + getHeadingAnchor(block.text)}>{block.text}</a>
			{:else if block.tag=="h2"}
				<a 
					on:click={linkHandler}
					href={"#" + getHeadingAnchor(block.text)} class="l2">{block.text}</a>
			{:else if block.tag=="h3"}
				<a on:click={linkHandler}
					href={"#" + getHeadingAnchor(block.text)} class="l3">{block.text}</a>
			{/if}
		{/each}
	</nav>
	<main bind:this={mainEl} class={inHeadingMode ? "heading-mode" : ""}>
		
		{#if mode == "all" || mode == "safe"}

			<h1 class='title'>Welcome to the Herd!</h1>

			<p>The My Little Pony fandom is huge and contains many websites dedicated to fan content! Below you'll find an index of many different sites (and if we're missing any, help us add them <a href="./edit">here</a>).</p>

			{#if mode == "all"}
				<p><strong>Please note that some of these sites link to adult content or content some may consider offensive. For this reason, please share the <a href="https://pony.directory">mane website</a> unless you know the person you're sharing it with is of the appropriate age.</strong></p>
			{/if}

			<p>
				<input id='dead-toggle' bind:checked={showDeadCheckbox} type='checkbox'><label for='dead-toggle'>Show dead websites</label>
			</p>
		{/if}

	
		{#if mode=="edit"}

			<h1 class='title'>Revision <span on:click={function(e){
				if(e.shiftKey)
				{
					approvalDialogueVisible = true;
					approvalDialogueApprove = true;
				}

			}}>R</span>equest</h1>

			<p>To add new sites to the directory or update any existing site, please follow the steps below:</p> 

			<ol>
				<li>Start with the current version or optionally load another version (usefully if you'd like to modify an earlier request you made)</li>
				<li>Make all the changes you'd like to see (adding new sites, updating others, etc)</li>
				<li>Push 'Submit Changes' and optionally leave a comment explaining your edits</li>
				<li>Your changes will then be reviewed and merged into the base site. If the admins choose not to adopt some or all of the changes, we will leave a comment on the revision</li>
			</ol>

			<h2>Pony.Directory Guidelines</h2>

			<ul>
				<li>Pony sites with a custom domain are our bread and butter - please add them!
					<ul>
						<li>Subdomains of pony sites may be added if their purpose is very different than pony site without a subdomain</li>
						<li>Subdomains/paths of mainstream websites like blogger, github, etc. will be approved on a case-by-case basis.</li>
						<li>Personal websites/blogs/etc. will not be approved unless they have a custom domain</li>
					
					</ul>
				</li>
				<li>Domains which are no longer available must be tagged with 'dead'</li>
				<li>Domains which redirect to a different page must be tagged with 'redirect'</li>
				<li>Domains which link to explicit or generally unsavory content must be tagged with 'restricted'<ol>
					<li>Sites which primarily feature sexually explicit works or content that would be considered inappropriate for the target audience must be tagged as restricted.</li>
					<li>Sites which directly link to sites described in (1) are restricted.</li>
					<li>Sites which feature both SFW and NSFW content need to have appropriate precautions in place. Explicit content should not be shown without the viewer choosing interacting with it. Ideally, such content is completely filtered until a user chooses to remove the filter</li>
				</ol></li>
				

			</ul>

			<h2>Revisions</h2>

			<div class='revisions'>

				<table>
					<tr>
						<th>Revision</th>
						<th>Status</th>
						<th></th>
					</tr>
					<tr class={openRevision == "current" ? "selected" : ""}>
						<td>current</td>
						<td></td>
						<td><button on:click={()=>{
								window.location = "/edit"
							}}>Open current</button>
						</td>
					</tr>
					{#each data.revisions as revision}
						<tr class={
							openRevision == revision.replace(/ (OPEN|CLOSED)\.yml/g,"") ? "selected" : ""}
							>
							<td>{revision.replace(/ (OPEN|CLOSED)\.yml/g,"")}</td>
							<td>{revision.replace(/\.yml|\d\d\d\d-\d\d-\d\d \d\d /g,"")}</td>
							<td><button on:click={()=>{
								window.location = "/edit?revision=" + revision.replace(/ (OPEN|CLOSED)\.yml/g,"")

							}}>Open revision</button></td>
						</tr>
					{/each}
				</table>
				

			</div>

			

			{#if currentEdits.comments.length}
				<h2>Revision Comments</h2>
				{#each currentEdits.comments as comment}
					<pre class='comment'>{comment}</pre>
				{/each}
			{/if}

			<p>
				<input id='restricted-toggle' bind:checked={showRestrictedInEditMode} type='checkbox'><label for='restricted-toggle'>Show restricted websites</label>
			</p>
		{/if}

		<hr>

		{#if sitelist}

			{#if mode=='edit'}
				<h3><span class='header-add-button'>
					<div on:click={(() => {newSiteInsertPosition = 0; siteOpenInSidebar = "*";
					})}>{addButtonText}</div>
				</span>
				</h3>
			{/if}

			{#each sitelist as block}
				{#if block.tag=="h1"}
					<h1 class={block.op || ""} id={getHeadingAnchor(block.text)}>{block.text}
						{#if mode == "edit"}
							{#if block.op !="del" && inHeadingMode}
								<img src={trashIcon} on:click={() => removeHeading(block)} width=20/>
							{/if}
							<span class='header-add-button'>
								<div on:click={(() => {
									newSiteInsertPosition = insertIndex(block);
									siteOpenInSidebar = "*";
								})}>{addButtonText}</div>
							</span>
						{/if}
					</h1>
				{:else if block.tag=="h2"}
					<h2 class={block.op || ""} id={getHeadingAnchor(block.text)}>{block.text}
						{#if mode == "edit"}
							{#if block.op !="del" && inHeadingMode}
								<img src={trashIcon} on:click={() => removeHeading(block)} width=20/>
							{/if}
							<span class='header-add-button'>
								<div on:click={(() => {
									newSiteInsertPosition = insertIndex(block);
									siteOpenInSidebar = "*";
								})}>{addButtonText}</div>
							</span>
						{/if}
					</h2>
				{:else if block.tag=="h3"}
					<h3 class={block.op || ""} id={getHeadingAnchor(block.text)}>{block.text}
						{#if mode == "edit"}
							{#if block.op !="del" && inHeadingMode}
								<img src={trashIcon} on:click={() => removeHeading(block)} width=20/>
							{/if}
							<span class='header-add-button'>
								<div on:click={(() => {
									newSiteInsertPosition = insertIndex(block);
									siteOpenInSidebar = "*";
								})}>{addButtonText}</div>
							</span>
						{/if}
					</h3>
				{:else if shouldShowSite(currentEdits.sites[block.site] || data.sites[block.site], showDead, showRestricted, mode, block.op)}
					<div class='site-container'>
						<Card 
							site={currentEdits.sites[block.site] || data.sites[block.site]}
							op={block.op || ""}
							on:click={() => openSite(block.site)} 
							on:delete={(e) => {removeIndexFromSites(block)}}
							on:restore={() => restoreSitelistItem(block)}
							/>

						{#if mode=="edit"}
							<span class='add-button'>
								<div on:click={(() => {
									newSiteInsertPosition = insertIndex(block);
									siteOpenInSidebar = "*";
								})}>{addButtonText}</div>
							</span>
						{/if}
					</div>
				{/if}
			{/each}
		{/if}


		{#if approvalDialogueVisible || siteOpenInSidebar} 
			<div class='sidebar-drop' on:click={closeSite}></div>
		{/if}

		{#if approvalDialogueVisible}
			<SubmissionDialogue approvalMode={approvalDialogueApprove} currentEdits={currentEdits} on:close={closeSite}/>
		{/if}

		{#if siteOpenInSidebar}
			
			<div class='sidebar'>
				{#if inHeadingMode && siteOpenInSidebar == "*"}
					<h1>Add Heading</h1>
					<div>
					</div>
					
					<div>
						<input bind:value={newHeadingText}/>
						<select bind:value={newHeadingTag}>
							<option>h1</option>
							<option>h2</option>
							<option>h3</option>
						</select>
						<div>
							<button on:click={addHeading}>Add Heading</button>
							<button on:click={closeSite}>Cancel</button>
						</div>
					</div>
				{:else}
					<EditSidebar site={siteOpenInSidebar} currentVersion={currentEdits} baseVersion={data}
						on:closeSite={closeSite} 
						on:saveSite={saveSite}
					/>
					
				{/if}
			</div>
		{/if}


		<div id='background' class={mode == "all" ? "adult" : ""}></div>

		{#if mode == "edit"}
			<div style="height: 50px"></div>
			<div class='action-bar'>
				<button on:click={() => {
					inHeadingMode = !inHeadingMode
				}}>{inHeadingMode ? "Modify Sites" : "Modify Headings"}</button>
				<button on:click={()=>{ approvalDialogueVisible=true}}>Submit Changes</button>
			</div>
		{/if}
	</main>

</div>



<style>

	html, body {
		margin: 0px;
		position: absolute;
		top: 0;
		bottom: 0;
		left: 0;
		right: 0;
		padding: 0px;
	}

	.action-bar {
		position: fixed;
		bottom: 0px;
		left: 0px;
		right: 0px;

		/*background-color: rgba(0,0,0,.5);*/
		background-image: linear-gradient(rgba(0,0,0,0), rgba(0,0,0,1));
		text-align: center;
	}

	.action-bar button {
		
		background-color: #1d9bf0;
		color: white;
		margin: 20px 10px;
		padding: 10px;
		font-size: 15pt;
		cursor: pointer;
		border-radius: 25px;
	}

	.action-bar button:hover {
		background-color: #1a8cd8;
	}

	.site-container:hover .add-button {
		visibility: visible;
	}

	h1:hover .header-add-button, h2:hover .header-add-button, h3:hover .header-add-button {
		visibility: visible;
	}
	.header-add-button {
		visibility: hidden;	
		font-size: 12pt;
		display: inline-block;
		vertical-align: middle;
	}

	.add-button 
	{
		display: inline-block;
		visibility: hidden;
		width: 0px;
		height: 0px;

		z-index: 1;
		position: relative;
		transform: rotate(90deg);

		float: right;
		/*right: 20px;*/
	}

	.add-button div, .header-add-button {
		width: 100px;
		height: 30px;
		background-color: green;
		color: white;
		text-align: center;
		line-height: 30px;
		font-weight: normal;

		cursor: pointer;
		font-family: Roboto;

	}

	.heading-mode .add-button div, .heading-mode .header-add-button
	{
		background-color: yellow;
		color: black;
	}

	.title {
		text-align: center;
	}

	nav {
		font-family: Roboto;
		padding: 5px 0px;

		overflow-y: auto;
		background-color: rgba(255, 255, 255, .85);
		width: 200px;

		flex-shrink: 0;
		flex-grow: 0;

		position: sticky;
		top: 8px;
		bottom: 8px;
		margin: 0px 8px;
		height: calc(100vh - 24px);
	}

	.sidebar-drop {
		position: fixed;
		top: 0;
		bottom: 0;
		left: 0;
		right: 0;
		z-index: 2;

		background-color: rgba(0,0,0,.25);
	}

	.sidebar {
		position: fixed;
		top: 0px;
		bottom: 0px;
		right: 0px;
		width: 500px;

		background-color: white;
		padding-left: 1in;
		z-index: 3;
	}

	

	nav a {
		display: block;
		cursor: pointer;
		color: black;
		text-decoration: none;

		padding: 0px 5px;

		transition: color .3s;
		transition: background-color .3s;

	}

	nav a:hover {
		background-color: #ee3d96;
		color: white;
	}

	nav .l1 {
		
	}
	nav .l3 {
		padding: 0 5px;
		padding-left: 45px;
	}

	nav .l2 {
		padding-left: 25px;
	}

	.main-container {
		/**max-width: 900px;*/
		display: flex;
		position: relative;
		flex-direction: row;
		justify-content: center;
	}

	main {
		box-sizing: border-box;
		/*overflow-y: auto;*/
		flex-grow: 1;
		flex-shrink: 1;

		max-width: 1000px;

		font-family: "Roboto";
		background-color: rgba(255, 255, 255, .85);
		padding: 10px .5in;
	}
	#background.adult {
		background-image: url($lib/img/Canterlot_night.webp);
	}

	#background {
		background-image: url($lib/img/Map_of_Equestria_2015.webp);
		background-size: cover;
		background-position: center;
		background-repeat: no-repeat;

		position: fixed;
		top: 0px;
		bottom: 0px;
		left: 0px;
		right: 0px;

		z-index: -1;

	}

	@font-face {
		font-family: Equestria;
		src: url(/font/Equestria.otf);
	}

	@font-face {
		font-family: Roboto;
		src: url(/font/Roboto-Regular.ttf);
	}

	.site-container {
		display: inline-block;
	}

	h1, h2, h3, h4 {
		font-family: "Equestria";
		margin-bottom: 0px;
		margin-top: 15px;
	}

	h1 {
		font-size: 4em;
		color: #ee3d96;
	}

	h1 + h2 {
		margin-top: 0px;
	}

	h2 {
		font-size: 3em;
		color: #92278f;
	}

	h3 {
		font-size: 2em;
		color: #f067a6;
	}

	h1.ins::before, h2.ins::before, h3.ins::before {
		content: "(new)";
	}

	h1.del::before, h2.del::before, h3.del::before {
		content: "(removed)";
	}

	.mobile-nav-bar {
		display: none;
	}

	.main-container {
		position: relative;
	}

	table, tr, td, th {
		border: solid 1px black;
		border-collapse: collapse;
	}

	tr.selected {
		background-color: #fde8f2;
	}

	td {
		padding: 5px;
	}

	.revisions {
		max-height: 200px;
		overflow-y: auto;
		max-width:	600px;
	}

	.comment {
		padding: 20px;
		margin: 10px;
		background-color: #C0C0C0;
		border-radius: 10px;
	}


	@media(max-width: 800px){

		html,body {
			margin: 0px;
			padding: 0;
		}

		.main-container {
			position: absolute;
			top: 0;
			left: 0;
			width: 100%;
		}

		.mobile-nav-bar {
			font-family: Roboto;
			font-size: 14pt;
			position: fixed;
			display: block;
			top: 0px;
			left: 0px;
			right: 0px;
			height: 60px;
			background-color: #92278f;
			line-height: 60px;
			color: white;
			z-index: 2;
			padding-left: 20px;
		}

		.desktop-nav-heading
		{
			display: none;
		}


		.main-container {
			flex-direction: column;

		}

		nav {
			display: none;
		}

		nav.show {
			display: block;
			box-sizing: border-box;
			width: 100%;
			height: calc(100% - 60px);
			display: block;
			z-index: 1;

			background-color: white;

			margin: 0px;

			padding-top: 70px;
			padding-bottom: 10px;

		}

		.icon {
			vertical-align: middle;
		}

		main {
			padding: 10px;
			margin: 0px;
			padding-top: 60px;
		}
	}

	@media(max-width: 500px){
		.site-container {
			width: calc(100% - 30px)
		}
	}

</style>