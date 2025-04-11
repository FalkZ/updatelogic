export const stringToHexColor = (str: string): string => {
    let hash = 0;

    // Generate a hash code from the string
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Convert hash to hex color with brightness cap
    let color = "#";
    for (let i = 0; i < 3; i++) {
        // Extract RGB components
        let value = (hash >> (i * 8)) & 0xff;

        // Cap brightness - ensure values aren't too high (max 180 out of 255)
        // This prevents white or very light colors
        const MAX_BRIGHTNESS = 180;
        value = Math.min(value, MAX_BRIGHTNESS);

        color += value.toString(16).padStart(2, "0");
    }

    return color;
};
