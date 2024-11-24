<script>
	export let data;
	import App from "./App.svelte";
</script>

<App mode={data.mode} data={data} />