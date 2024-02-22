#!/bin/sh
# This script runs the markdown example and outputs the result
deno run --allow-read --allow-write --allow-run mod.ts --in=examples/input/markdown.vto --data=examples/input/markdown.jsonc --out=examples/output/markdown.md --flags=none
cat examples/output/markdown.md