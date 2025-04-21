import type { Constructor } from "type-fest";
import { snapshot } from "./snapshot.svelte.js";
import { isUninitialized } from "./uninitialized.js";
import { isPromise } from "./utils.js";
import { getValuesByKeys, log } from "./log.js";
import { getAllPropertyNames } from "./get-all-property-names.js";

export type Logic<Data extends object = object> = {
    data: Data;
    initialized?: boolean;
};

type LogicOptions = {
    logging: boolean;
    enforceImmutableData: boolean;
};

type InternalLogicOptions = { className: string } & LogicOptions;

const rawSymbol = Symbol("raw");

// @ts-expect-error: rawSymbol does not exist on any obj
export const unwrapProxy = <Obj extends object>(obj: Obj): Obj => obj?.[rawSymbol] ?? obj;

const createLoggingProxy = <Obj extends Logic>(obj: Obj, options: InternalLogicOptions) => {
    const allPropertyNames = getAllPropertyNames(obj);

    // derived should be a let statement
    // eslint-disable-next-line prefer-const
    let immutableData = $derived.by(() => snapshot(getValuesByKeys(obj, allPropertyNames)));

    return new Proxy(obj, {
        get(target, prop, receiver) {
            if (prop === rawSymbol) return target;

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
                            allPropertyNames,
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
                                allPropertyNames,
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
                                        allPropertyNames,
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
                                        allPropertyNames,
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
                                allPropertyNames,
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

            if (isUninitialized(value)) {
                console.error(`Accessed "${String(prop)}" before initializing it.`);
            }

            return options.enforceImmutableData ? Reflect.get(immutableData, prop) : value;
        },
        set(target, prop, value) {
            if (options.enforceImmutableData) {
                console.error(`Tried to set field "${String(prop)}" from outside the ${options.className} class to:`, value);
            } else Reflect.set(target, prop, value);

            return true;
        },
    }) as Obj;
};

export const createUpdateLogic = <T extends Logic>(Class: Constructor<T>, options: Partial<LogicOptions> = {}) => {
    const t = new Class();

    const className = Class.name || "<unnamed class>";

    const internalOptions: InternalLogicOptions = {
        logging: import.meta.env.DEV,
        enforceImmutableData: true,
        ...options,
        className,
    };

    return createLoggingProxy(t, internalOptions) as T;
};
