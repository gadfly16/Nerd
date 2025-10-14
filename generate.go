package main

// Web GUI build generation
// Type check first (no emit), then bundle with esbuild
//go:generate sh -c "cd web && npx tsc --noEmit"
//go:generate npx esbuild ./web/src/gui.ts --bundle --format=esm --outfile=./web/dist/gui.js --sourcemap --minify --tree-shaking=false
