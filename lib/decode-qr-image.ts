import jsQR from "jsqr";

// Bank-app screenshots are often 1200×2600 or larger. Scanning a copy no
// bigger than this keeps decoding fast without losing a full-screen QR.
const MAX_SIDE = 1600;

/**
 * Read the text of the first QR code in an image file, entirely in the
 * browser: the image is never uploaded. Returns null when no QR is found.
 */
export async function decodeQrImage(file: File): Promise<string | null> {
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return null;
    // A white backdrop, so a QR saved as a transparent PNG still has contrast.
    context.fillStyle = "#fff";
    context.fillRect(0, 0, width, height);
    context.drawImage(bitmap, 0, 0, width, height);

    const { data } = context.getImageData(0, 0, width, height);
    const result = jsQR(data, width, height, {
      inversionAttempts: "attemptBoth",
    });
    return result?.data ?? null;
  } finally {
    bitmap.close();
  }
}
