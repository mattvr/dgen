#!/bin/sh
# This script runs the basic example from its default alias `dgen`, requiring the project to be installed
dgen --in=examples/input/basic.vto --out=examples/output/basic.ts
deno run examples/output/basic.ts