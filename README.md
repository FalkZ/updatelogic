# updatelogic

> Lightweight State Management for Svelte

A lightweight, type-safe state management solution for Svelte 5 applications inspired by Elm's Model-View-Update (MVU) architecture.

## Features

- **Centralized State** - Application state is organized in one location
- **Automatic Updates** - State changes trigger UI updates
- **Immutability Enforcement** - Prevents external mutation of state
- **Structured Actions** - Actions and updates follow a consistent pattern within a single class
- **Zero Config Logging** - Logs actions and state changes during development
- **Lightweight** - Heavily uses Sveltes reactivity for updates and does not use any dependencies

## When to Use

Updatelogic is ideal for client-side web applications with complex, interdependent state management needs. It particularly if your app's state has grown beyond simple component-level management but you don't want the overhead of Redux or similar libraries, updatelogic offers the perfect solution.

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
    import { logic } from "./logic.svelte.js";
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
    import { logic } from "./logic.svelte.js";
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

## Advanced Features

### Immutability Enforcement

Updatelogic enforces that state can only be mutated within logic class methods, preventing accidental state modifications from outside:

```typescript
// This works
logic.increment();

// This will log an error and not change the state
logic.data.count = 5;
```

### Development Logging

During development, updatelogic automatically logs all method calls, their arguments, state changes and returns for easier debugging:

```
┏ increment
  STATE:
  { data: { counter: 0 } }
┗ increment
  STATE:
   { data: { counter: 1 } }
  RETURNED:
  undefined
```

### Custom Configuration

```typescript
const logic = createUpdateLogic(Logic, {
    logging: true, // Enable logging even in production
    enforceImmutableData: false, // Allow external data mutations
});
```
