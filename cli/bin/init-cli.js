#!/usr/bin/env node

const path = require('path');
const tsConfigPaths = require('tsconfig-paths');
const baseUrl = path.resolve(__dirname, '..');

tsConfigPaths.register({
    baseUrl,
    paths: {
        'src/*': ['./dist/src/*'],
    },
});

require('../dist/src/cli');
