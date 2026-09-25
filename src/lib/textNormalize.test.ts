import { describe, expect, it } from 'vitest';
import { extractDigits, normalizeNfkc } from './textNormalize';

describe('text normalization', () => {
  it('normalizes full-width characters with NFKC', () => {
    expect(normalizeNfkc('ＡＢＣ１２３')).toBe('ABC123');
  });

  it('extracts digits after normalizing user input', () => {
    expect(extractDigits('〒１６０－００２２')).toBe('1600022');
  });
});
