import { ShellType, SystemCaps } from './types';

export function getShellCaps(): SystemCaps['shell'] {
    const { SHELL, bash } = process.env;

    let type: keyof typeof ShellType = 'Unknown';
    if (bash?.length) {
        type = 'Bash';
    } else if (/\/zsh/i.test(SHELL ?? '')) {
        type = 'Zsh';
    }

    return {
        path: bash ?? SHELL ?? '',
        type,
    };
}
