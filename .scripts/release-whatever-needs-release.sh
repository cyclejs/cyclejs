#!/usr/bin/env bash

# This script checks each package and if it needs a new version
# released, then it publishes that new version.

needsRelease=0
exitstatus=0

while read d; do
  echo "> ($d)";
  echo "> ... check if it needs a new version released, and publishes";
  echo "";
  needsRelease=0
  node .scripts/check-release.js $d || needsRelease=$?;
  if [ $needsRelease -eq 1 ]; then
    echo "WILL NOT release a patch, we are following ComVer"
  elif [ $needsRelease -eq 2 ]; then
    make release-minor $d || exitstatus=$?;
  elif [ $needsRelease -eq 3 ]; then
    make release-major $d || exitstatus=$?;
  fi
  if [ $exitstatus -ne 0 ]; then
    break;
    exit $exitstatus;
  fi
done <$(dirname $0)/RELEASABLE_PACKAGES

exit $exitstatus
