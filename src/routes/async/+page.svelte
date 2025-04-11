<script lang="ts">
    import { logic } from "./logic.svelte.js";
    logic.init();
</script>

{#if logic.initialized}
    <input placeholder="Filter Names" onchange={(e) => logic.setFilter(e.currentTarget.value)} />

    <ul>
        {#each logic.data.names as name}
            <li>{name}</li>
        {/each}
    </ul>
{/if}
