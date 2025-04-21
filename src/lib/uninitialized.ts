const uninitializedSymbol = Symbol("uninitialized");

// any is needed because we want to automatically match any type with uninitialized
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const uninitialized = { [uninitializedSymbol]: true } as any;

export const isUninitialized = (obj: unknown) => Boolean(typeof obj === "object" && obj !== null && uninitializedSymbol in obj);
