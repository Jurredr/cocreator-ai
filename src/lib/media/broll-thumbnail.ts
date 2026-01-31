/**
 * Extract a single frame from a video file as a data URL (client-side only).
 * Video is never sent to the server.
 * Uses seeked event and a small time offset (1s) so the first frame is decoded
 * and not black (some codecs don't paint frame 0 until after seek).
 */
export function extractThumbnailFromVideo(
  file: File,
  timeSeconds = 1
): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";

    function drawFrame() {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        cleanup();
        reject(new Error("Canvas context not available"));
        return;
      }
      ctx.drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
      cleanup();
      resolve(dataUrl);
    }

    function cleanup() {
      URL.revokeObjectURL(url);
      video.remove();
    }

    video.onseeked = () => drawFrame();
    video.onerror = () => {
      cleanup();
      reject(new Error("Failed to load video"));
    };
    video.src = url;
    video.load();
    // Seek to timeSeconds so the frame is decoded (avoids black frame at 0)
    video.currentTime = Math.min(timeSeconds, 2);
  });
}
