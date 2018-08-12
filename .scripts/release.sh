M=$1
PKG=$2

if [ -z $M ]; then
  echo "Please run \"pnpm run release -- M PKG\" where M=minor|major, PKG=package"
  exit 1
fi
if [ -z $PKG ]; then
  echo "Please run \"pnpm run release -- M PKG\" where M=minor|major, PKG=package"
  exit 1
fi

pnpm recursive exec --filter "@cycle/$PKG" -- pnpm test

if [ "$M" = "minor" ]; then
  .scripts/bump.js "$PKG/package.json" --minor
elif [ "$M" = "major" ]; then
  .scripts/bump.js "$PKG/package.json" --major
else
  echo "Please provide \"minor\" or \"major\""
fi

pnpm run docs
pnpm recursive exec --filter "@cycle/$PKG" -- pnpm run changelog
git add -A
git commit -m "release($PKG): $(shell cat $PKG/package.json | $(pnpm bin)/jase version)"
git push origin master
pnpm recursive exec --filter "@cycle/$PKG" -- pnpm publish
echo "✓ Released new minor for $PKG"
