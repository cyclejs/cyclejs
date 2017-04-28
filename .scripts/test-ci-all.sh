#!/usr/bin/env bash

# Runs CI tests for each package
exitcode=0

for PACKAGE in $(cat .scripts/RELEASABLE_PACKAGES) ; do
  make test-ci $PACKAGE || exitcode=$?
done

exit $exitcode
