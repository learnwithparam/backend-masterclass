import { describe, it, expect } from '@jest/globals';
import { readFileSync } from 'fs';
import path from 'path';

const root = path.resolve(process.cwd());

describe('Module 16: Release Artifacts', () => {
  it('uses a multi-stage Dockerfile', () => {
    const dockerfile = readFileSync(path.join(root, 'Dockerfile'), 'utf8');
    expect(dockerfile).toContain('FROM node:20-alpine AS builder');
    expect(dockerfile).toContain('FROM node:20-alpine AS runner');
    expect(dockerfile).toContain('npm run build');
    expect(dockerfile).toContain('CMD ["node", "dist/after/index.js"]');
  });

  it('defines a health-checked compose stack', () => {
    const compose = readFileSync(path.join(root, 'docker-compose.yml'), 'utf8');
    expect(compose).toContain('container_name: m16_postgres');
    expect(compose).toContain('"5460:5432"');
  });
});
