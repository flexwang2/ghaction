export interface Arguments {
    // If this flag is passed, run in unattended mode: do not prompt user for any input.
    noPrompt: boolean;
    // If the flag is passed, sets the log verbosity.
    verbosity?: string;
    // If the flag is passed, sets the working directory of the command.
    cwd?: string;
}
