import type { Constructor, ReadonlyDeep } from "type-fest";
import { isPromise } from "./utils.js";
import { isUninitialized } from "./uninitialized.js";

type ReadonlyData<T> = T extends { data: infer Data }
    ? Omit<T, "data"> & ReadonlyDeep<{ data: Data }>
    : never;

const rawSymbol = Symbol("raw");

export const unwrapProxy = <T extends object>(obj: T): T => obj?.[rawSymbol] ?? obj;

const createLoggingProxy = <T extends object>(
    obj: T,
    lockData?: true,
    options: LogicOptions & { initialized: boolean },
) => {
    const needsInitialization = Boolean(options?.init);

    const logging = options?.logging;

    if (!needsInitialization) options.initialized = true;

    let readonlyData = $derived.by(() => $state.snapshot(obj.data));

    return new Proxy(obj, {
        get(target, prop, receiver) {
            if (prop === rawSymbol) return target;

            if (prop === "data") {
                if (isUninitialized(obj.data)) {
                    console.error(`Accessed data before calling initialize(this, [data])`);
                }

                if (lockData) return readonlyData;
            }

            const value = target[prop];

            if (typeof value === "function") {
                return function (...args: any[]) {
                    let argsSnapshot!: any[];
                    if (logging) {
                        argsSnapshot = $state.snapshot(args);
                        console.groupCollapsed(`┏ ${String(prop)}\n`, argsSnapshot);

                        const currentData = $state.snapshot(target.data);
                        console.log("data:", currentData);

                        console.groupEnd();
                    }

                    let result;
                    try {
                        result = value.apply(
                            lockData ? createLoggingProxy(target, false, options) : receiver,
                            args,
                        );
                    } catch (err: unknown) {
                        if (logging) {
                            console.group(`┗ ${String(prop)}\n`, argsSnapshot);

                            const currentData = $state.snapshot(target.data);
                            console.error("data:", currentData, `\nthrew:`, err);

                            console.groupEnd();
                        }
                        throw err;
                    }

                    if (logging) {
                        if (isPromise(result)) {
                            result.then(
                                (value) => {
                                    console.groupCollapsed(`┗ ${String(prop)}\n`, argsSnapshot);

                                    const currentData = $state.snapshot(target.data);
                                    console.log("data:", currentData, `\nresolved:`, value);

                                    console.groupEnd();
                                },
                                (err: unknown) => {
                                    console.group(`┗ ${String(prop)}\n`, argsSnapshot);

                                    const currentData = $state.snapshot(target.data);
                                    console.error("data:", currentData, `\nrejected:`, err);

                                    console.groupEnd();
                                },
                            );
                        } else {
                            console.groupCollapsed(`┗ ${String(prop)}\n`, args);

                            const currentData = $state.snapshot(target.data);
                            console.log("data:", currentData, `\nreturned:`, result);

                            console.groupEnd();
                        }
                    }
                    return result;
                };
            }
            return value;
        },
        set(target, prop, value, receiver) {
            if (prop === "data") {
                if (lockData) {
                    console.error("Tried to set data from outside the logic class to:", value);
                } else Reflect.set(target, prop, value);
            } else {
                Reflect.set(target, prop, value, receiver);
            }

            return true;
        },
    }) as T;
};

export type LogicOptions = {
    logging?: boolean;
    init?: (arg: unknown) => Promise<unknown>;
};

type Return<T, Init> = Init extends undefined
    ? ReadonlyData<T>
    : ReadonlyData<T> & { init: Init; readonly initialized: Promise<true> };

type GetData<T> = T extends { data: infer Data } ? Data : never;

export const createUpdateLogic = <
    T extends { data: any },
    Init extends ((initArg: any) => Promise<GetData<T>>) | undefined = undefined,
>(
    Class: Constructor<T>,
    options: {
        logging?: () => boolean;
        init?: Init;
    } = {},
) => {
    const t = new Class() as ReadonlyData<T>;

    const internalOptions: LogicOptions = {
        logging: import.meta.env.DEV,
        ...options,
    };

    return createLoggingProxy(t, true, internalOptions) as Return<T, Init>;
};
