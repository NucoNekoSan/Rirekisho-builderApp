// 写真処理: JPEG読み込み → EXIF回転補正 → 3:4クロップ → 900x1200px出力
import { JPEG_QUALITY, PHOTO_ACCEPTED_EXTENSIONS, PHOTO_ACCEPTED_MIME_TYPES, PHOTO_ASPECT_RATIO, PHOTO_MAX_FILE_SIZE_BYTES, PHOTO_MAX_FILE_SIZE_MB, PHOTO_OUTPUT_HEIGHT, PHOTO_OUTPUT_WIDTH } from '../lib/config';
import type { PhotoData } from '../lib/types';

interface PhotoValidationResult {
  ok: boolean;
  message: string;
}

export const validatePhotoFile = (file: File): PhotoValidationResult => {
  if (!PHOTO_ACCEPTED_MIME_TYPES.includes(file.type as (typeof PHOTO_ACCEPTED_MIME_TYPES)[number])) {
    return { ok: false, message: 'JPGまたはJPEG形式の写真を選択してください。' };
  }
  if (!PHOTO_ACCEPTED_EXTENSIONS.some((extension) => file.name.toLowerCase().endsWith(extension))) {
    return { ok: false, message: '拡張子が.jpgまたは.jpegの写真を選択してください。' };
  }
  if (file.size > PHOTO_MAX_FILE_SIZE_BYTES) {
    return { ok: false, message: `写真は${PHOTO_MAX_FILE_SIZE_MB}MB以下のJPG/JPEGを選択してください。` };
  }
  return { ok: true, message: '' };
};

const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('写真ファイルを読み込めませんでした。'));
    reader.readAsDataURL(file);
  });

const loadImage = (dataUrl: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('写真画像を読み込めませんでした。'));
    image.src = dataUrl;
  });

const drawCroppedPortrait = (image: CanvasImageSource, sourceWidth: number, sourceHeight: number): string => {
  const targetWidth = PHOTO_OUTPUT_WIDTH;
  const targetHeight = PHOTO_OUTPUT_HEIGHT;
  const sourceRatio = sourceWidth / sourceHeight;
  let cropWidth = sourceWidth;
  let cropHeight = sourceHeight;
  if (sourceRatio > PHOTO_ASPECT_RATIO) {
    cropWidth = sourceHeight * PHOTO_ASPECT_RATIO;
  } else {
    cropHeight = sourceWidth / PHOTO_ASPECT_RATIO;
  }
  const cropX = (sourceWidth - cropWidth) / 2;
  const cropY = (sourceHeight - cropHeight) / 2;
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('写真処理用のCanvasを作成できませんでした。');
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, targetWidth, targetHeight);
  context.drawImage(image, cropX, cropY, cropWidth, cropHeight, 0, 0, targetWidth, targetHeight);
  return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
};

const buildPhotoData = (dataUrl: string, file: File): PhotoData => ({
  dataUrl,
  fileName: file.name,
  mimeType: 'image/jpeg',
  size: file.size,
  width: PHOTO_OUTPUT_WIDTH,
  height: PHOTO_OUTPUT_HEIGHT,
  updatedAt: new Date().toISOString(),
});

export const processPhotoFile = async (file: File): Promise<PhotoData> => {
  const validation = validatePhotoFile(file);
  if (!validation.ok) throw new Error(validation.message);
  const dataUrl = await readFileAsDataUrl(file);

  if ('createImageBitmap' in window) {
    try {
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const bitmap = await createImageBitmap(blob, { imageOrientation: 'from-image' });
      const cropped = drawCroppedPortrait(bitmap, bitmap.width, bitmap.height);
      bitmap.close();
      return buildPhotoData(cropped, file);
    } catch {
      // Fallback below uses browser image rendering. Some older browsers do not support imageOrientation.
    }
  }

  const image = await loadImage(dataUrl);
  const cropped = drawCroppedPortrait(image, image.naturalWidth, image.naturalHeight);
  return buildPhotoData(cropped, file);
};

export const rotatePhotoClockwise = async (photo: PhotoData): Promise<PhotoData> => {
  const image = await loadImage(photo.dataUrl);
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalHeight;
  canvas.height = image.naturalWidth;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('写真回転用のCanvasを作成できませんでした。');
  context.translate(canvas.width / 2, canvas.height / 2);
  context.rotate(Math.PI / 2);
  context.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);
  const rotated = await loadImage(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
  const cropped = drawCroppedPortrait(rotated, rotated.naturalWidth, rotated.naturalHeight);
  return {
    ...photo,
    dataUrl: cropped,
    width: PHOTO_OUTPUT_WIDTH,
    height: PHOTO_OUTPUT_HEIGHT,
    updatedAt: new Date().toISOString(),
  };
};
