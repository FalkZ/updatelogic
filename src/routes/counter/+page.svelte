<script lang="ts">
    import { logic } from "./logic.svelte.js";

    $effect(() => {
        console.log("test changed", logic.data.test);
    });

    $effect(() => {
        console.log("other changed", logic.other);
    });
</script>

<button onclick={logic.increment}>
    clicks: {logic.data.count}
</button>

<button onclick={() => logic.hello("test", logic.data)}> test </button>
