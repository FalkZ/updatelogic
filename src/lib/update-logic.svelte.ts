import type { Constructor } from "type-fest";
import { snapshot } from "./snapshot.svelte.js";
import { isUninitialized } from "./uninitialized.js";
import { isPromise } from "./utils.js";
import { log } from "./log.js";

export type Logic<Data extends object = object> = {
    data: Data;
    initialized?: boolean;
};

type LogicOptions = {
    logging: boolean;
    enforceImmutableData: boolean;
};

type LogicOptionsInternal = LogicOptions & { immutableData: unknown };

const rawSymbol = Symbol("raw");

// @ts-expect-error: rawSymbol does not exist on any obj
export const unwrapProxy = <Obj extends object>(obj: Obj): Obj => obj?.[rawSymbol] ?? obj;

const createLoggingProxy = <Obj extends Logic>(obj: Obj, options: LogicOptionsInternal) => {
    return new Proxy(obj, {
        get(target, prop, receiver) {
            if (prop === rawSymbol) return target;

            if (prop === "data") {
                if (isUninitialized(obj.data)) {
                    console.error(`Accessed data before calling initialize(this, [data])`);
                }

                return options.enforceImmutableData ? options.immutableData : obj.data;
            }

            const value = Reflect.get(target, prop);

            if (typeof value === "function") {
                return function (...rawArgs: unknown[]) {
                    let args!: unknown[];

                    if (options.logging) {
                        args = snapshot(rawArgs);

                        log({
                            start: true,
                            args,
                            target,
                            prop,
                        });
                    }

                    let result;
                    try {
                        const proxyThis = options.enforceImmutableData
                            ? // remove enforceImmutableData that methods can mutate
                              createLoggingProxy(target, {
                                  ...options,
                                  enforceImmutableData: false,
                              })
                            : receiver;

                        result = value.apply(proxyThis, rawArgs);
                    } catch (err: unknown) {
                        if (options.logging) {
                            log({
                                start: false,
                                args,
                                target,
                                prop,
                                error: true,
                                meta: {
                                    label: "threw",
                                    data: err,
                                },
                            });
                        }
                        throw err;
                    }

                    if (options.logging) {
                        if (isPromise(result)) {
                            result.then(
                                (value) => {
                                    log({
                                        start: false,
                                        args,
                                        target,
                                        prop,
                                        meta: {
                                            label: "resolved",
                                            data: value,
                                        },
                                    });
                                },
                                (err: unknown) => {
                                    log({
                                        start: false,
                                        args,
                                        target,
                                        prop,
                                        error: true,
                                        meta: {
                                            label: "rejected",
                                            data: err,
                                        },
                                    });
                                },
                            );
                        } else {
                            log({
                                start: false,
                                args,
                                target,
                                prop,
                                meta: {
                                    label: "returned",
                                    data: result,
                                },
                            });
                        }
                    }
                    return result;
                };
            }
            return value;
        },
        set(target, prop, value, receiver) {
            if (prop === "data") {
                if (options.enforceImmutableData) {
                    console.error("Tried to set data from outside the logic class to:", value);
                } else Reflect.set(target, prop, value);
            } else {
                Reflect.set(target, prop, value, receiver);
            }

            return true;
        },
    }) as Obj;
};

export const createUpdateLogic = <T extends Logic>(
    Class: Constructor<T>,
    options: Partial<LogicOptions> = {},
) => {
    const t = new Class();

    // derived should be a let statement
    // eslint-disable-next-line prefer-const
    let immutableData = $derived.by(() => snapshot(t.data));

    const internalOptions: LogicOptionsInternal = {
        logging: import.meta.env.DEV,
        enforceImmutableData: true,
        ...options,
        immutableData,
    };

    return createLoggingProxy(t, internalOptions) as T;
};
