#!/bin/bash

IFS=$'\n' read -d '' -r -a packages <$(dirname $0)/npm-packages

for d in "${packages[@]}"; do
  echo "> ($d)";
  cd $d;
  deps=$(cat ./package.json | echo $(../node_modules/.bin/jase dependencies));
  devdeps=$(cat ./package.json | echo $(../node_modules/.bin/jase devDependencies));
  for d2 in "${packages[@]}"; do
    if `echo ${deps} | grep "@cycle/${d2}" 1>/dev/null 2>&1`; then
      echo "> npm link $d2";
      npm link @cycle/$d2;
    fi
    if `echo ${devdeps} | grep "@cycle/${d2}" 1>/dev/null 2>&1`; then
      echo "> npm link $d2";
      npm link @cycle/$d2;
    fi
  done
  echo "";
  cd ..;
done
