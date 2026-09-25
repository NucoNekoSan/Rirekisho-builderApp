import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const sourceRoot = join(process.cwd(), 'src');
const sourceFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((entry) => {
    const fullPath = join(dir, entry);
    if (entry.endsWith('.test.ts') || entry.endsWith('.test.tsx') || entry === 'test') return [];
    return statSync(fullPath).isDirectory() ? sourceFiles(fullPath) : [fullPath];
  });

describe('browser storage boundary', () => {
  it('does not use browser storage for resume data in production source', () => {
    const combined = sourceFiles(sourceRoot).map((file) => readFileSync(file, 'utf8')).join('\n');

    expect(combined).not.toMatch(/localStorage/);
    expect(combined).not.toMatch(/sessionStorage/);
    expect(combined).not.toMatch(/indexedDB/i);
  });
});
