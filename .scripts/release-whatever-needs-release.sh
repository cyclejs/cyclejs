#!/bin/bash

# This script checks each package and if it needs a new version
# released, then it publishes that new version.

needsRelease=0
exitstatus=0

while read d; do
  echo "> ($d)";
  echo "> ... check if it needs a new version released, and publishes";
  echo "";
  cd $d;
  needsRelease=0
  node ../.scripts/check-release.js $d || needsRelease=$?;
  if [ $needsRelease -eq 1 ]; then
    npm run release-patch || exitstatus=$?;
  elif [ $needsRelease -eq 2 ]; then
    npm run release-minor || exitstatus=$?;
  elif [ $needsRelease -eq 3 ]; then
    npm run release-major || exitstatus=$?;
  fi
  cd ..;
  if [ $exitstatus -ne 0 ]; then
    break;
    exit $exitstatus;
  fi
done <$(dirname $0)/NPM_PACKAGES

exit $exitstatus