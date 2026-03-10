/**
 * Client-side image resizing utility using Canvas API.
 * Automatically resizes images over the threshold while preserving aspect ratio.
 */

import type { ResizeResult } from "../types";

const RESIZE_THRESHOLD = 10 * 1024 * 1024; // 10MB
const ABSOLUTE_MAX_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_UPLOAD_SIZE = 10 * 1024 * 1024; // 10MB for upload validation
const SKIP_RESIZE_TYPES = ["image/gif"];

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/** Magic numbers (file signatures) for image format verification */
const MAGIC_NUMBERS = {
  jpeg: [0xFF, 0xD8, 0xFF],
  png: [0x89, 0x50, 0x4E, 0x47],
  gif: [0x47, 0x49, 0x46],
  webp: [0x52, 0x49, 0x46, 0x46], // RIFF (need to check for WEBP signature later)
};

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

/** Validate image file type and size - returns error string or null */
export function validateImageFile(file: File): string | null {
  const result = performImageValidation(file);
  return result.valid ? null : (result.error ?? "파일 검증에 실패했습니다.");
}

/** Full validation returning detailed result */
export function validateImageFileDetailed(file: File): ValidationResult {
  return performImageValidation(file);
}

/** Image validation result interface */
export interface ValidationResult {
  valid: boolean;
  error?: string;
  hasMetadata?: boolean;
}

/**
 * Comprehensive image file validation (sync version)
 * - Validates MIME type
 * - Checks file size
 * - Validates filename
 * - Validates against SVG/script injection
 */
function performImageValidation(file: File): ValidationResult {
  // 0. Special handling for SVG files (security risk) - check first
  if (file.type === "image/svg+xml") {
    return {
      valid: false,
      error: "SVG 파일은 보안상의 이유로 업로드가 제한됩니다.",
    };
  }

  // 1. MIME type validation
  if (!file.type) {
    return {
      valid: false,
      error: "파일 형식이 지정되지 않았습니다.",
    };
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `지원하지 않는 파일 형식입니다: ${file.type}. 허용된 형식: jpeg, png, webp, gif`,
    };
  }

  // 2. File size validation
  if (file.size === 0) {
    return {
      valid: false,
      error: "파일이 비어있습니다.",
    };
  }

  if (file.size > MAX_UPLOAD_SIZE) {
    return {
      valid: false,
      error: `파일 크기가 10MB를 초과합니다: ${(file.size / 1024 / 1024).toFixed(1)}MB`,
    };
  }

  // 3. Filename validation
  const filenameError = validateFilename(file.name);
  if (filenameError) {
    return {
      valid: false,
      error: filenameError,
    };
  }

  // 4. Check for malicious content in filename
  if (file.name.includes("\0")) {
    return {
      valid: false,
      error: "파일명에 올바르지 않은 문자가 포함되어 있습니다.",
    };
  }

  // 5. Special handling for SVG files (security risk)
  if (file.type === "image/svg+xml") {
    return {
      valid: false,
      error: "SVG 파일은 보안상의 이유로 업로드가 제한됩니다.",
    };
  }

  // Return valid with metadata detection
  return {
    valid: true,
    hasMetadata: checkPotentialMetadata(file.type),
  };
}

/**
 * Async magic number validation for enhanced security
 * Validates that file content matches the claimed MIME type
 */
export async function validateImageFileAsync(file: File): Promise<ValidationResult> {
  // First do sync validation
  const syncResult = performImageValidation(file);
  if (!syncResult.valid) {
    return syncResult;
  }

  // Then validate magic numbers
  try {
    const magicResult = await validateMagicNumbers(file);
    if (!magicResult.valid) {
      return magicResult;
    }
  } catch (e) {
    // If we can't read the file, reject it
    return {
      valid: false,
      error: "파일 형식 검증에 실패했습니다.",
    };
  }

  return syncResult;
}

/**
 * Validate file magic numbers (file signatures)
 */
async function validateMagicNumbers(file: File): Promise<ValidationResult> {
  try {
    const buffer = await file.slice(0, 12).arrayBuffer();
    const bytes = new Uint8Array(buffer);

    const mimeType = file.type;

    // Check magic numbers based on claimed MIME type
    if (mimeType === "image/jpeg") {
      // JPEG: FF D8 FF
      if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
        return { valid: true };
      }
      return {
        valid: false,
        error: "파일 형식이 올바르지 않습니다: JPEG로 클레임되었지만 다른 형식입니다.",
      };
    }

    if (mimeType === "image/png") {
      // PNG: 89 50 4E 47
      if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
        return { valid: true };
      }
      return {
        valid: false,
        error: "파일 형식이 올바르지 않습니다: PNG로 클레임되었지만 다른 형식입니다.",
      };
    }

    if (mimeType === "image/gif") {
      // GIF: 47 49 46 (GIF)
      if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
        return { valid: true };
      }
      return {
        valid: false,
        error: "파일 형식이 올바르지 않습니다: GIF로 클레임되었지만 다른 형식입니다.",
      };
    }

    if (mimeType === "image/webp") {
      // WebP: RIFF ... WEBP
      if (
        bytes[0] === 0x52 &&
        bytes[1] === 0x49 &&
        bytes[2] === 0x46 &&
        bytes[3] === 0x46 &&
        bytes[8] === 0x57 &&
        bytes[9] === 0x45 &&
        bytes[10] === 0x42 &&
        bytes[11] === 0x50
      ) {
        return { valid: true };
      }
      return {
        valid: false,
        error: "파일 형식이 올바르지 않습니다: WebP로 클레임되었지만 다른 형식입니다.",
      };
    }

    return { valid: true };
  } catch (e) {
    return {
      valid: false,
      error: "파일 내용 검증에 실패했습니다.",
    };
  }
}

/**
 * Validate filename for security issues
 */
function validateFilename(filename: string): string | null {
  // Check for path traversal
  if (filename.includes("../") || filename.includes("..\\")) {
    return "파일명에 경로 이동 문자가 포함되어 있습니다.";
  }

  // Check for double extensions (e.g., photo.jpg.exe)
  const parts = filename.split(".");
  if (parts.length > 2) {
    const ext = parts[parts.length - 1].toLowerCase();
    // Common dangerous extensions
    const dangerousExts = ["exe", "bat", "cmd", "com", "pif", "scr", "vbs", "js", "jar", "zip"];
    if (dangerousExts.includes(ext)) {
      return "위험한 파일 확장자가 감지되었습니다.";
    }
  }

  return null;
}

/**
 * Check if file metadata might be present
 * This is a heuristic check based on file type
 */
function checkPotentialMetadata(mimeType: string): boolean {
  // JPEG and PNG files commonly contain metadata
  return mimeType === "image/jpeg" || mimeType === "image/png";
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
