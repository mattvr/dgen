#!/bin/sh
# This script runs the processor example and outputs the result
deno run --allow-read --allow-write --allow-run mod.ts --in=examples/input/processor.vto --processor=./examples/input/processor.ts --out=examples/output/processor.md --flags=none
cat examples/output/processor.md