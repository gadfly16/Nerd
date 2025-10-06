package main

// Web GUI build generation
//go:generate npx esbuild ./web/src/nerd_gui.ts --bundle --format=esm --outfile=./web/dist/nerd_gui.js --sourcemap --minify --tree-shaking=false
