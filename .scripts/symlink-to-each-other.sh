#!/usr/bin/env bash

IFS=$'\n' read -d '' -r -a packages <$(dirname $0)/RELEASABLE_PACKAGES

for d in "${packages[@]}"; do
  echo "> ($d)";
  cd $d;
  mkdir -p node_modules;
  deps=$(cat ./package.json | echo $(../node_modules/.bin/jase dependencies));
  devdeps=$(cat ./package.json | echo $(../node_modules/.bin/jase devDependencies));
  for d2 in "${packages[@]}"; do
    if `echo ${deps} | grep "@cycle/${d2}" 1>/dev/null 2>&1`; then
      echo "> symlink @cycle/$d2 in node_modules";
      mkdir -p node_modules/@cycle;
      ln -s "../../../"$d2 "node_modules/@cycle/"$d2;
    fi
    if `echo ${devdeps} | grep "@cycle/${d2}" 1>/dev/null 2>&1`; then
      echo "> symlink @cycle/$d2 in node_modules";
      mkdir -p node_modules/@cycle;
      ln -s "../../../"$d2 "node_modules/@cycle/"$d2;
    fi
  done
  ls -la node_modules/@cycle || :;
  echo "";
  cd ..;
done
