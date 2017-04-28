#!/bin/bash

# Runs test for each package

for PACKAGE in $(cat .scripts/RELEASABLE_PACKAGES) ; do
  make test $PACKAGE
done
