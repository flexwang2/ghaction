import * as log from 'src/lib/log';
import * as stdio from 'src/lib/stdio';
import { Arguments } from 'src/arguments';
import { CommandModule } from 'yargs';
import {
    issuerIDFile,
    keyFile,
    keyIDFile,
    privateKeyDir,
} from 'src/nativeui/app-store-connect';

export const BuildSetupCommand: CommandModule<Arguments, Arguments> = {
    command: 'build-setup',
    aliases: 'setup',
    describe: 'Setup build environment',
    builder: (yargs) => yargs,
    handler: async (): Promise<void> => {
        let updateKeyID = true;
        if (keyIDFile().exists()) {
            updateKeyID = await stdio.yesNoPrompt(
                `KeyID file (${keyIDFile().toString()}) exists. Overwrite?`,
                false
            );
        }
        if (updateKeyID) {
            log.info('Please get the key id from 1Password.');
            log.info(
                'This will be in the shared "Credentials and certificates" value, in an entry titled "App Store connect API key'
            );
            const keyID = await stdio.readValue();
            try {
                privateKeyDir().mkdirp();
                keyIDFile().write(keyID);
            } catch (err) {
                log.error(err);
                process.exit(1);
            }
        }

        let updateIssuerID = true;
        if (issuerIDFile().exists()) {
            updateIssuerID = await stdio.yesNoPrompt(
                `IssuerID file (${issuerIDFile().path}) exists. Overwrite?`,
                false
            );
        }
        if (updateIssuerID) {
            log.info(
                'Please get the issuer id from 1Password. This will be in the shared "Credentials and certificates" value, in an entry titled "App Store connect API key'
            );
            const issuerID = await stdio.readValue();
            try {
                privateKeyDir().mkdirp();
                issuerIDFile().write(issuerID);
            } catch (err) {
                log.error(err);
                process.exit(1);
            }
        }

        if (!keyFile().exists()) {
            log.info(
                `Please copy the ${
                    keyFile().basename
                } file from 1Password to  ${keyFile().path}`
            );
            await stdio.readLine({
                prompt: '[press ENTER to continue]',
            });
        }
        if (!keyFile().exists()) {
            log.error(`Key file not found at ${keyFile().path}`);
            process.exit(1);
        }

        log.success('Update complete');
    },
};
