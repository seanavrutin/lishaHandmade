export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('לא ניתן לטעון את התמונה'));
    img.src = src;
  });
}

/**
 * Cuts `area` (in pixels of the image after rotation, as react-easy-crop reports it) out of the image
 * and returns it as a JPEG file of at most `maxSize` px per side.
 */
export async function cropImage(src: string, area: CropArea, rotation = 0, maxSize = 1000): Promise<File> {
  const img = await loadImage(src);
  const rad = (rotation * Math.PI) / 180;
  const sin = Math.abs(Math.sin(rad));
  const cos = Math.abs(Math.cos(rad));

  // 1. Draw the whole image rotated around its centre.
  const rotated = document.createElement('canvas');
  rotated.width = Math.round(img.naturalWidth * cos + img.naturalHeight * sin);
  rotated.height = Math.round(img.naturalWidth * sin + img.naturalHeight * cos);
  const rctx = rotated.getContext('2d')!;
  rctx.translate(rotated.width / 2, rotated.height / 2);
  rctx.rotate(rad);
  rctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);

  // 2. Copy the crop area, scaled down to maxSize.
  const scale = Math.min(1, maxSize / Math.max(area.width, area.height));
  const out = document.createElement('canvas');
  out.width = Math.round(area.width * scale);
  out.height = Math.round(area.height * scale);
  const ctx = out.getContext('2d')!;
  ctx.fillStyle = '#fff'; // JPEG has no transparency
  ctx.fillRect(0, 0, out.width, out.height);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(rotated, area.x, area.y, area.width, area.height, 0, 0, out.width, out.height);

  const blob = await new Promise<Blob>((resolve, reject) =>
    out.toBlob((b) => (b ? resolve(b) : reject(new Error('שגיאה בעיבוד התמונה'))), 'image/jpeg', 0.92),
  );
  return new File([blob], 'image.jpg', { type: 'image/jpeg' });
}

/** Resizes an image in the browser to at most `maxSize` px on its long side, as JPEG. */
export async function resizeImage(file: File, maxSize = 1000, quality = 0.8): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('שגיאה בעיבוד התמונה'))), 'image/jpeg', quality),
  );
}
