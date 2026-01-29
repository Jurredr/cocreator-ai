/**
 * Extract a single frame from a video file as a data URL (client-side only).
 * Video is never sent to the server.
 */
export function extractThumbnailFromVideo(
  file: File,
  timeSeconds = 0
): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.muted = true;
    video.playsInline = true;
    video.preload = "metadata";
    video.currentTime = timeSeconds;
    video.onloadeddata = () => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("Canvas context not available"));
        return;
      }
      ctx.drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
      URL.revokeObjectURL(url);
      video.remove();
      resolve(dataUrl);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      video.remove();
      reject(new Error("Failed to load video"));
    };
    video.src = url;
  });
}
