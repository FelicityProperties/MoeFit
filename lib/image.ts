// Client-side helper: downscale a photo (max edge ~1024px, JPEG) so meal-photo
// uploads stay small and fast while remaining clear enough for the model to read.
// Only import from client components — it uses browser APIs (Image/canvas).

export interface ResizedImage {
  /** full data: URL, for previews */
  dataUrl: string;
  /** base64 payload without the data: prefix, for the API */
  data: string;
  mediaType: string;
}

export function fileToResizedImage(file: File, maxDim = 1024): Promise<ResizedImage> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (Math.max(width, height) > maxDim) {
        if (width >= height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const cx = canvas.getContext("2d");
      if (!cx) return reject(new Error("no canvas context"));
      cx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
      resolve({ dataUrl, data: dataUrl.split(",")[1] ?? "", mediaType: "image/jpeg" });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("image load error"));
    };
    img.src = url;
  });
}
