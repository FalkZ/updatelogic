/* eslint-disable @typescript-eslint/no-explicit-any */
import { snapshot } from "./snapshot.svelte.js";
import { stringToHexColor } from "./string-to-hex-color.js";
import type { Logic } from "./update-logic.svelte.js";

/**
 * Creates a plain object from an object with getters by accessing each property
 * @param obj - The source object with get methods
 * @returns A plain object with the values extracted from the getters
 */
export function getValuesByKeys(obj: object, keys: string[]): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    // Process all properties
    for (const key of keys) {
        const descriptor = Object.getOwnPropertyDescriptor(obj, key) || Object.getOwnPropertyDescriptor(Object.getPrototypeOf(obj), key);
        try {
            if (descriptor?.get) {
                result[key] = (obj as any)[key];
            } else if (typeof (obj as any)[key] !== "function") {
                result[key] = (obj as any)[key];
            }
        } catch (e) {
            console.error(e);
            // Skip properties that throw errors when accessed
        }
    }

    return result;
}

type LogOptions = {
    start: boolean;
    prop: string | number | symbol;
    args: unknown[];
    target: Logic;
    allPropertyNames: string[];
    error?: true;
    meta?: { label: string; data: unknown };
};
export const log = ({ start, args, prop, target, error, meta, allPropertyNames }: LogOptions) => {
    const groupSymbol = start ? "┏" : "┗";
    const defaultLog = error ? console.error : console.log;
    const group = error ? console.group : console.groupCollapsed;

    const key = String(prop);

    group(
        `%c${groupSymbol} ${key}`,
        `color: white; font-size: 0.9em; font-weight: 400; letter-spacing: 3px; background: ${stringToHexColor(String(key))}; border-radius: 2px; padding: 1px 2px;`,
        ...args,
    );
    console.log(`%cSTATE:`, "color: gray; font-size: 0.8em; letter-spacing: 3px;");

    console.log(snapshot(getValuesByKeys(target, allPropertyNames)));

    if (meta) {
        console.log(`%c${meta.label.toUpperCase()}:`, "color: gray; font-size: 0.8em; letter-spacing: 3px;");
        defaultLog(meta.data);
    }

    console.groupEnd();
};
