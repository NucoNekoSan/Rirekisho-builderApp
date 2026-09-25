import { describe, expect, it } from 'vitest';
import { BYTES_PER_MB, PHOTO_MAX_FILE_SIZE_BYTES, PHOTO_MAX_FILE_SIZE_MB } from '../lib/config';

describe('photo upload configuration', () => {
  it('derives byte limit from the single MB setting', () => {
    expect(PHOTO_MAX_FILE_SIZE_BYTES).toBe(PHOTO_MAX_FILE_SIZE_MB * BYTES_PER_MB);
  });

  it('keeps the default limit at 10MB until operations choose another value', () => {
    expect(PHOTO_MAX_FILE_SIZE_MB).toBe(10);
  });
});
