import { describe, expect, it } from 'vitest';
import { PHOTO_MAX_FILE_SIZE_BYTES, PHOTO_MAX_FILE_SIZE_MB } from './config';
import { createDefaultState } from './defaults';
import { buildProjectFile, parseProjectFile, serializeProjectFile } from './projectFile';

describe('project file serialization', () => {
  it('excludes photo data by default', () => {
    const state = createDefaultState();
    state.resume.photo = {
      dataUrl: 'data:image/jpeg;base64,secret-photo',
      fileName: 'photo.jpg',
      mimeType: 'image/jpeg',
      size: 1234,
      width: 900,
      height: 1200,
      updatedAt: '2026-06-25T00:00:00.000Z',
    };

    const project = buildProjectFile(state, false);

    expect(project.includePhoto).toBe(false);
    expect(project.state.resume.photo).toBeNull();
    expect(JSON.stringify(project)).not.toContain('secret-photo');
  });

  it('excludes accommodation data from general application saves', () => {
    const state = createDefaultState();
    state.accommodation.includeDisabilityName = true;
    state.accommodation.disabilityName = '保存しない診断名';
    state.accommodation.strengths = '保存しない配慮事項';

    const project = buildProjectFile(state, false);

    expect(project.includeAccommodation).toBe(false);
    expect(project.state.accommodation.disabilityName).toBe('');
    expect(project.state.accommodation.strengths).toBe('');
    expect(JSON.stringify(project)).not.toContain('保存しない診断名');
    expect(JSON.stringify(project)).not.toContain('保存しない配慮事項');
  });

  it('includes photo only when explicitly requested', () => {
    const state = createDefaultState();
    state.resume.photo = {
      dataUrl: 'data:image/jpeg;base64,secret-photo',
      fileName: 'photo.jpg',
      mimeType: 'image/jpeg',
      size: 1234,
      width: 900,
      height: 1200,
      updatedAt: '2026-06-25T00:00:00.000Z',
    };

    const project = buildProjectFile(state, true);

    expect(project.includePhoto).toBe(true);
    expect(project.state.resume.photo?.dataUrl).toContain('secret-photo');
  });

  it('round-trips a supported input data file', () => {
    const state = createDefaultState();
    state.resume.applicationType = 'disability';
    state.resume.basic.name = '山田 太郎';
    state.resume.basic.age = '27歳';
    state.resume.pdfFontFamily = 'mincho';
    state.resume.pdfPaperFormat = 'a3-landscape';
    state.resume.textAlignments['basic.name'] = 'center';
    state.accommodation.textAlignments.strengths = 'right';

    const parsed = parseProjectFile(serializeProjectFile(state, false));

    expect(parsed.resume.basic.name).toBe('山田 太郎');
    expect(parsed.resume.basic.age).toBe('27歳');
    expect(parsed.resume.pdfFontFamily).toBe('mincho');
    expect(parsed.resume.pdfPaperFormat).toBe('a3-landscape');
    expect(parsed.resume.textAlignments['basic.name']).toBe('center');
    expect(parsed.accommodation.textAlignments.strengths).toBe('right');
  });

  it('round-trips an explicitly included JPEG photo', () => {
    const state = createDefaultState();
    state.resume.photo = {
      dataUrl: 'data:image/jpeg;base64,/9j/2Q==',
      fileName: 'portrait.JPEG',
      mimeType: 'image/jpeg',
      size: 4,
      width: 900,
      height: 1200,
      updatedAt: '2026-07-16T00:00:00.000Z',
    };

    const parsed = parseProjectFile(serializeProjectFile(state, true));

    expect(parsed.resume.photo).toEqual(state.resume.photo);
  });

  it('loads older input data files without age, PDF font, PDF paper format, or text alignments as blank/default values', () => {
    const project = JSON.parse(serializeProjectFile(createDefaultState(), false));
    delete project.state.resume.basic.age;
    delete project.state.resume.pdfFontFamily;
    delete project.state.resume.pdfPaperFormat;
    delete project.state.resume.textAlignments;
    delete project.state.accommodation.textAlignments;

    const parsed = parseProjectFile(JSON.stringify(project));

    expect(parsed.resume.basic.age).toBe('');
    expect(parsed.resume.pdfFontFamily).toBe('mincho');
    expect(parsed.resume.pdfPaperFormat).toBe('a4-portrait');
    expect(parsed.resume.textAlignments).toEqual({});
    expect(parsed.accommodation.textAlignments).toEqual({});
  });

  it('falls back to Mincho for unsupported PDF font values', () => {
    const project = JSON.parse(serializeProjectFile(createDefaultState(), false));
    project.state.resume.pdfFontFamily = 'decorative';

    const parsed = parseProjectFile(JSON.stringify(project));

    expect(parsed.resume.pdfFontFamily).toBe('mincho');
  });

  it('falls back to A4 portrait for unsupported PDF paper format values', () => {
    const project = JSON.parse(serializeProjectFile(createDefaultState(), false));
    project.state.resume.pdfPaperFormat = 'letter';

    const parsed = parseProjectFile(JSON.stringify(project));

    expect(parsed.resume.pdfPaperFormat).toBe('a4-portrait');
  });

  it('normalizes older guided input data files to normal input', () => {
    const project = JSON.parse(serializeProjectFile(createDefaultState(), false));
    project.state.resume.inputMode = 'guided';

    const parsed = parseProjectFile(JSON.stringify(project));

    expect(parsed.resume.inputMode).toBe('standard');
  });

  it('rejects malformed input data file fields', () => {
    const project = JSON.parse(serializeProjectFile(createDefaultState(), false));
    project.state.resume.basic.name = 123;

    expect(() => parseProjectFile(JSON.stringify(project))).toThrow('入力データファイルの内容が不正です。');
  });

  it('rejects oversized imported photo metadata', () => {
    const state = createDefaultState();
    state.resume.photo = {
      dataUrl: 'data:image/jpeg;base64,AAAA',
      fileName: 'photo.jpg',
      mimeType: 'image/jpeg',
      size: PHOTO_MAX_FILE_SIZE_BYTES + 1,
      width: 900,
      height: 1200,
      updatedAt: '2026-06-25T00:00:00.000Z',
    };

    expect(() => parseProjectFile(serializeProjectFile(state, true))).toThrow(
      `入力データファイル内の写真は${PHOTO_MAX_FILE_SIZE_MB}MB以下のJPG/JPEGのみ読み込めます。`,
    );
  });

  it('rejects a photo payload that is not JPEG data', () => {
    const project = JSON.parse(serializeProjectFile(createDefaultState(), false));
    project.includePhoto = true;
    project.state.resume.photo = {
      dataUrl: 'data:image/jpeg;base64,AAAA',
      fileName: 'photo.jpg',
      mimeType: 'image/jpeg',
      size: 3,
      width: 900,
      height: 1200,
      updatedAt: '2026-07-16T00:00:00.000Z',
    };

    expect(() => parseProjectFile(JSON.stringify(project))).toThrow('入力データファイルの内容が不正です。');
  });

  it('strips photo data when the project metadata does not include it', () => {
    const project = JSON.parse(serializeProjectFile(createDefaultState(), false));
    project.state.resume.photo = {
      dataUrl: 'data:image/jpeg;base64,AAAA',
      fileName: 'photo.jpg',
      mimeType: 'image/jpeg',
      size: 3,
      width: 900,
      height: 1200,
      updatedAt: '2026-06-25T00:00:00.000Z',
    };

    expect(parseProjectFile(JSON.stringify(project)).resume.photo).toBeNull();
  });

  it('uses safe defaults when inclusion metadata is missing', () => {
    const project = JSON.parse(serializeProjectFile(createDefaultState(), false));
    delete project.includePhoto;
    delete project.includeAccommodation;
    project.state.resume.photo = { unexpected: true };
    project.state.accommodation.strengths = '読み込まない配慮事項';

    const parsed = parseProjectFile(JSON.stringify(project));

    expect(parsed.resume.photo).toBeNull();
    expect(parsed.accommodation.strengths).toBe('');
  });

  it('strips accommodation data unless disability application metadata includes it', () => {
    const project = JSON.parse(serializeProjectFile(createDefaultState(), false));
    project.includeAccommodation = true;
    project.state.accommodation.strengths = '一般応募へ混入させない配慮事項';

    const parsed = parseProjectFile(JSON.stringify(project));

    expect(parsed.resume.applicationType).toBe('general');
    expect(parsed.accommodation.strengths).toBe('');
  });

  it('rejects non-boolean inclusion metadata', () => {
    const project = JSON.parse(serializeProjectFile(createDefaultState(), false));
    project.includeAccommodation = 'yes';

    expect(() => parseProjectFile(JSON.stringify(project))).toThrow('入力データファイルの内容が不正です。');
  });

  it('rejects photo data whose decoded Base64 exceeds the configured limit', () => {
    const project = JSON.parse(serializeProjectFile(createDefaultState(), false));
    project.includePhoto = true;
    const encodedLength = Math.ceil(PHOTO_MAX_FILE_SIZE_BYTES / 3) * 4;
    project.state.resume.photo = {
      dataUrl: `data:image/jpeg;base64,${'A'.repeat(encodedLength)}`,
      fileName: 'photo.jpg',
      mimeType: 'image/jpeg',
      size: 1,
      width: 900,
      height: 1200,
      updatedAt: '2026-06-25T00:00:00.000Z',
    };

    expect(() => parseProjectFile(JSON.stringify(project))).toThrow(
      `入力データファイル内の写真は${PHOTO_MAX_FILE_SIZE_MB}MB以下のJPG/JPEGのみ読み込めます。`,
    );
  });

  it('strips unknown fields when loading', () => {
    const project = JSON.parse(serializeProjectFile(createDefaultState(), false));
    project.state.resume.unexpected = 'ignored';

    const parsed = parseProjectFile(JSON.stringify(project));

    expect((parsed.resume as unknown as Record<string, unknown>).unexpected).toBeUndefined();
  });
});
