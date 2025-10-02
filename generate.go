//go:build ignore

package main

// Web GUI build generation
//go:generate esbuild ./web/src/main.ts --bundle --outfile=./web/dist/gui.js --sourcemap --minify
