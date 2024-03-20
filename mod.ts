import vento from "https://deno.land/x/vento@v0.12.1/mod.ts";
import { Filter } from "https://deno.land/x/vento@v0.12.1/src/environment.ts";
import { parse as parseJsonc } from "https://deno.land/std@0.212.0/jsonc/parse.ts";
import { parseArgs } from "https://deno.land/std@0.212.0/cli/parse_args.ts";
import * as path from "https://deno.land/std@0.212.0/path/mod.ts";

/**
 * Arguments object to pass to the codegen(...) function.
 */
export type CodegenArgs = {
  /**
   * Full path to the template file (vento .vto template)
   */
  templateVtoPath: string;

  /**
   * Full path to processor file [optional], which will pass data and 
   * additional filters to the template.
   * 
   * This file should export a function (or async function) that 
   * takes an optional data Json object and returns an object with the final 
   * data and filters to pass to the template.
   * 
   * Example:
   * ```ts
   * export default (dataJson: any) => ({
   *  data: { 
   *    myVar: "yeet",
   *    hello() {
   *      return "hello world";  
   *    },
   *  filters: {
   *    upper: (str: string) => str.toUpperCase(),
   *  }
   * });
   * `
   */
  processorTsPath?: string;

  /**
   * JSON string to pass to the template as data. 
   * This can be either a JSON or JSONC (JSON with comments) file.
   */
  dataJsonPath?: string;

  /**
   * Full path to the final output file, can be any file type (.ts, .json, .md, etc.)
   */
  outputPath?: string;

  /**
   * Filters to pass to the template, which are arbitrary functions that
   * can transform any variable.
   * 
   * Read about filters here:
   * https://vento.js.org/syntax/pipes/
   */
  filters?: Record<string, Filter>;

  /**
   * Arbitrary data to pass to the template
   * Can be functions, objects, arrays, etc.
   * 
   * Read more about using data in templates here:
   * https://vento.js.org/syntax/print/
   */
  data?: Record<string, unknown>;

  /**
   * Additional flags to run alongside the codegen process
   * For example, formatting and checking the output is valid TypeScript
   */
  flags?: ('fmt' | 'check' | 'print_info')[]

  /**
   * Optional error handler
   */
  error?: (err: Error) => void;
}

/**
 * Default arguments for codegen(...) function
 */
export const DEFAULT_ARGS: Partial<CodegenArgs> = {
  templateVtoPath: "template.vto",
  filters: {
    upper: (str: string) => str.toUpperCase(),
    lower: (str: string) => str.toLowerCase(),
  },
  data: {
    name: "Bobert Paulson",
    hello() {
      return "sup dawg";
    }
  },
  flags: ['fmt', 'check', 'print_info'],
};

/**
 * Generate code from a Vento template and optional processor file
 * @param args Arguments object to pass to the code
 * @param args.templateVtoPath Full path to the template file (vento .vto 
 * template)
 * @param args.processorTsPath Full path to processor file [optional], which 
 * will pass data and additional filters to the template. Must export a
 * default function that takes an optional data Json object and returns an
 * object with the final data and filters to pass to the template, like so:
 * ```ts
 * export default (dataJson: any) => ({
 *  data: {
 *    myVar: "yeet",
 *    hello() {
 *      return "hello world";
 *    },
 *    filters: {
 *      upper: (str: string) => str.toUpperCase(),
 *    }
 * });
 * ```
 * @param args.dataJsonPath JSON string to pass to the template as data.
 * @param args.outputPath Full path to the final output file, can be any file 
 * type (.ts, .json, .md, etc.)
 * @param args.filters Filters to pass to the template, which are arbitrary 
 * functions that can transform any variable.
 * @param args.data Arbitrary data to pass to the template
 * @param args.flags Additional flags to run alongside the codegen process
 * @param args.error Optional error handler
 * @returns Generated code as a string
 */
export const codegen = async (args: CodegenArgs): Promise<string> => {
  const startTime = performance.now();
  const {
    templateVtoPath,
    processorTsPath,
    dataJsonPath,
    outputPath,
    filters,
    data,
    flags,
    error,
  } = { ...DEFAULT_ARGS, ...args };

  const env = vento();
  const failures: string[] = [];

  let processorData: Record<string, unknown> | undefined = undefined;
  let processorFilters: Record<string, Filter> | undefined = undefined;

  if (dataJsonPath) {
    try {
      const dataJson = await Deno.readTextFile(dataJsonPath);
      const parsedData = parseJsonc(dataJson) as Record<string, unknown>;

      if (parsedData) {
        processorData = parsedData;
      }
    }
    catch (err) {
      if (error) {
        error(err);
      }
      console.error(err);
      failures.push(`data (${dataJsonPath})`);
    }
  }

  if (processorTsPath) {
    try {
      // Resolve as http(s) URL or file path relative to current working directory
      const processorTsPathResolved = processorTsPath.startsWith('http') ? processorTsPath : path.resolve(Deno.cwd(), processorTsPath);
      const processor = (await import(processorTsPathResolved)).default;
      const result = await processor(processorData);

      processorData = result.data;
      processorFilters = result.filters;
    }
    catch (err) {
      if (error) {
        error(err);
      }
      console.error(err);
      failures.push(`processor (${processorTsPath})`)
    }
  }

  if (processorFilters) {
    env.filters = { ...processorFilters }
  }
  else {
    env.filters = { ...filters };
  }

  let output: string = "";

  try {
    const template = await env.load(templateVtoPath);
    const finalData = {
      ...(processorData ? processorData : data),
    }

    const result = await template(finalData);

    output = result.content.trim();

    if (outputPath) {
      await Deno.writeTextFile(outputPath, output);
    }
  }
  catch (err) {
    if (error) {
      error(err);
    }
    console.error(err);
    failures.push(`vento template (${templateVtoPath})`);
  }

  if (flags && flags.length && outputPath) {
    if (flags.includes("fmt")) {
      const p = new Deno.Command("deno", {
        args: ["fmt", outputPath],
        stdout: "piped",
        stderr: "piped",
      }).spawn();

      const {
        success,
        stdout,
        stderr,
      } = await p.output();

      // Write output to stderr
      if (flags.includes('print_info')) {
        await Deno.stderr.write(stdout);
        await Deno.stderr.write(stderr);
      }

      if (!success) {
        failures.push("deno fmt");
      }
    }

    if (flags.includes("check")) {
      const p = new Deno.Command("deno", {
        args: ["check", outputPath],
        stdout: "piped",
        stderr: "piped",
      }).spawn();

      const {
        success,
        stdout,
        stderr,
      } = await p.output();

      // Write output to stderr
      if (flags.includes('print_info')) {
        await Deno.stderr.write(stdout);
        await Deno.stderr.write(stderr);
      }

      if (!success) {
        failures.push("deno check");
      }
    }
  }

  if (flags && flags.includes('print_info')) {
    const terminalWidth = Deno.consoleSize().columns;
    const printDivider = (char: string) => {
      const divider = char.repeat(Math.floor(terminalWidth * 0.67));
      return `${divider}\n`;
    }
    const bold = (str: string) => `\x1b[1m${str}\x1b[22m`;
    const colorize = (str: string, color: 'red' | 'green') => {
      const colors = {
        red: "\x1b[31m",
        green: "\x1b[32m",
      }
      return `${colors[color]}${str}\x1b[0m`;
    }

    await Deno.stderr.write(new TextEncoder().encode(printDivider("=")));
    const emoji = failures.length ? "⚠️" : "✅";
    await Deno.stdout.write(new TextEncoder().encode(bold(colorize(`${emoji} Codegen finished ${failures.length ? "with errors" : "successfully"
      } in ${Math.round(performance.now() - startTime)}ms\n`, failures.length ? 'red' : 'green'))));

    if (failures.length) {
      const failStr = `Failed steps: \n\t· ${bold(failures.join("\n\t· "))}\n`
      await Deno.stderr.write(new TextEncoder().encode(failStr));
    }
    await Deno.stderr.write(new TextEncoder().encode(printDivider("=")));
  }

  if (failures.length && error) {
    error(new Error(`Failed steps: ${failures
      .map((f) => f.replace("deno ", ""))
      .join(", ")}\n`));
  }

  return output;
}

if (import.meta.main) {
  const cliArgs = parseArgs(Deno.args);

  if (!cliArgs.in || cliArgs._.length || cliArgs.help) {
    console.log(`Usage:
  dgen --in <template.vto> --out <output.ts> --data <data.json> --processor <processor.ts> --flags fmt,check,print_info

Options:
  --in          Path to the template file (vento .vto template), required
  --out         Path to the output file, optional, will print to stdout if not provided
  --data        Path to the data file (JSON or JSONC), optional
  --processor   Path to the JS/TS processor file, optional
  --flags       Additional flags to run alongside the codegen process, optional
  --help        Print this help message
  `);
    Deno.exit(1);
  }

  let errors = false;

  const args: CodegenArgs = {
    templateVtoPath: cliArgs.in,
    processorTsPath: cliArgs.processor,
    dataJsonPath: cliArgs.data,
    outputPath: cliArgs.out,
    flags: cliArgs.flags ? cliArgs.flags.split(",").map((f: string) => f.trim()).filter(Boolean) as ('fmt' | 'check' | 'print_info')[] || undefined : undefined,
    error: (_err: Error) => {
      errors = true;
    }
  }

  // Filter out undefined values
  // @ts-ignore Object keys are always strings
  Object.keys(args).forEach((key) => args[key] === undefined && delete args[key]);

  const result = await codegen(args);

  if (!args.outputPath) {
    console.log(result);
  }

  Deno.exit(errors ? 1 : 0);
}
