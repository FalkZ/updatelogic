<script lang="ts">
    import { createUpdateLogic } from "$lib/update-logic.svelte.js";

    type Data = {
        names: string[];
    };
    class Logic {
        data: Data = $state({ names: [] });

        async resolve() {
            return "Resolved";
        }

        async reject() {
            throw new Error("Rejected");
        }

        value() {
            return "value";
        }

        error() {
            throw new Error("err");
        }

        nested() {
            return this.value();
        }
    }

    const logic = createUpdateLogic(Logic);

    logic.value();

    try {
        logic.error();
    } catch {
        // ignore
    }

    logic.resolve();

    logic.reject();

    logic.nested();
</script>
