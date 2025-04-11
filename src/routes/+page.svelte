<script lang="ts">
	import { logic } from './logic.svelte.js';

	let newItem = $state('');

	logic.value();
	try {
		logic.error();
	} catch {}
	logic.resolve();
	logic.reject();
</script>

<input bind:value={newItem} type="text" placeholder="new todo item.." />
<button
	onclick={() => {
		logic.addToList(newItem);
		newItem = '';
	}}
	>Add
</button>

<br />

{#each logic.data.todos as item, index}
	<input checked={item.checked} type="checkbox" />
	<span class:checked={item.checked}>{item.text}</span>
	<span onclick={() => logic.removeFromList(item)}>❌</span>
	<br />
{/each}

<style>
	.checked {
		text-decoration: line-through;
	}
</style>
