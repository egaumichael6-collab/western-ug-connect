const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export function validateImage(file: File): string | null {
  if (!ALLOWED.includes(file.type)) return "Please choose a JPG, PNG or WebP image.";
  if (file.size > 15 * 1024 * 1024) return "That image is too large (max 15 MB before compression).";
  return null;
}

/**
 * Re-encodes an image in the browser: strips location/EXIF metadata, limits the
 * size to save members' mobile data, and confirms the file really is an image.
 */
export async function compressImage(file: File, maxSide = 1280, quality = 0.82): Promise<Blob> {
  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error("This file could not be read as an image.");
  });
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/webp", quality));
  const out = blob ?? (await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", quality)));
  if (!out) throw new Error("Could not process this image.");
  if (out.size > MAX_UPLOAD_BYTES) throw new Error("Image is still too large after compression.");
  return out;
}
