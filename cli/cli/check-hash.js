/* eslint-disable no-console */
/* eslint-disable no-unused-expressions */
const yargs = require('yargs');
const hash = require('folder-hash');
const fs = require('fs');
const path = require('path');

function hashFileName() {
    return path.join(__dirname, '.src-hash');
}

async function getFolderHash() {
    const hashOptions = {
        folders: {
            exclude: ['node_modules', 'dist'],
        },
        files: {
            include: ['package.json', 'src/*', 'src/**/*'],
            matchBasename: false,
            matchPath: true,
        },
    };
    return await hash.hashElement('.', hashOptions);
}

async function printHash() {
    console.log(JSON.stringify(await getFolderHash(), null, 2));
}

function getSavedHash() {
    const folderExists = fs.existsSync(hashFileName());
    if (!folderExists) {
        return '';
    }
    const contents = fs.readFileSync(hashFileName()).toString().trim();
    return contents;
}

async function checkHash(argv) {
    const savedHash = getSavedHash();
    if (!savedHash) {
        !argv.q && console.log('no saved hash found');
        process.exit(1);
    }
    const folderHash = (await getFolderHash()).hash;
    if (folderHash !== savedHash) {
        !argv.q &&
            console.log(
                `hashes do not match: got ${folderHash}, saved ${savedHash}`
            );
        process.exit(1);
    }
}

async function writeHash(argv) {
    const folderHash = (await getFolderHash()).hash;
    !argv.q && console.log(`writing folder hash ${folderHash}`);
    fs.writeFileSync(hashFileName(), folderHash);
}

yargs
    .usage('Usage: $0 <command>')
    .option('q', {
        alias: 'quiet',
        type: 'boolean',
        describe: 'quiet mode - no output',
    })
    .command(
        'check',
        'Check if the cli source code has been modified.',
        {},
        async (argv) => await checkHash(argv)
    )
    .command(
        'write',
        'Write a new hash of the neeva cli code to .src-hash',
        {},
        async (argv) => await writeHash(argv)
    )
    .command(
        'print',
        'Print the hash of the source folder to stdout',
        {},
        async () => await printHash()
    )
    .demandCommand().argv;
