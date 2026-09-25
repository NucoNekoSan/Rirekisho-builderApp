import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PHOTO_MAX_FILE_SIZE_BYTES, PHOTO_OUTPUT_HEIGHT, PHOTO_OUTPUT_WIDTH } from '../lib/config';
import type { PhotoData } from '../lib/types';
import { processPhotoFile, rotatePhotoClockwise, validatePhotoFile } from './photoLoader';

const JPEG_BYTES = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);

describe('photoLoader', () => {
  const context = {
    fillStyle: '',
    fillRect: vi.fn(),
    drawImage: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
  };
  let originalImage: typeof Image;
  let originalCreateImageBitmap: typeof window.createImageBitmap | undefined;

  beforeEach(() => {
    originalImage = window.Image;
    originalCreateImageBitmap = window.createImageBitmap;

    class MockImage {
      onload: ((event: Event) => void) | null = null;
      onerror: ((event: Event) => void) | null = null;
      naturalWidth = 1200;
      naturalHeight = 1600;

      set src(_value: string) {
        queueMicrotask(() => this.onload?.(new Event('load')));
      }
    }

    vi.stubGlobal('Image', MockImage);
    delete (window as Partial<Window>).createImageBitmap;
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/jpeg;base64,/9j/2Q==');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal('Image', originalImage);
    if (originalCreateImageBitmap) {
      window.createImageBitmap = originalCreateImageBitmap;
    } else {
      delete (window as Partial<Window>).createImageBitmap;
    }
  });

  it('validates MIME type, extension, and size with the shared limits', () => {
    expect(validatePhotoFile(new File([JPEG_BYTES], 'photo.jpg', { type: 'image/png' }))).toEqual({
      ok: false,
      message: 'JPGまたはJPEG形式の写真を選択してください。',
    });
    expect(validatePhotoFile(new File([JPEG_BYTES], 'photo.bin', { type: 'image/jpeg' }))).toEqual({
      ok: false,
      message: '拡張子が.jpgまたは.jpegの写真を選択してください。',
    });

    const oversized = new File([], 'photo.jpeg', { type: 'image/jpeg' });
    Object.defineProperty(oversized, 'size', { value: PHOTO_MAX_FILE_SIZE_BYTES + 1 });
    expect(validatePhotoFile(oversized).ok).toBe(false);
    expect(validatePhotoFile(new File([JPEG_BYTES], 'PHOTO.JPEG', { type: 'image/jpeg' }))).toEqual({ ok: true, message: '' });
  });

  it('loads and crops a JPEG through the browser image fallback', async () => {
    const file = new File([JPEG_BYTES], 'portrait.jpg', { type: 'image/jpeg' });

    const photo = await processPhotoFile(file);

    expect(photo).toMatchObject({
      dataUrl: 'data:image/jpeg;base64,/9j/2Q==',
      fileName: 'portrait.jpg',
      mimeType: 'image/jpeg',
      size: JPEG_BYTES.byteLength,
      width: PHOTO_OUTPUT_WIDTH,
      height: PHOTO_OUTPUT_HEIGHT,
    });
    expect(context.fillRect).toHaveBeenCalled();
    expect(context.drawImage).toHaveBeenCalled();
  });

  it('rotates and crops an existing photo', async () => {
    const photo: PhotoData = {
      dataUrl: 'data:image/jpeg;base64,/9j/2Q==',
      fileName: 'portrait.jpg',
      mimeType: 'image/jpeg',
      size: JPEG_BYTES.byteLength,
      width: PHOTO_OUTPUT_WIDTH,
      height: PHOTO_OUTPUT_HEIGHT,
      updatedAt: '2026-07-16T00:00:00.000Z',
    };

    const rotated = await rotatePhotoClockwise(photo);

    expect(rotated.dataUrl).toBe('data:image/jpeg;base64,/9j/2Q==');
    expect(context.translate).toHaveBeenCalled();
    expect(context.rotate).toHaveBeenCalledWith(Math.PI / 2);
    expect(context.drawImage).toHaveBeenCalled();
    expect(rotated.updatedAt).not.toBe(photo.updatedAt);
  });
});
