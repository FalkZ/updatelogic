# updatelogic

> Lightweight State Management for Svelte

A lightweight, type-safe state management solution for Svelte 5 applications inspired by Elm's Model-View-Update (MVU) architecture.

## Features

- **Centralized State** - Application state is organized in one location
- **Automatic Updates** - State changes trigger UI updates
- **Structured Actions** - Actions and updates follow a consistent pattern within a single class
- **Redux DevTools Integration** - Debug with time-travel debugging and state inspection
- **Lightweight** - Uses Svelte's built-in reactivity without external dependencies

## When to Use

Updatelogic fits perfectly when your application state has grown beyond simple component-level management. If you need centralized state but want to avoid the complexity of Redux or similar libraries, updatelogic provides the ideal balance of power and simplicity.

## Installation

```bash
npm install updatelogic
```

## Basic Usage

Define a state class and create logic methods that modify it:

```typescript
// counter.svelte.ts
import { updatelogic } from "updatelogic";

class State {
    count = $state(0);
    doubled = $derived(this.count * 2);
}

export const state = new State();

export const logic = updatelogic(
    {
        name: "counter",
        state,
    },
    {
        increment() {
            state.count++;
        },
    },
);
```

Use the logic and state in your components:

```svelte
<script lang="ts">
    import { state, logic } from "./counter.svelte.ts";
</script>

<button onclick={logic.increment}>
    clicks: {state.count}
</button>
```

## Configuration

The `updatelogic` function takes two arguments:

1. **Config object** with:
    - `state`: Your state class instance
    - `name` (optional): Name for Redux DevTools
    - `excludeInDevTools` (optional): Array of method names to exclude from DevTools

2. **Logic object** with methods that modify state

```typescript
const logic = updatelogic(
    {
        state,
        excludeInDevTools: ["helperMethod"],
    },
    {
        helperMethod() {
            state.count++;
        },
        increment() {
            this.helperMethod();
        },
    },
);
```

## Redux DevTools Support

Install the Redux DevTools browser extension to inspect your state. Updatelogic tracks every method call and logs state changes with visual indicators:

- `→` Method started
- `✓` Method completed successfully
- `❌` Method failed with error

You can view state snapshots, step through history, and monitor all actions.
