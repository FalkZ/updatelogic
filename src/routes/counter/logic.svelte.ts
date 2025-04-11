import { createUpdateLogic } from '$lib/update-logic.svelte.js';

type Data = {
	count: number;
};

class Logic {
	data: Data = $state({ count: 0 });

	increment(){
    this.data.count += 1;
	}
}

export const logic = createUpdateLogic(Logic);
