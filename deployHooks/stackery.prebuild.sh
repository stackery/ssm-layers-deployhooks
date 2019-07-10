#!/bin/bash

# pull in profile

cd deployHooks/retrieveLayers
npm install
node ./retrieve.js $@