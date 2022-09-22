/* eslint-disable no-console */
/* eslint-disable no-unused-expressions */
const yargs = require('yargs');
const stringHash = require('string-hash');
const fs = require('fs');
const path = require('path');

function hashFileName() {
    return path.join(__dirname, '.deps-hash');
}

function getDepsHash() {
    const {
        dependencies,
        peerDependencies,
        devDependencies,
        scripts,
    } = require('./package.json');

    // Hash should change if any dependency or pre/post install
    // scripts in package.json change
    return stringHash(
        JSON.stringify({
            dependencies,
            peerDependencies,
            devDependencies,
            preinstall: scripts.preinstall,
            postinstall: scripts.postinstall,
        })
    ).toString();
}

function getSavedHash() {
    const fileExists = fs.existsSync(hashFileName());
    if (!fileExists) {
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
    const depsHash = getDepsHash();
    if (depsHash !== savedHash) {
        !argv.q &&
            console.log(
                `hashes do not match: got ${depsHash}, saved ${savedHash}`
            );
        process.exit(1);
    }
}

async function writeHash(argv) {
    const depsHash = getDepsHash();
    !argv.q && console.log(`writing deps hash ${depsHash}`);
    fs.writeFileSync(hashFileName(), depsHash);
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
        'Check if the cli dependencies have been modified',
        {},
        async (argv) => await checkHash(argv)
    )
    .command(
        'write',
        'Write a new hash of the dependencies specified in package.json to .deps-hash',
        {},
        (argv) => writeHash(argv)
    )
    .command(
        'print',
        'Print the hash of the dependencies specified in package.json stdout',
        {},
        () => console.log(getDepsHash())
    )
    .demandCommand().argv;
