import { afterEach, describe, expect, it, vi } from 'vitest';
import { downloadBlob, downloadTextFile } from './downloadFile';

describe('downloadFile', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('downloads a Blob and revokes its object URL', () => {
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:download');
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    const blob = new Blob(['pdf'], { type: 'application/pdf' });

    downloadBlob(blob, 'resume.pdf');

    expect(createObjectURL).toHaveBeenCalledWith(blob);
    expect(click).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:download');
  });

  it('wraps text in a JSON Blob before downloading', () => {
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:json');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

    downloadTextFile('project.json', '{"ok":true}');

    const blob = createObjectURL.mock.calls[0]?.[0];
    expect(blob).toBeInstanceOf(Blob);
    if (!(blob instanceof Blob)) throw new Error('Expected a Blob download.');
    expect(blob.type).toBe('application/json');
  });
});
