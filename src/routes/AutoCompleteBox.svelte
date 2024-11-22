<script>
	export let autoCompleteLookup = function(){};
	export let value = "";
	export let fullWidth = false;

	import {createEventDispatcher} from "svelte";

	let dispatch = createEventDispatcher();

	let autoFillValues = [];
	let autoFillIndex = -1;


	function handleInput(e)
	{
		let values = autoCompleteLookup(value);
		if(values != undefined)
			autoFillValues = values;
	}

	function handleLostFocus(e)
	{
		autoFillValues = [];
	}

	function selectValue(newVal)
	{
		value = newVal;
		autoFillValues = [];
		autoFillIndex = -1;

		dispatch("change", value);
	}

	function handleKeydown(e)
	{
		if(e.key == "ArrowDown")
		{
			autoFillIndex++;
			e.preventDefault();
		}

		if(e.key == "ArrowUp")
		{
			if(autoFillIndex >0 )
				autoFillIndex--;


			e.preventDefault();
		}

		if(e.key == "Enter")
		{
			if(autoFillIndex > -1)
			{
				value = autoFillValues[autoFillIndex];
				autoFillValues = [];
				autoFillIndex = -1;
			}
			e.preventDefault();

			dispatch("change", value);
		}


		if(autoFillValues.length == 0)
			autoFillIndex = -1;
		
		else if (autoFillIndex > autoFillValues.length)
			autoFillIndex = autoFillValues.length-1;
	}


</script>

<div class={'control ' + (fullWidth ? " full" : "")}>
	<input bind:value={value} on:input={handleInput} on:keydown={handleKeydown} on:blur={handleLostFocus}/>
	{#if autoFillValues.length}
		<div class='autoFillValues'>
			{#each autoFillValues as val,i}
				<div class={i == autoFillIndex ? "selected" : ""} on:mousedown={() => selectValue(val)} >{val}</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.control {
		display: inline-block;
		position: relative;
	}

	.control.full {
		width: 100%;
	}

	input {
		padding: 5px;
	}

	.full input {
		width: 100%;
	}

	.autoFillValues {
		border: solid 1px black;
		left: 0;
		right: 0;
		position: absolute;
		background-color: white;

		z-index: 10;
	}

	.autoFillValues div {
		padding: 0px 5px;
	}

	.autoFillValues div.selected {
		box-shadow: 0px 0px 3px 3px #0066ff;
	}

	.autoFillValues div:hover {
		background-color: #cce6ff;
	}

</style>

