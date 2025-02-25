<p align="center"><a href="https://github.com/mattvr/dgen">
<img src="/etc/dgen.svg" ></a></p>
<p align="center"><strong>Turn data into generated code and text files.</strong></p>
<h4 align="center"><strong><a href="https://orgsoft.org/discord"><img src="https://github.com/mattvr/ShellGPT/assets/4052466/9ba871c8-451c-4178-9035-645142b617d9" /> Discord </a></strong></h4>

---

`dgen` takes a template file, plus some data or executable code, and then generates a new file from it.

It simplifies going from structured data to code – and can be used to generate and format TypeScript, HTML, Markdown, JSON, blog posts, or **any** other type of text file.

This can be used as a command line utility, or as a module in your own codebase
via its exported `codegen` function.

## Examples

<p align="center"><img src="/etc/md.png" ></p>
<p align="center"><img src="/etc/ts.png" ></p>

Generate Markdown, Typescript, and much more. Check out the full [examples](examples/).

## Setup

[Install Deno](https://docs.deno.com/runtime/manual) and ensure it is in your
path.

Then, run: `deno install -frA --name=dgen jsr:@orgsoft/dgen`

This will install `dgen` as a command line utility.

## Usage

A template is required, and ideally a data file or some TypeScript code to
return data.

Templates must be [vento (.vto) files](https://github.com/oscarotero/vento).


```sh
# Use with input file, data, and output.
dgen --in=myCodegenTemplate.vto --data=myCodegenData.json --out=myCodegenFile.ts

# Use with input file, data, output, plus additional processor step.
dgen --in=myCodegenTemplate.vto --data=myCodegenData.json --processor=myTransformationStep.ts --out=myCodegenFile.ts
```

### Command Line Arguments

| Option        | Description                                                                                                                            | Example Usage                  |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| `--in`        | Path to the template file (vento .vto template), required                                                                              | `--in <template.vto>`          |
| `--out`       | Path to the output file, optional, will print to stdout if not provided                                                                | `--out <output.ts>`            |
| `--data`      | Path to the data file (JSON or JSONC), optional                                                                                        | `--data <data.json>`           |
| `--processor` | Path to the JS/TS processor file, optional                                                                                             | `--processor <processor.ts>`   |
| `--flags`     | Additional flags to run alongside the codegen process, optional. Accepts 'fmt', 'check', 'print_info'. Set to 'none' to skip defaults. | `--flags fmt,check,print_info` |
| `--help`      | Print the help message                                                                                                                 | `--help`                       |
