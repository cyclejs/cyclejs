#!/usr/bin/env bash

# This script checks if the Travis build for the latest commit has passed,
# and if it has, then it runs check-release. Otherwise it tells the status
# of the build: pending or failed.

GIT_TRAVIS_OUTPUT=$(mktemp);
git travis > $GIT_TRAVIS_OUTPUT;

if grep -q "(passed)" $GIT_TRAVIS_OUTPUT; then
  node $(dirname $0)/check-release.js;
elif grep -q "(errored)" $GIT_TRAVIS_OUTPUT; then
  echo "Travis build FAILED";
  echo "";
  echo "The most recent commit sent to Travis has failed passing the tests.";
  echo "Please fix it before releasing any new version.";
else
  echo "Travis build IN PROGRESS";
  echo "";
  echo "The most recent commit sent to Travis is currently being tested.";
  echo "Please wait until it has finished before releasing any new version.";
fi
