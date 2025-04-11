import { createUpdateLogic } from '$lib/update-logic.svelte.js';
import { uninitialized } from '$lib/uninitialized.js';
import { tick } from 'svelte';

type Item = {
	text: string;
	checked: boolean;
};

type State = {
	todos: Item[];
};

class Logic {
	data: State = $state(uninitialized);

	addToList(text: string) {
		this.data.todos.push({ text, checked: false });
	}

	removeFromList(item: Item) {
		const index = this.data.todos.findIndex(({ text }) => text === item.text);

		this.data.todos.splice(index, 1);
	}
}

export const logicAsync = createUpdateLogic(Logic, {
	init: async (test: string) => {
		await tick();

		return {
			todos: []
		};
	}
});
