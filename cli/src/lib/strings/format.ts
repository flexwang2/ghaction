// Convert a string to a fixed length.
// If original string is longer, result is a truncated string
// If original string is shorter, result is a padded string
//
// example:
//
//      fixedLen("abcdef", 3)   ==   "abc"
//      fixedLen("a", 3)        ==   "a  "
//
export function fixedLen(
    value: string,
    len: number,
    pad = ' ',
    reverseAlign = false
): string {
    if (value.length > len) {
        return value.slice(0, len);
    }

    if (value.length < len) {
        const padding = new Array(len - value.length + 1).join(pad);
        if (reverseAlign) {
            return `${padding}${value}`;
        }
        return `${value}${padding}`;
    }

    return value;
}

export function stripQuotes(value: string): string {
    if (value[0] === `"` && value[value.length - 1] === `"`) {
        return value.slice(1, -1);
    }

    if (value[0] === `'` && value[value.length - 1] === `'`) {
        return value.slice(1, -1);
    }

    return value;
}

export function convertToPascalCase(value: string): string {
    if (value.length === 0) {
        return value;
    }

    const output = [];
    let inWord = false;
    let i = 0;

    while (i < value.length) {
        const char = value[i];
        const isSeparator = /-|_/.test(char);

        if (isSeparator) {
            inWord = false;
            i++;
            continue;
        }

        if (!inWord) {
            output.push(char.toUpperCase());
            inWord = true;
            i++;
            continue;
        }

        output.push(char);
        i++;
        continue;
    }

    return output.join('');
}

export function convertToCamelCase(value: string): string {
    if (value.length === 0) {
        return value;
    }

    const pcase = convertToPascalCase(value);
    return pcase[0].toLowerCase() + pcase.slice(1);
}

export function convertToDashCase(value: string): string {
    if (value.length === 0) {
        return value;
    }

    const output = [];
    let i = 0;

    // first replace all spaces
    value = value.replace(/ /g, '-');

    while (i < value.length) {
        const char = value[i];
        const isSeparator = /-|_/.test(char);
        const isUppercase = /[A-Z]/.test(char);

        if (isSeparator || isUppercase) {
            if (output.length && output[output.length - 1] !== '-') {
                output.push('-');
            }

            if (isUppercase) {
                output.push(char.toLowerCase());
            }

            i++;
            continue;
        }

        output.push(char.toLowerCase());
        i++;
        continue;
    }

    return output.join('');
}

export function convertToSnakeCase(value: string): string {
    return convertToDashCase(value).replace(/-/g, '_');
}
