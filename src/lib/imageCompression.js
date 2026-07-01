export function compressImageForStorage(
  file,
  { maxSize = 900, quality = 0.72, mimeType = "image/jpeg" } = {}
) {
  return new Promise((resolve, reject) => {
    if (!file?.type?.startsWith("image/")) {
      reject(new Error("Expected an image file."));
      return;
    }

    const reader = new FileReader();

    reader.onerror = () => reject(new Error("Could not read image file."));
    reader.onload = () => {
      const image = new Image();

      image.onerror = () => reject(new Error("Could not load image file."));
      image.onload = () => {
        const scale = Math.min(
          maxSize / image.width,
          maxSize / image.height,
          1
        );
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        if (!context) {
          reject(new Error("Image compression is unavailable."));
          return;
        }

        canvas.width = width;
        canvas.height = height;
        context.drawImage(image, 0, 0, width, height);
        resolve(canvas.toDataURL(mimeType, quality));
      };

      image.src = reader.result;
    };

    reader.readAsDataURL(file);
  });
}
