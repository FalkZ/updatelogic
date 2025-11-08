import type { Constructor } from "type-fest";
import { snapshot } from "./snapshot.svelte.js";
import { isUninitialized } from "./uninitialized.js";
import { isPromise } from "./utils.js";
import { getValuesByKeys, log } from "./log.js";
import { getAllPropertyNames } from "./get-all-property-names.js";
import { browser } from "$app/environment";

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

export function computed<T>(t: () => T): Readonly<T> {
    const raw = t();
    const v = $derived(raw);

    if (typeof raw !== "object" || raw === null) return v;

    return new Proxy(v as typeof raw, {
        get: (target, p) => target[p as keyof T],
        // TODO: set with warning mutation
        getOwnPropertyDescriptor(target, prop) {
            return Object.getOwnPropertyDescriptor(target, prop);
        },
        ownKeys(target) {
            return Reflect.ownKeys(target);
        },
    }) as T;
}

// @ts-expect-error: rawSymbol does not exist on any obj
export const unwrapProxy = <Obj extends object>(obj: Obj): Obj => obj?.[rawSymbol] ?? obj;

type DevTools = ReturnType<NonNullable<Window["__REDUX_DEVTOOLS_EXTENSION__"]>["connect"]>;

const createLoggingProxy = <Obj extends Logic>(obj: Obj, options: InternalLogicOptions) => {
    let devtools: DevTools;

    const allPropertyNames = getAllPropertyNames(obj);

    if (typeof window !== "undefined" && window.__REDUX_DEVTOOLS_EXTENSION__) {
        devtools = window.__REDUX_DEVTOOLS_EXTENSION__.connect({ name: options.className });
        devtools.init(getValuesByKeys(obj, allPropertyNames));
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

                        devtools?.send({ type: `→ ${prop}`, args }, getValuesByKeys(target, allPropertyNames));
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

                            devtools?.send({ type: `❌ ${prop}`, args, error: err }, getValuesByKeys(target, allPropertyNames));
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

                                    devtools?.send({ type: `✓ ${prop}`, args, return: value }, getValuesByKeys(target, allPropertyNames));
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
                                    devtools?.send({ type: `❌ ${prop}`, args, error: err }, getValuesByKeys(target, allPropertyNames));
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

                            devtools?.send({ type: `✓ ${prop}`, args, return: result }, getValuesByKeys(target, allPropertyNames));
                        }
                    }

                    return result;
                };
            }

            if (isUninitialized(value)) {
                // TODO: warn
                console.error(`Accessed "${String(prop)}" before initializing it.`);
            }

            if (options.enforceImmutableData) {
                return computed(() => value);
            }

            return value;
        },
        set(target, prop, value) {
            if (options.enforceImmutableData) {
                // TODO warn
                console.error(`Tried to set field "${prop}" from outside the ${options.className} class to:`, value);
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
