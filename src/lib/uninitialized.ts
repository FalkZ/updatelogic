import { unwrapProxy } from "./update-logic.svelte.js";

const uninitializedSymbol = Symbol("uninitialized");

export const uninitialized = { [uninitializedSymbol]: true } as any;

export const isUninitialized = (obj: unknown) => Boolean(obj?.[uninitializedSymbol]);

export const initialize = <
    Data extends object,
    UpdateLogic extends { data: Data; initialized: boolean },
>(
    logic: UpdateLogic,
    data: Data,
) => {
    const rawLogic = unwrapProxy(logic);
    rawLogic.data = data;

    rawLogic.initialized = true;
};
