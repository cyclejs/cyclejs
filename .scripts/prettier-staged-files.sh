#!/bin/sh

# This script runs prettier to format each TypeScript file
# that was staged for a git commit, and then git adds each
# of those files

tsfiles=$(git diff --cached --name-only --diff-filter=ACM | grep '\.ts\?$' | tr '\n' ' ')

for f in $tsfiles
do
  echo "Formatting $f with prettier"
  $(dirname $0)/../node_modules/.bin/prettier --write \
  --single-quote --no-bracket-spacing --trailing-comma=all $f;
  git add $f
done
