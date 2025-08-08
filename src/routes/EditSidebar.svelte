<script>
	export let site = "";
	export let baseVersion = {};
	export let currentVersion = {sites: {}};
	import {createEventDispatcher, onMount} from "svelte";
	import AutoCompleteBox from "./AutoCompleteBox.svelte";

	import restoreIcon from "$lib/img/restore.svg";

	$: addSite = site == "*";



	let thisData = {
		name: "",
		link: "",
		description: "",
		tags: ""
	}

	$: canDiff = baseVersion.sites[thisData.link] && currentVersion.sites[thisData.link]


	let tagBoxValue = "";

	let originalName = "";

	let dispatch = createEventDispatcher();
		let tagSuggestions = [];

	let allTags = new Set(Object.keys(baseVersion.sites).map(x => baseVersion.sites[x].tags.split(",")).reduce((acc, value) => acc.concat(value)), [])

	let useHTTP = false;

		
	onMount(function(){
		thisData = JSON.parse(JSON.stringify(currentVersion.sites[site] || baseVersion.sites[site] || thisData));
		originalName = thisData.name || thisData.link;
		thisData.originalLink = site;
		useHTTP = thisData.protocol == "http";
	})

	function repullData()
	{
		let site = thisData.link;
		thisData = JSON.parse(JSON.stringify(currentVersion.sites[site] || baseVersion.sites[site] || thisData));
		useHTTP = thisData.protocol == "http";
	}
	

	function saveSite()
	{
		thisData.originalLink = site;
		if(useHTTP){
			thisData.protocol = "http"
		}
		else
			delete thisData.protocol;



		dispatch("saveSite", thisData)
	}

	function closeSite()
	{
		dispatch("closeSite", site);
	}

</script>
<h1>{addSite? "Add Site": "Edit " + originalName}</h1>

<div class='label-container'>
<label>Link:</label>
	<div class='control-container'>
		<AutoCompleteBox fullWidth={true}  bind:value={thisData.link} 
			on:change={repullData}
			autoCompleteLookup={function(value){

				return Object.keys(currentVersion.sites).filter(x => x.indexOf(value) >= 0).slice(0,8);
			}}
		/>
	</div>
</div>



<div class='label-container'>
	<label>Name:</label>
	<input bind:value={thisData.name}/>
</div>

{#if canDiff && baseVersion.sites[thisData.link].name != currentVersion.sites[thisData.link].name}
	<span class='changed-from indent'>Changed from "{baseVersion.sites[thisData.link].name}"
	<img title="Restore" src={restoreIcon} height='10' on:click={() => thisData.name = baseVersion.sites[thisData.link].name}>
</span>
{/if}

<div class='indented'>
	<input id='protocol' type='checkbox' bind:checked={useHTTP}><label title="Only do this if the site doesn't work when served over HTTPS" class='checkbox' for='protocol'>Force HTTP instead of HTTPS?</label>

</div>



<div class='description-label'>
	<label>Description:</label>
</div>
<textarea rows=4 bind:value={thisData.description}></textarea>

{#if canDiff && baseVersion.sites[thisData.link].description != currentVersion.sites[thisData.link].description}
	<span class='changed-from'>Changed from "{baseVersion.sites[thisData.link].description}"
		<img title="Restore" src={restoreIcon} height='10' on:click={() => thisData.description = baseVersion.sites[thisData.link].description}>
	</span>
{/if}



<div class='label-container tags'>
	<label>Tags:</label>
	
	<div class='control-container'><AutoCompleteBox bind:value={tagBoxValue} fullWidth={true} 
		autoCompleteLookup={function(value){

			return [...allTags].filter(x => (x.indexOf(value) > -1)).slice(0,10)
		}}
		on:change={function(val){

			thisData.tags += "," + val.detail;
			if(thisData.tags[0] == ",")
				thisData.tags = thisData.tags.substring(1);

			tagBoxValue = "";
		}}
	/></div>

	
	<div class='indented'>
		{#if thisData.tags.length}
			{#each thisData.tags.split(",") as tag}
				<span class='tag' on:click={function(){

					thisData.tags = thisData.tags.split(",").filter(x => x != tag).join(",");

				}}>{tag} ❌</span>
			{/each}	
		{:else}
			None
		{/if}
	</div>
	

	{#if canDiff && baseVersion.sites[thisData.link].tags != currentVersion.sites[thisData.link].tags}

		<div class='indented previous-tags'>Previous tags: <img title="Restore" src={restoreIcon} height='15' on:click={() => thisData.tags = baseVersion.sites[thisData.link].tags}></div>

		<div class='indented'>

			{#if baseVersion.sites[thisData.link].tags.length}
				{#each baseVersion.sites[thisData.link].tags.split(",") as tag}
					<span class='tag'>{tag}</span>
				{/each}	
			{:else}
				None
			{/if}
		</div>
	{/if}



</div>


<div><button on:click={saveSite}>Save</button><button on:click={closeSite}>Cancel</button></div>

<style>

	.control-container {
		display: inline-block;
		width: calc(100% - 1.8in)
	}

	.tag-chooser input {
		width: 100%;
	}
	.label-container {
		margin-bottom: 2pt;
	}
	.description-label {
		margin-top: 8pt;
	}

	.changed-from {
		font-size: 8pt;
		display: inline-block;
	}

	.changed-from.indent {
		padding-left: .85in;
	}


	label {
		width: .8in;
		display: inline-block;
	}
	input {
		padding: 5px;
		width: calc(100% - 1.8in)
	}

	input[type="checkbox"] {
		width: initial;
		padding: initial;
	}

	label.checkbox {
		width: initial;
		display: initial;
	}


	textarea {
		width: calc(100% - 1in);
	}

	.tags {
		margin-top: 20px;
	}

	.previous-tags {
		margin-top: 10px;
	}

	.tag {
		display: inline-block;
		padding-left: 4px;
		padding-right: 4px;
		border: 1px solid #000;
		border-radius: 4px;
		margin: 4px;
		cursor: pointer;
	}

	.indented {
		padding-left: .8in;
	}

	button {
		font-size: 14pt;
		padding: 10px;
		margin: 5px;
	}
</style>
