#!/bin/sh

# This script commits staged changes while ensuring that
# both the code and commit message are properly formatted,
# using prettier and commitizen, respectively.
# The steps below ensure that only those changes caused by
# running prettier are included in the commit.
# For context: https://github.com/cyclejs/cyclejs/pull/629


# Get the staged files
tsfiles=$(git diff --cached --name-only --diff-filter=ACM | grep '\.ts\?$' | tr '\n' ' ')

# Do the commit
$(dirname $0)/../node_modules/.bin/git-cz

# Temporarily clear the working directory
stash_size=$(git stash list | wc -l)
git stash -u > /dev/null

# Run prettier
for f in $tsfiles
do
  echo "Formatting $f with prettier"
  $(dirname $0)/../node_modules/.bin/prettier --write \
  --single-quote --no-bracket-spacing --trailing-comma=all $f;
  git add $f
done

# Amend the commit to include prettier changes
git commit --amend --no-edit > /dev/null 2>&1

# Restore the working directory if previously stashed
if [ $(git stash list | wc -l) -gt $stash_size ]
then
  git stash pop > /dev/null 2>&1
fi

echo "Committed successfully"
