#!/bin/bash

# This script runs an npm command for every registered package
# in the file `npm-packages`.
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
  if [ $exitstatus -ne 0 ]; then
    break;
    exit $exitstatus;
  fi
  cd ..;
done <$(dirname $0)/npm-packages

exit $exitstatus
