import { describe, expect, it } from '@jest/globals';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const repoRoot = process.cwd();

describe('Module 11 artifacts', () => {
  it('contains the ship-it deployment artifacts', () => {
    const orderDockerfile = join(repoRoot, 'after/order-service/Dockerfile');
    const inventoryDockerfile = join(repoRoot, 'after/inventory-service/Dockerfile');
    const composeFile = join(repoRoot, 'docker-compose.yml');
    const workflowFile = join(repoRoot, '.github/workflows/ci.yml');

    expect(existsSync(orderDockerfile)).toBe(true);
    expect(existsSync(inventoryDockerfile)).toBe(true);
    expect(existsSync(composeFile)).toBe(true);
    expect(existsSync(workflowFile)).toBe(true);

    const orderDockerfileBody = readFileSync(orderDockerfile, 'utf8');
    const inventoryDockerfileBody = readFileSync(inventoryDockerfile, 'utf8');
    const composeBody = readFileSync(composeFile, 'utf8');
    const workflowBody = readFileSync(workflowFile, 'utf8');

    expect(orderDockerfileBody).toContain('FROM node:20-alpine AS builder');
    expect(orderDockerfileBody).toContain('USER node');
    expect(orderDockerfileBody).toContain('dist/start.js');

    expect(inventoryDockerfileBody).toContain('FROM node:20-alpine AS builder');
    expect(inventoryDockerfileBody).toContain('npm ci --omit=dev');

    expect(composeBody).toContain('order-service');
    expect(composeBody).toContain('inventory-service');
    expect(composeBody).toContain('redis');

    expect(workflowBody).toContain('npm ci');
    expect(workflowBody).toContain('npx tsc --noEmit');
    expect(workflowBody).toContain('npm run test');
  });
});
