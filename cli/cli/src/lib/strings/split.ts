export function safeSplit(cmd: string): string[] {
    const result = [];
    let buffer = '';
    let quote = null;

    for (let i = 0; i < cmd.length; i++) {
        const char = cmd[i];

        if (char === ' ' && !quote) {
            result.push(buffer);
            buffer = '';
            continue;
        }

        if (char === `"` || char === `'`) {
            if (char === quote) {
                quote = null;
                continue;
            }

            if (!quote) {
                quote = char;
                continue;
            }
        }

        buffer += char;
    }

    if (buffer.length) {
        result.push(buffer);
    }

    return result;
}
