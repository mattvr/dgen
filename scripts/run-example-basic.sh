#!/bin/sh
# This script runs the basic example and outputs the result of executing the generated file
deno run --allow-read --allow-write --allow-run mod.ts --in=examples/input/basic.vto --out=examples/output/basic.ts
deno run examples/output/basic.ts