#!/usr/bin/env bash

# Runs test for each package

exitcode=0

for PACKAGE in $(cat .scripts/RELEASABLE_PACKAGES) ; do
  make test $PACKAGE || exitcode=$?
done

exit $exitcode
