import type { Constructor } from "type-fest";
import { snapshot } from "./snapshot.svelte.js";
import { isUninitialized } from "./uninitialized.js";
import { isPromise } from "./utils.js";
import { pickObjectKeys, log } from "./log.js";
import { getAllPropertyNames } from "./get-all-property-names.js";

type InternalLogicOptions = { className: string; logging: boolean; enforceImmutableData: boolean };

const isObject = (value: unknown): value is object => typeof value === "object" && value !== null;

const immutableWithWarning = <T extends object>(raw: T): T => {
    return new Proxy(raw, {
        get: (target, key) => {
            const value = target[key as keyof T];

            if (isObject(value)) {
                return immutableWithWarning(value);
            }

            return value;
        },
        set: (target, key, value) => {
            console.warn(`Attempted to mutate immutable data`, { target, key, value });

            return true;
        },
        getOwnPropertyDescriptor(target, prop) {
            return Object.getOwnPropertyDescriptor(target, prop);
        },
        ownKeys(target) {
            return Reflect.ownKeys(target);
        },
    }) as T;
};

export function computed<T>(t: () => T): Readonly<T> {
    const raw = t();
    const v = $derived(raw);

    if (isObject(raw)) immutableWithWarning(v as typeof raw);

    return v;
}

const rawSymbol = Symbol("raw");
// @ts-expect-error: rawSymbol does not exist on any obj
export const unwrapProxy = <Obj extends object>(obj: Obj): Obj => obj?.[rawSymbol] ?? obj;

type DevTools = ReturnType<NonNullable<Window["__REDUX_DEVTOOLS_EXTENSION__"]>["connect"]>;

const createUpdateLogicInternal = <Obj extends object>(obj: Obj, options: InternalLogicOptions): Obj => {
    let devtools: DevTools;

    const allPropertyNames = getAllPropertyNames(obj);

    if (typeof window !== "undefined" && window.__REDUX_DEVTOOLS_EXTENSION__) {
        devtools = window.__REDUX_DEVTOOLS_EXTENSION__.connect({ name: options.className });
        devtools.init(pickObjectKeys(obj, allPropertyNames));

        devtools.subscribe((message) => {
            if (message.type === "DISPATCH" && message.state) {
                // Parse the state from devtools
                const newState = JSON.parse(message.state);

                allPropertyNames.forEach((key) => {
                    obj[key] = newState[key];
                });
            }
        });
    }

    return new Proxy(obj, {
        get(target, prop: string | typeof rawSymbol, receiver) {
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

                        devtools?.send({ type: `→ ${prop}`, args }, pickObjectKeys(target, allPropertyNames));
                    }

                    let result;
                    try {
                        const proxyThis = options.enforceImmutableData
                            ? // remove enforceImmutableData that methods can mutate
                              createUpdateLogicInternal(target, {
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

                            devtools?.send({ type: `❌ ${prop}`, args, error: err }, pickObjectKeys(target, allPropertyNames));
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

                                    devtools?.send({ type: `✓ ${prop}`, args, return: value }, pickObjectKeys(target, allPropertyNames));
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
                                    devtools?.send({ type: `❌ ${prop}`, args, error: err }, pickObjectKeys(target, allPropertyNames));
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

                            devtools?.send({ type: `✓ ${prop}`, args, return: result }, pickObjectKeys(target, allPropertyNames));
                        }
                    }

                    return result;
                };
            }

            if (isUninitialized(value)) {
                // TODO: warn
                console.warn(`Accessed "${String(prop)}" before initializing it.`);
            }

            if (options.enforceImmutableData) {
                const derivedValue = $derived(value);

                if (isObject(value)) return immutableWithWarning(derivedValue as typeof value);

                return derivedValue;
            }

            return value;
        },
        set(target, key, value) {
            if (options.enforceImmutableData) {
                console.warn(`Attempted to mutate immutable data`, { target, key, value });
            } else Reflect.set(target, key, value);

            return true;
        },
    }) as Obj;
};

/**
 *
 * Creates an instance of a class with immutable state and derived properties.
 *
 * The Redux DevTools integration monitors every function call and
 * tracks all state at that point. Install Redux DevTools browser extension
 * to use this feature ([installation instructions](https://github.com/reduxjs/redux-devtools/tree/main/extension#installation)).
 *
 * @param Class - The class to use as base for state management
 * @returns An enhanced instance of the supplied class
 */
export const createUpdateLogic = <T>(Class: Constructor<T>) => {
    const t = new Class();

    const className = Class.name || "<unnamed class>";

    const internalOptions: InternalLogicOptions = {
        logging: import.meta.env.DEV,
        enforceImmutableData: true,
        className,
    };

    return createUpdateLogicInternal(t, internalOptions) as T;
};
