#!/usr/bin/env bash
M=$1
PKG=$2

if [[ -z $M ]] || [[ -z $PKG ]] || [[ $M != "minor" && $M != "major" ]]; then
  echo "Please run \"pnpm run release -- M PKG\" where M=minor|major, PKG=package"
  exit 1
fi

pnpm recursive test --filter "@cycle/$PKG"

if [ "$M" = "minor" ]; then
  .scripts/bump.js "$PKG/package.json" --minor
elif [ "$M" = "major" ]; then
  .scripts/bump.js "$PKG/package.json" --major
else
  echo "Please provide \"minor\" or \"major\""
fi

pnpm run docs
pnpm recursive run changelog --filter "@cycle/$PKG"
git add -A
git commit -m "release($PKG): $(cat $PKG/package.json | $(pnpm bin)/jase version)"
git push origin master
pnpm recursive publish exec --filter "@cycle/$PKG"
echo "✓ Released new $M for $PKG"
