export const getAllPropertyNames = (obj: object) => {
    // Get own properties and properties from prototype chain
    const allProperties = new Set<string>();

    // Add own properties
    Object.getOwnPropertyNames(obj).forEach((key) => allProperties.add(key));

    // Add properties from prototype chain
    let proto = Object.getPrototypeOf(obj);
    while (proto && proto !== Object.prototype) {
        Object.getOwnPropertyNames(proto).forEach((key) => allProperties.add(key));
        proto = Object.getPrototypeOf(proto);
    }

    return Array.from(allProperties);
};
