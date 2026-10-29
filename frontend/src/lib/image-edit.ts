export function canvasFile(canvas: HTMLCanvasElement, name: string): Promise<File> {
  return new Promise((resolve, reject) => canvas.toBlob(blob => {
    if (!blob) { reject(new Error("Could not export the image.")); return; }
    resolve(new File([blob], name.replace(/\.[^.]+$/, "") + ".png", { type: "image/png" }));
  }, "image/png"));
}

export async function stripImageMetadata(file: File): Promise<File> {
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type))
    throw new Error("Metadata removal supports PNG, JPEG, and WebP. Turn it off to upload other formats unchanged.");
  const bitmap = await createImageBitmap(file);
  try {
    if (bitmap.width * bitmap.height > 40_000_000) throw new Error("Image editing is limited to 40 megapixels.");
    const canvas = document.createElement("canvas"); canvas.width = bitmap.width; canvas.height = bitmap.height;
    const context = canvas.getContext("2d"); if (!context) throw new Error("Image editing is unavailable in this browser.");
    context.drawImage(bitmap, 0, 0);
    return await canvasFile(canvas, file.name);
  } finally { bitmap.close(); }
}
