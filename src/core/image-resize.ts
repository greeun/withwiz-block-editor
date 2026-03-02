/**
 * Client-side image resizing utility using Canvas API.
 * Automatically resizes images over the threshold while preserving aspect ratio.
 */

import type { ResizeResult } from "../types";

const RESIZE_THRESHOLD = 10 * 1024 * 1024; // 10MB
const ABSOLUTE_MAX_SIZE = 50 * 1024 * 1024; // 50MB
const SKIP_RESIZE_TYPES = ["image/gif"];

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/**
 * Resizes images over 10MB using Canvas API.
 * Preserves aspect ratio with a two-stage strategy:
 * - Stage 1: Quality adjustment only
 * - Stage 2: Dimension reduction + quality
 *
 * GIF images are returned as-is (animation loss prevention).
 */
export async function resizeImageIfNeeded(file: File): Promise<ResizeResult> {
  const originalSize = file.size;

  if (file.size <= RESIZE_THRESHOLD) {
    return { file, wasResized: false, originalSize, newSize: originalSize };
  }

  if (SKIP_RESIZE_TYPES.includes(file.type)) {
    return { file, wasResized: false, originalSize, newSize: originalSize };
  }

  const img = await loadImage(file);
  const { width, height } = img;

  const outputMime =
    file.type === "image/png" ? "image/jpeg" : file.type || "image/jpeg";

  // Stage 1: quality only (keep original dimensions)
  const qualitySteps = [0.85, 0.75, 0.65, 0.55, 0.5];
  for (const quality of qualitySteps) {
    const blob = await canvasToBlob(img, width, height, outputMime, quality);
    if (blob.size <= RESIZE_THRESHOLD) {
      return toResult(blob, file.name, outputMime, originalSize);
    }
  }

  // Stage 2: dimension reduction + quality 0.75
  const scaleSteps = [0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3];
  for (const scale of scaleSteps) {
    const newW = Math.round(width * scale);
    const newH = Math.round(height * scale);
    const blob = await canvasToBlob(img, newW, newH, outputMime, 0.75);
    if (blob.size <= RESIZE_THRESHOLD) {
      return toResult(blob, file.name, outputMime, originalSize);
    }
  }

  // Last resort: minimum scale + minimum quality
  const finalW = Math.round(width * 0.3);
  const finalH = Math.round(height * 0.3);
  const finalBlob = await canvasToBlob(img, finalW, finalH, outputMime, 0.5);
  return toResult(finalBlob, file.name, outputMime, originalSize);
}

/** Validate image file type and size */
export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    const allowed = ALLOWED_IMAGE_TYPES.map((t) => t.split("/")[1]).join(", ");
    return `지원하지 않는 파일 형식입니다. (허용: ${allowed})`;
  }
  if (file.size > ABSOLUTE_MAX_SIZE) {
    return `파일 크기가 너무 큽니다. (${(file.size / 1024 / 1024).toFixed(0)}MB, 최대 50MB)`;
  }
  if (SKIP_RESIZE_TYPES.includes(file.type) && file.size > RESIZE_THRESHOLD) {
    return `GIF 파일은 10MB 이하만 업로드할 수 있습니다. (${(file.size / 1024 / 1024).toFixed(1)}MB)`;
  }
  return null;
}

// --- internal helpers ---

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("이미지 로드에 실패했습니다."));
    };
    img.src = url;
  });
}

function canvasToBlob(
  img: HTMLImageElement,
  width: number,
  height: number,
  mime: string,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      reject(new Error("이미지 처리에 실패했습니다."));
      return;
    }
    if (mime === "image/jpeg") {
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, width, height);
    }
    ctx.drawImage(img, 0, 0, width, height);
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("이미지 변환에 실패했습니다."));
      },
      mime,
      quality,
    );
  });
}

function toResult(
  blob: Blob,
  originalName: string,
  mime: string,
  originalSize: number,
): ResizeResult {
  const ext =
    mime === "image/jpeg" ? ".jpg" : mime === "image/webp" ? ".webp" : ".png";
  const baseName = originalName.replace(/\.[^.]+$/, "");
  const file = new File([blob], `${baseName}${ext}`, { type: mime });
  return { file, wasResized: true, originalSize, newSize: blob.size };
}
