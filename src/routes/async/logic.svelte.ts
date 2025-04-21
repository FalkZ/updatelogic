import { uninitialized, createUpdateLogic } from "$lib/index.js";
import type { NamesResponse } from "./api/types.js";

type Data = {
    names: string[];
};

const getNames = async (filter: string = ""): Promise<NamesResponse> => {
    const response = await fetch(`./async/api?filter=${encodeURIComponent(filter)}`);
    return response.json();
};

class Logic {
    data: Data = $state(uninitialized);
    initialized = $state(false);

    async init() {
        this.data = await getNames();
        this.initialized = true;
    }

    async setFilter(filter: string) {
        const { names } = await getNames(filter);

        this.data = { names };
    }
}

export const logic = createUpdateLogic(Logic);
