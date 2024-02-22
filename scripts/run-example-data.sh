#!/bin/sh
# This script runs the data example and outputs the result of executing the generated file
deno run --allow-read --allow-write --allow-run mod.ts --in=examples/input/data.vto --data=examples/input/data.jsonc --out=examples/output/data.ts
deno run examples/output/data.ts