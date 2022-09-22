#!/bin/bash

# Verify $NEEVA_REPO is set
if [[ "${NEEVA_REPO}" == "" ]]
then
    echo "\$NEEVA_REPO must be set. Please add it to your environment."
    exit 1
fi

# Set CLI_ROOT relative to NEEVA_REPO
CLI_ROOT="${NEEVA_REPO}/cli"
CLI_NODE_MODULES="${CLI_ROOT}/node_modules"
CLI_SRC_HASH="${CLI_ROOT}/.src-hash"
CLI_DEPS_HASH="${CLI_ROOT}/.deps-hash"
CLI_DIST="${CLI_ROOT}/dist"

# Ensure CLI_ROOT is a valid directory
if [[ ! -d "${CLI_ROOT}" ]]
then
    echo "Cannot locate \$CLI_ROOT: ${CLI_ROOT} is not a directory. Please ensure \$NEEVA_REPO points at your neevaco/neeva repo root directory."
    exit 1
fi

cd "${NEEVA_REPO}/cli"

# Remove dependencies
rm -rf "${CLI_NODE_MODULES}"
if [[ $? != 0 ]]
then
    echo "Unable to delete node_modules directory ${CLI_NODE_MODULES}."
    exit 1
fi
echo "- Removed ${CLI_NODE_MODULES}"

# Remove hash of node deps
rm -rf "${CLI_DEPS_HASH}"
if [[ $? != 0 ]]
then
    echo "Unable to delete hash file ${CLI_DEPS_HASH}."
    exit 1
fi
echo "- Removed ${CLI_DEPS_HASH}"

# Remove hash of compiled source
rm -rf "${CLI_SRC_HASH}"
if [[ $? != 0 ]]
then
    echo "Unable to delete hash file ${CLI_SRC_HASH}."
    exit 1
fi
echo "- Removed ${CLI_SRC_HASH}"

# Remove compiled source
rm -rf "${CLI_DIST}"
if [[ $? != 0 ]]
then
    echo "Unable to delete dist directory ${CLI_DIST}."
    exit 1
fi
echo "- Removed ${CLI_DIST}"

echo ""
echo "Success: Reset complete."