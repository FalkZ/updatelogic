const originalWarn = console.warn;
const ignoreWarn = () => {};

/**
 * // svelte-ignore state_snapshot_uncloneable
 * Did not work that's why this hack
 */
export const snapshot = <T>(arg: T): T => {
    console.warn = ignoreWarn;
    const r = $state.snapshot(arg);
    console.warn = originalWarn;

    return r as T;
};
