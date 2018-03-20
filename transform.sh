#!/bin/bash

SOVRN_PREFIX="\"sovrn-\""
SOVRN_GIT_REPO="\"https://github.com/sovrn/Prebid.js.git\""
SOVRN_NPM_REPO="\"http://nexus.prod.lijit.com/repository/npm-sovrn/\""

PACKAGE_FILE="package.json"
TMP_FILE="package.tmp.json"

jq ". += {name: (${SOVRN_PREFIX} + .name), version: (${SOVRN_PREFIX} + .version), repository: (.repository + {url: ${SOVRN_GIT_REPO}}), publishConfig: {registry:${SOVRN_NPM_REPO}}}" ${PACKAGE_FILE} > ${TMP_FILE}

mv ${TMP_FILE} ${PACKAGE_FILE}
