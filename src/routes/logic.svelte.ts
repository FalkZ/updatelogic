import { createLogic } from '$lib/create-logic.svelte.js';

type Item = {
	text: string;
	checked: boolean;
};

type State = {
	todos: Item[];
};

class Logic {
	data: State = $state({
		todos: [
			{ text: 'Write my first post', checked: true },
			{ text: 'Upload the post to the blog', checked: false },
			{ text: 'Publish the post at Facebook', checked: false }
		]
	});

	get logging() {
		return import.meta.env.DEV;
	}

	addToList(text: string) {
		this.data.todos.push({ text, checked: false });
	}

	removeFromList(item: Item) {
		const index = this.data.todos.findIndex(({ text }) => text === item.text);

		this.data.todos.splice(index, 1);
	}

	async resolve() {
		return 'Resolved';
	}

	async reject() {
		throw new Error('Rejected');
	}

	value() {
		return 'value';
	}

	error() {
		throw new Error('err');
	}
}

export const logic = createLogic(Logic);
