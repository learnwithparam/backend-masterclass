import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import path from 'path';
import { z } from 'zod';
import { program } from 'commander';

// TODO: Define a Zod schema for a single Book with these fields:
//   - id: positive integer
//   - title: non-empty string
//   - author: non-empty string
//   - pages: positive integer
//   - published: string
// Hint: z.object({ ... })

// TODO: Define an InventorySchema that validates an array of books
// Hint: z.array(BookSchema)

export async function processData(inputFile: string, outputFile: string) {
  // TODO 1: Read the file contents using fs.readFile(inputFile, 'utf-8')

  // TODO 2: Parse the raw string into JSON using JSON.parse()

  // TODO 3: Validate the parsed data using your InventorySchema
  // Hint: Use .safeParse() which returns { success, data, error }
  //       instead of throwing an exception

  // TODO 4: If validation fails, throw new Error("Invalid data format")

  // TODO 5: Write the validated data to outputFile using fs.writeFile()
  // Hint: JSON.stringify(data, null, 2) for pretty-printed output
}

// CLI setup — runs only when you execute this file directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  program
    .name('book-parser')
    .description('CLI to read, validate, and normalize bookstore inventory JSON data')
    .version('1.0.0')
    .requiredOption('-i, --input <path>', 'path to the raw input JSON file')
    .requiredOption('-o, --output <path>', 'path to save the cleaned JSON file')
    .parse(process.argv);

  const options = program.opts();
  const inputPath = path.resolve(process.cwd(), options.input);
  const outputPath = path.resolve(process.cwd(), options.output);

  processData(inputPath, outputPath).catch(() => process.exit(1));
}
