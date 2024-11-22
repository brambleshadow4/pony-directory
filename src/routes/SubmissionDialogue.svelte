<script>
	export let approvalMode = false
	export let currentEdits = {};
	import {createEventDispatcher} from "svelte";
	import spinner from "$lib/img/loader-icon.svg"
	console.log(currentEdits)

	let newRevision = "";
	let latestComment = "";
	let password = "";
	let inFlight = false;
	let recievedResponse = false;
	let status = 0;
	let errorMessage = "";



	let dispatch = createEventDispatcher();

	if(!currentEdits.comments)
		currentEdits.comments = [];

	

	async function submit()
	{
		currentEdits.comments.push((new Date().toISOString()) + "\n" + latestComment.substring(0,512))
		inFlight = true;
		let response = await fetch("/api/revision/new", {
			method: "POST",
			body: JSON.stringify(currentEdits)
		});

		let body = await response.json();
		inFlight = false;

		recievedResponse = true;
		status = response.status;

		if(response.status != 200)
		{	
			errorMessage = body;
			return;
		}

		newRevision = body.revision;
	}

	function getRevisionURL()
	{
		let query = window.location.search.substring(1);
		let params = query.split("&");
		for(let k of params)
		{
			let [a,b] = k.split("=")
			if(a == 'revision')
			{
				return decodeURIComponent(b);
			}
		}
		return ""
	}

	async function update(approve)
	{
		currentEdits.comments.push(new Date().toISOString() + "\nNote from admin: \n" + latestComment.substring(0,512));
		currentEdits.password = password;
		currentEdits.revisionNo = getRevisionURL();
		currentEdits.approve = approve;
		inFlight = true;
		let response = await fetch("/api/revision/update", {
			method: "POST",
			body: JSON.stringify(currentEdits)
		});
		inFlight = false;

		let body = await response.json();

		recievedResponse = true;
		status = response.status;

		if(response.status != 200)
		{	
			errorMessage = body;
			return;
		}
		
	}

</script>

<div class='container'>
	
	<div class='popup'>

		{#if recievedResponse}
			{#if status==200}
				<p>Request submitted successfully!</p>
				{#if newRevision}
					<p>You may view your request at <a on:click={() => {dispatch("close")}} href={"/edit?revision=" + newRevision}>pony.directory/edit?revision={newRevision}</a></p>
					
				{/if}
			{:else}
				<p>Error w/ request; status {status}</p>
				{#if errorMessage}<p>{errorMessage}</p>{/if}
			{/if}
			<button on:click={() => {window.location.reload()}}>Close</button>
		{:else}

			<h1>Revision comments:</h1>
			<textarea maxlength="512" bind:value={latestComment} rows=6></textarea>

			{#if approvalMode}
				<div><input bind:value={password} type="password" placeholder='Admin password'/></div>
			{/if}
			<div>

				{#if inFlight}
					<img class='spinner' src={spinner} />
				{:else}

					{#if approvalMode}
						<button on:click={()=>{update(true)}}>Approve</button>
						<button on:click={()=>{update(false)}}>Reject</button>
					{:else}
						<button on:click={submit}>Submit</button>
					{/if}
					<button on:click={()=> dispatch("close")}>Cancel</button>
				{/if}
			</div>
		{/if}
	</div>
</div>

<style>

	textarea {
		width: calc(100%);
	}
	.container {
		position: fixed;
		top: 0;
		bottom: 0;
		left: 0;
		right: 0;
		z-index: 10;
		text-align: center;
		
	}

	.spinner {
		width: 30px;
		height: 30px;
		animation-name: spin;
		animation-timing-function: linear;
		animation-duration: 1s;
		animation-iteration-count: infinite;
	}

	@keyframes spin {
	  0%   {rotate: 0deg;}
	  25%  {rotate: 90deg;}
	  50%  {rotate: 180deg;}
	  100% {rotate: 360deg;}
	}

	.popup {
		background-color: white;
		padding: 10px 1in 10px;
		max-width: 600px;
		margin: auto;
		margin-top: 1in;
	}

	 button {
		
		background-color: #1d9bf0;
		color: white;
		margin: 20px 5px;
		padding: 10px;
		font-size: 15pt;
		cursor: pointer;
		border-radius: 25px;

		border-color: transparent;
	}
	input {
		margin: 10px;
		width: 2in;
		padding: 5px;
	}

	button:hover {
		background-color: #1a8cd8;
	}
</style>