<script>
	export let site = {};
	export let op = "";

	import trashIcon from "$lib/img/trash.svg"
	import restoreIcon from "$lib/img/restore.svg"
	import {createEventDispatcher} from "svelte"

	let dispatch = createEventDispatcher();

	function formatDate(date)
	{
		if(!date)
			return "";

		if(date.length)
			return date.substring(0,10)

		return date;
	}

	function getClass(site)
	{
		let tags = new Set(site.tags.split(","));

		if(tags.has("dead")) return op + " dead";
		if(tags.has("redirect")) return op + " redirect"

		return op;
	}

	function handleClick()
	{
		dispatch("")
	}

</script>

<div class={"site-container " + getClass(site)} on:click>
	<div><a on:click={function(e){e.stopPropagation()}} target="_blank" href={(site.protocol || "https")+ "://" + site.link}>{site.name || site.link}</div>
	<div>{site.description}</div>
	<div>
		{#if site.tags}
			{#each site.tags.split(",") as tag}
				<div class='tag-label'>{tag}</div>
			{/each}
		{/if}
	</div>
	<div class="site-updated">
		{#if op == "del"}
			Will be deleted
		{:else if op == "ins"}
			Will be added
		{:else}
			Updated {formatDate(site.updated)}
		{/if}
		
	</div>
	<div class='action-icon'>
		{#if op == "same" || op == "ins" || op == "diff" || op=="update"}
			<img src={trashIcon} width=20 height="20" on:click={(e) =>{ e.stopPropagation(); dispatch("delete")}} />
		{/if}
		{#if op == "del"}
			<img src={restoreIcon} width=20 height="20" on:click={(e) =>{ e.stopPropagation(); dispatch("restore")}} />
		{/if}
	</div>
</div>

<style>

	.site-container.same, .site-container.ins, .site-container.del, .site-container.diff, .site-container.update  {
		padding-bottom: 30px;
	}

	.site-container {
		display: inline-block;
		vertical-align: top;
		margin-bottom: 10px;
		margin-right: 10px;
		border: solid 1px #61217f;
		box-shadow: 2px 2px #61217f;
		width: 2in;
		padding: 10px;
		padding-bottom: 20px;

		background-color: white;
		position: relative;
		word-wrap: anywhere;

		vertical-align: top;
	}

	.same {
		border-color: grey;
		color: grey;
		box-shadow: 2px 2px grey;
	}

	.diff {
		background-color: #ebd6f5;
	}

	.ins {
		background-color: #ccffdd;
	}

	.del {
		background-color: #ffcccc;
	}



	.dead a, .dead .site-link-container, .dead .site-title, .dead .site-description  {
		text-decoration: line-through;
		color: red;
	}




	.redirect a, .redirect .site-link-container, .redirect .site-title, .redirect .site-description  {
		color: orange;
	}

	.same a {
		color: grey;
	}

	.site-updated {
		font-size: 8pt;
		color: #B0B0B0;
		position: absolute;
		bottom: 2px;
		right: 5px;
	}

	.action-icon {
		position: absolute;
		bottom: 2px;
		left: 5px;
	}

	.update .site-updated {
		background-color: #ebd6f5;
		color: black;	
	}
	

	.del .site-updated, .diff .site-updated, .ins .site-updated {
		color: black;
	}

	.site-title {
		display: inline-block;
		font-weight: 700;
	}

	.site-body-container {
		display: block;
		padding-left: 10px;

	}

	.site-description {
		display: inline-block;
	}

	.tag-label {
		display: inline-block;
		padding-left: 4px;
		padding-right: 4px;
		border: 1px solid #000;
		border-radius: 4px;
		margin-right: 4px;
	}
</style>