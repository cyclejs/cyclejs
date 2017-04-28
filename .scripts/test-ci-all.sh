#!/bin/bash

# Runs CI tests for each package

for PACKAGE in $(cat .scripts/RELEASABLE_PACKAGES) ; do
  make test-ci $PACKAGE
done
