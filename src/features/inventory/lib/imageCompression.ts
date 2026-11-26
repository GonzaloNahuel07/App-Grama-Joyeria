export interface CompressedImageResult {
  blob: Blob;
  dataUrl: string;
  extension: 'webp' | 'jpg';
}

const MAX_DIMENSION_PX = 1200;
const TARGET_QUALITY = 0.82;

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('No pudimos leer la imagen seleccionada.'));
    reader.readAsDataURL(blob);
  });
}

function loadImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('El archivo seleccionado no es una imagen válida.'));
    };
    img.src = objectUrl;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), mimeType, quality);
  });
}

/**
 * Resizes and compresses product photos client-side before uploading to Storage or LocalStorage.
 */
export async function compressProductImage(file: File): Promise<CompressedImageResult> {
  const img = await loadImageElement(file);
  const scale = Math.min(1, MAX_DIMENSION_PX / Math.max(img.width, img.height, 1));
  const targetWidth = Math.max(1, Math.round(img.width * scale));
  const targetHeight = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    const fallbackUrl = await blobToDataUrl(file);
    return { blob: file, dataUrl: fallbackUrl, extension: 'jpg' };
  }

  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  const webpBlob = await canvasToBlob(canvas, 'image/webp', TARGET_QUALITY);
  if (webpBlob && webpBlob.type === 'image/webp') {
    return {
      blob: webpBlob,
      dataUrl: await blobToDataUrl(webpBlob),
      extension: 'webp',
    };
  }

  const jpgBlob = await canvasToBlob(canvas, 'image/jpeg', TARGET_QUALITY);
  const finalBlob = jpgBlob ?? file;
  return {
    blob: finalBlob,
    dataUrl: await blobToDataUrl(finalBlob),
    extension: 'jpg',
  };
}
