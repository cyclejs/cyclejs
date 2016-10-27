#!/bin/bash

JASE=$(dirname $0)/../../node_modules/.bin/jase
TEMP=$(mktemp);
cat $(dirname $0)/../package.json | $JASE version > ${TEMP};
cat $(dirname $0)/../src/manifest.json | $JASE version --set $(cat $TEMP) > $(dirname $0)/../src/manifest.json;