import { snapshot } from "./snapshot.svelte.js";
import { stringToHexColor } from "./string-to-hex-color.js";
import type { Logic } from "./update-logic.svelte.js";

type LogOptions = {
    start: boolean;
    prop: string | number | symbol;
    args: unknown[];
    target: Logic;
    error?: true;
    meta?: { label: string; data: unknown };
};
export const log = ({ start, args, prop, target, error, meta }: LogOptions) => {
    const groupSymbol = start ? "┏" : "┗";
    const defaultLog = error ? console.error : console.log;
    const group = error ? console.group : console.groupCollapsed;

    const key = String(prop);

    group(
        `%c${groupSymbol} ${key}`,
        `color: white; font-size: 0.9em; font-weight: 400; letter-spacing: 3px; background: ${stringToHexColor(String(key))}; border-radius: 2px; padding: 1px 2px;`,
        ...args,
    );
    console.log(`%cDATA:`, "color: gray; font-size: 0.8em; letter-spacing: 3px;");
    console.log(snapshot(target.data));

    if (meta) {
        console.log(
            `%c${meta.label.toUpperCase()}:`,
            "color: gray; font-size: 0.8em; letter-spacing: 3px;",
        );
        defaultLog(meta.data);
    }

    console.groupEnd();
};
