import { createUpdateLogic } from "$lib/update-logic.svelte.js";

type Data = {
    count: number;
};

class Logic {
    data: Data = $state({ count: 0, test: 0 });
    other = $state("");

    increment() {
        this.data.count += 1;
    }

    hello(test, a) {
        console.log(test, a);
    }
}

export const logic = createUpdateLogic(Logic);
