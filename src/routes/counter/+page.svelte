<script lang="ts">
    import { logic } from "./logic.svelte.js";
</script>

<button onclick={logic.increment}>
    clicks: {logic.data.count}
</button>
