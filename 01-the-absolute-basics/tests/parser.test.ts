import fs from 'fs/promises';
import path from 'path';
import { processData } from '../after/index.js'; // Note: In a real scenario, this would import from the student's code

describe('Module 01: Data Parser', () => {
  const inputFilePath = path.join(__dirname, '../data/test-bad-books.json');
  const outputFilePath = path.join(__dirname, '../data/test-good-books.json');

  beforeAll(async () => {
    // Stage mock data
    const mockData = [
      { id: 1, title: 'Valid Book', author: 'Author', pages: 100, published: '2023-01-01' },
      { id: 2, title: '', author: 'Bad Book', pages: 50, published: '2023-01-01' } // Bad data (empty title)
    ];
    await fs.writeFile(inputFilePath, JSON.stringify(mockData));
  });

  afterAll(async () => {
    // Cleanup afterwards
    try {
      await fs.unlink(inputFilePath);
      await fs.unlink(outputFilePath);
    } catch (e) {
      // ignore
    }
  });

  it('should throw an error when validation fails', async () => {
    // processData should throw because of the empty title we mock above
    await expect(processData(inputFilePath, outputFilePath)).rejects.toThrow('Invalid data format');
  });

  it('should write successfully when data is valid', async () => {
    // Write good data
    const goodData = [
      { id: 1, title: 'Valid Book', author: 'Author', pages: 100, published: '2023-01-01' }
    ];
    await fs.writeFile(inputFilePath, JSON.stringify(goodData));

    // Run the parser
    await processData(inputFilePath, outputFilePath);

    // Assert the output file exists and has correct data
    const outputExists = await fs.stat(outputFilePath).catch(() => null);
    expect(outputExists).toBeTruthy();

    const outputData = JSON.parse(await fs.readFile(outputFilePath, 'utf-8'));
    expect(outputData.length).toBe(1);
    expect(outputData[0].title).toBe('Valid Book');
  });
});
