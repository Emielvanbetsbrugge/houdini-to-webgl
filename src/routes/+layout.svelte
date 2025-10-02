<script lang="js">
	import favicon from '$lib/assets/favicon.svg';
	import { onMount } from 'svelte';
	import { getEngine } from '$lib/engine.js';

	let engine = null;
	let canvas = null;
	onMount(async () => {
		engine = await getEngine({ canvas });
	});

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="stylesheet" href="https://unpkg.com/normalize.css@8.0.1/normalize.css" />
</svelte:head>

<canvas id="c" bind:this={canvas} style="display:block; width:100vw; height:100vh;"></canvas>

{@render children?.()}
