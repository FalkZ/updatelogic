# updatelogic

> Lightweight State Management for Svelte

A lightweight, type-safe state management solution for Svelte 5 applications inspired by Elm's Model-View-Update (MVU) architecture.

## Features

- **Centralized State** - Application state is organized in one location
- **Automatic Updates** - State changes trigger UI updates
- **Immutability Enforcement** - Prevents external mutation of state
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

### 1. Define your logic class

```typescript
// counter/logic.svelte.ts
import { createUpdateLogic } from "updatelogic";

type Data = {
    count: number;
};

class Logic {
    data: Data = $state({ count: 0 });

    increment() {
        this.data.count += 1;
    }
}

export const logic = createUpdateLogic(Logic);
```

### 2. Use the logic in any component

```svelte
<!-- counter/+page.svelte -->
<script lang="ts">
    import { logic } from "./logic.svelte.ts";
</script>

<button onclick={logic.increment}>
    clicks: {logic.data.count}
</button>
```

## Async Operations

Updatelogic handles asynchronous operations elegantly with built-in loading state:

```typescript
// async/logic.svelte.ts
import { uninitialized, createUpdateLogic } from "updatelogic";

type Data = {
    names: string[];
};

const getNames = async (filter: string = "") => {
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
```

```svelte
<!-- async/+page.svelte -->
<script lang="ts">
    import { logic } from "./logic.svelte.ts";
    logic.init();
</script>

{#if logic.initialized}
    <input placeholder="Filter Names" onchange={(e) => logic.setFilter(e.currentTarget.value)} />

    <ul>
        {#each logic.data.names as name}
            <li>{name}</li>
        {/each}
    </ul>
{/if}
```

## Enforced Immutability

Updatelogic ensures that you can only change state within logic class methods. This prevents accidental modifications from outside:

```typescript
// This works
logic.increment();

// This logs a warning and leaves state unchanged
logic.data.count = 5;
```

## Redux DevTools Support

Connect to Redux DevTools to inspect your application state in real-time. You can:

- View all state changes as they happen
- Step through your application's history with time-travel debugging
- Export and import state snapshots
- Monitor action dispatches
