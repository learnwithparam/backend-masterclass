# Module 01: The Absolute Basics (CLI & Data Parsing)

> Before you can serve data, you must be able to trust it.

## The Story

It's your first week at a small online bookstore. The operations team has been managing inventory in spreadsheets, and someone just exported 10,000 book records as a JSON file for the new website you're building.

You open the file and immediately see problems: some books have empty titles, others have negative page counts, and a few have IDs that are strings instead of numbers. If you load this data directly into your database, customers will see broken listings, search will fail, and the company loses revenue.

This is the reality of backend engineering. Data comes from everywhere — user forms, partner APIs, CSV exports, legacy systems — and it's almost never clean. Your job is to be the gatekeeper: read it, validate it, fix what you can, and reject what you can't. That's exactly what you'll build in this module.

## What You'll Build

A command-line tool that reads a messy JSON file, validates every record against a strict schema, and outputs a clean file ready for database import.

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  bad-books   │────>│   Your CLI   │────>│  good-books  │
│    .json     │     │   (validate  │     │    .json     │
│  (raw input) │     │    + clean)  │     │ (clean data) │
└──────────────┘     └──────────────┘     └──────────────┘
                           │
                     Rejects invalid
                     records with
                     clear errors
```

## Core Concepts

### 1. File System Operations (`fs/promises`)
Node.js can read and write files on disk. We use the promise-based API (`fs/promises`) so we can use `async/await` instead of callbacks. This is modern Node.js — callbacks are the old way.

```typescript
const data = await fs.readFile('input.json', 'utf-8');
await fs.writeFile('output.json', cleanedData, 'utf-8');
```

### 2. Data Validation with Zod
Zod lets you define "schemas" — blueprints that describe exactly what valid data looks like. Instead of writing dozens of `if` checks, you declare the shape once and Zod handles all the validation automatically.

```typescript
const BookSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().min(1),
  pages: z.number().int().positive(),
});

const result = BookSchema.safeParse(unknownData);
if (!result.success) {
  // result.error tells you exactly what's wrong
}
```

Why `safeParse` instead of `parse`? Because `parse` throws an exception on failure, which gives you less control. `safeParse` returns a result object so YOU decide how to handle errors.

### 3. CLI Arguments with Commander
Commander turns your script into a proper command-line tool with named flags, help text, and validation. This is how real backend tools work — think `git commit -m "message"` or `docker run -p 3000:3000`.

```typescript
program
  .requiredOption('-i, --input <path>', 'input file path')
  .requiredOption('-o, --output <path>', 'output file path')
  .parse(process.argv);
```

## Prerequisites

- Node.js 20+ installed
- Basic TypeScript familiarity (types, interfaces)
- A terminal you're comfortable with

## Getting Started

```bash
# Install dependencies
make setup

# Look at the messy input data
cat data/bad-books.json

# Open the skeleton file — this is where you'll code
# before/index.ts
```

## Your Task

Open `before/index.ts` and implement the `processData` function:

1. **Define a Zod schema** for a Book with these fields:
   - `id`: positive integer
   - `title`: non-empty string
   - `author`: non-empty string
   - `pages`: positive integer
   - `published`: string

2. **Read the input file** using `fs.readFile`

3. **Parse the JSON** using `JSON.parse`

4. **Validate** the parsed data using your schema's `.safeParse()` method

5. **Handle failures** — if validation fails, throw `new Error("Invalid data format")`

6. **Write the clean data** to the output file using `fs.writeFile`

## Testing Your Solution

Run your tool manually:
```bash
npm run start:before -- -i data/bad-books.json -o data/good-books.json
```

Run the automated tests:
```bash
make test
```

The tests check two scenarios:
- Invalid data should throw an error (the validator catches bad records)
- Valid data should be written to the output file correctly

## Common Mistakes

1. **Forgetting `await`**: `fs.readFile` returns a Promise. Without `await`, you'll try to `JSON.parse` a Promise object instead of a string.

2. **Using `.parse()` instead of `.safeParse()`**: The test expects you to throw a specific error message. `.parse()` throws Zod's own error, which won't match. Use `.safeParse()` and throw your own error.

3. **Not wrapping the array**: Your schema needs to validate an array of books, not a single book. Use `z.array(BookSchema)` to compose schemas.

## What's Next

Now that you can read, validate, and write data, it's time to serve it over the network. In **Module 02**, you'll build your first HTTP server — a program that listens for requests and responds with data. No more reading from files; you'll serve data to browsers and API clients.

*Hint: If you're stuck, check the solution in `after/index.ts` or run `make solution`.*
