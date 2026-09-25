import { describe, expect, it } from 'vitest';
import { isRecord } from './validation';

describe('isRecord', () => {
  it('accepts plain objects and rejects arrays, null, and primitives', () => {
    expect(isRecord({ value: 1 })).toBe(true);
    expect(isRecord([])).toBe(false);
    expect(isRecord(null)).toBe(false);
    expect(isRecord('value')).toBe(false);
  });
});
