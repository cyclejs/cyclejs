#!/usr/bin/env bash

# This script runs a yarn command for every registered package
# in the file `RELEASABLE_PACKAGES`.
#
# E.g.: calling this script will the command line args "run test"
# will execute `yarn run test` for each package.

exitstatus=0

while read d; do
  echo "> ($d)";
  echo "> yarn $@";
  echo "";
  cd $d;
  yarn $@ || exitstatus=$?;
  cd ..;
  if [ $exitstatus -ne 0 ]; then
    break;
    exit $exitstatus;
  fi
done <$(dirname $0)/RELEASABLE_PACKAGES

exit $exitstatus
