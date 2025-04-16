<script lang="ts">
    import { createUpdateLogic } from "$lib/update-logic.svelte.js";

    type Data = {
        names: string[];
    };
    class Logic {
        data: Data = $state({ names: [] });
        other: Data = $state({ names: [] });

        mutateData() {
            this.data = { names: ["test"] };
        }

        mutateOther() {
            this.other = { names: ["other"] };
        }

        log() {}
    }

    const logic = createUpdateLogic(Logic);

    logic.mutateData();

    logic.mutateOther();

    logic.data = {};

    logic.data.names = [];
    logic.other = {};

    logic.log();
</script>
