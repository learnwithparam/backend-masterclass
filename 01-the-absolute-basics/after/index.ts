/**
 * Module 01: The Absolute Basics — Book Inventory Parser
 *
 * This CLI tool reads a raw JSON file of bookstore inventory, validates each
 * entry against a strict schema using Zod, and writes the cleaned data to a
 * new file. It demonstrates the fundamental backend pattern: never trust input.
 */
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import path from 'path';
import { z } from 'zod';
import { program } from 'commander';

// KEY CONCEPT: Define your schema BEFORE you touch any data.
// Zod schemas act as contracts — they describe exactly what valid data looks like.
// If incoming data doesn't match, Zod gives you detailed error messages instead of
// letting bad data silently corrupt your system.
const BookSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().min(1, "Title cannot be empty"),
  author: z.string().min(1, "Author cannot be empty"),
  pages: z.number().int().positive(),
  published: z.string(),
});

// Composing schemas: we validate an array of books, not just one.
// Zod will report exactly which array element failed and why.
const InventorySchema = z.array(BookSchema);

export async function processData(inputFile: string, outputFile: string) {
  try {
    // Step 1: Read raw file contents as a string
    const rawData = await fs.readFile(inputFile, 'utf-8');

    // Step 2: Parse the string into a JavaScript object
    // This can throw if the file isn't valid JSON at all
    const parsedJson = JSON.parse(rawData);

    // Step 3: Validate the parsed data against our schema
    // KEY CONCEPT: safeParse returns { success, data, error } instead of throwing.
    // This gives us control over error handling — we decide what to do with failures.
    const result = InventorySchema.safeParse(parsedJson);

    if (!result.success) {
      console.error("Validation failed:", JSON.stringify(result.error.format(), null, 2));
      throw new Error("Invalid data format");
    }

    // Step 4: Write the validated (clean) data to the output file
    // Why JSON.stringify with indent 2? Human-readable output for debugging.
    await fs.writeFile(outputFile, JSON.stringify(result.data, null, 2), 'utf-8');
    console.log(`✅ Success! Data normalized and saved to ${outputFile}`);

  } catch (error) {
    console.error("❌ An error occurred:", error);
    throw error;
  }
}

// Only run the CLI if this file is executed directly (not imported in tests).
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
