export const isPromise = (value: unknown): value is Promise<unknown> =>
    value && Object.prototype.toString.call(value) === "[object Promise]";
