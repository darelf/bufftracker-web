#!/usr/bin/env bash

browserify -r numeral -r ./client.js -o static/bundle.js
