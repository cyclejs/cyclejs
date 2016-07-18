#!/bin/bash

# This script runs an npm command for every registered package
# in the file `NPM_PACKAGES`.
#
# E.g.: calling this script will the command line args "run test"
# will execute `npm run test` for each package.

exitstatus=0

while read d; do
  echo "> ($d)";
  echo "> npm $@";
  echo "";
  cd $d;
  npm $@ || exitstatus=$?;
  cd ..;
  if [ $exitstatus -ne 0 ]; then
    break;
    exit $exitstatus;
  fi
done <$(dirname $0)/NPM_PACKAGES

exit $exitstatus
