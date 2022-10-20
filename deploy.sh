#!/usr/bin/env sh

# abort on errors
set -e

# build
yarn build

# navigate into the build output directory
cd dist


git init
git checkout -b main
git add -A
git commit -m 'deploy'

git push -f git@github.com:zackexplosion/auto-script-to-final-cut-xml.git main:gh-pages

cd -