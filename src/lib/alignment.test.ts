import { describe, expect, it } from 'vitest';
import { getTextAlignment, removeTextAlignmentPrefix, setTextAlignment } from './alignment';

describe('text alignment helpers', () => {
  it('defaults missing fields to left alignment', () => {
    expect(getTextAlignment({}, 'basic.name')).toBe('left');
  });

  it('stores non-default alignment without mutating the source map', () => {
    const source = { 'basic.name': 'center' as const };
    const next = setTextAlignment(source, 'basic.address', 'right');

    expect(next).toEqual({ 'basic.name': 'center', 'basic.address': 'right' });
    expect(source).toEqual({ 'basic.name': 'center' });
  });

  it('removes default and row-prefixed alignment entries', () => {
    const alignments = {
      'basic.name': 'center' as const,
      'histories.1.year': 'right' as const,
      'histories.1.text': 'center' as const,
    };

    expect(setTextAlignment(alignments, 'basic.name', 'left')).toEqual({
      'histories.1.year': 'right',
      'histories.1.text': 'center',
    });
    expect(removeTextAlignmentPrefix(alignments, 'histories.1.')).toEqual({ 'basic.name': 'center' });
  });
});
