#!/bin/bash

# Verify yarn is installed
if ! command -v yarn &> /dev/null
then
    echo "yarn could not be found."
    echo "Refer to https://paper.dropbox.com/doc/How-to-install-and-upgrade-node.js--A3FIT8GRObdJvZ0j2SWZ7qxcAg-XQle79OF60meLf55up9jp for instructions."
    exit 1
fi

# Verify node is installed
if ! command -v node &> /dev/null
then
    echo "node could not be found."
    echo "Refer to https://paper.dropbox.com/doc/How-to-install-and-upgrade-node.js--A3FIT8GRObdJvZ0j2SWZ7qxcAg-XQle79OF60meLf55up9jp for instructions."
    exit 1
fi

# Verify node version is correct ONLY IF not runnning on CircleCI
# Currently prebuilt cimg/go image only supports up to Node v14. Condition should be removed once it is upgraded.
if ! [[ ${NEEVA_CI_RUN} ]] && [[ $(node -v| cut -c 2-3) != "16" ]]
then
    echo "Node version 16 is required. Found: $(node -v)."
    echo "Refer to https://paper.dropbox.com/doc/How-to-install-and-upgrade-node.js--A3FIT8GRObdJvZ0j2SWZ7qxcAg-XQle79OF60meLf55up9jp for installation instructions."
    exit 1
fi

# Verify $NEEVA_REPO is set
if [[ "${NEEVA_REPO}" == "" ]]
then
    echo "\$NEEVA_REPO must be set. Please ensure \$NEEVA_REPO points at your neevaco/neeva repo root directory."
    exit 1
fi

# Set CLI_ROOT relative to NEEVA_REPO
CLI_ROOT="${NEEVA_REPO}/cli"
CLI_NODE_MODULES="${CLI_ROOT}/node_modules"

# Ensure CLI_ROOT is a valid directory
if [[ ! -d "${CLI_ROOT}" ]]
then
    echo "Cannot locate \$CLI_ROOT: ${CLI_ROOT} is not a directory. Please ensure \$NEEVA_REPO points at your neevaco/neeva repo root directory."
    exit 1
fi

WORKING_DIR=$(pwd)

cd "${NEEVA_REPO}/cli"

# Hard reset, wipe out node_modules
if [[ "$1" == "reset" ]]
then
    ${CLI_ROOT}/reset.sh
    exit $?
fi

# Ensure node dependencies have been installed
# Note: this simply checks if the node_modules directory exists
if [[ ! -d "${CLI_NODE_MODULES}" ]]
then
    yarn install
    if [[ $? != 0 ]]
    then
        echo "Installing cli node dependencies failed: please check output."
        exit 1
    fi
fi

# Check dependencies hash
yarn --silent check-deps --quiet check
if [[ $? != 0 ]]
then
    echo "Neeva CLI dependencies out of date; reinstalling."
    yarn reset
    if [[ $? != 0 ]]
    then
        echo "Resetting neeva cli failed: please check output."
        exit 1
    fi
    yarn install
    if [[ $? != 0 ]]
    then
        echo "Installing cli node dependencies failed: please check output."
        exit 1
    fi
    yarn --silent check-deps --quiet write
fi

yarn --silent check-hash --quiet check
if [[ $? != 0 ]]
then
    echo "Neeva CLI out of date; recompiling."
    yarn tsc
    if [[ $? != 0 ]]
    then
        echo "TypeScript compilation failed."
        exit 1
    fi
    yarn --silent check-hash --quiet write
fi

yarn --silent cli --cwd=${WORKING_DIR} $@
