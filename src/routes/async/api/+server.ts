import { json, type RequestHandler } from "@sveltejs/kit";
import type { NamesResponse } from "./types.js";

export const GET: RequestHandler = ({ url }) => {
    // Sample data - a list of names
    const names = [
        "Alice",
        "Bob",
        "Charlie",
        "David",
        "Eve",
        "Frank",
        "Grace",
        "Heidi",
        "Ivan",
        "Judy",
    ];

    const filter = url.searchParams.get("filter")?.toLowerCase();

    const filteredNames = filter
        ? names.filter((name) => name.toLowerCase().includes(filter))
        : names;

    const response: NamesResponse = {
        names: filteredNames,
    };

    return json(response);
};
