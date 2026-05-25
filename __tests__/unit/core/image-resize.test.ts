/**
 * Unit tests for src/core/image-resize.ts.
 *
 * Layer ownership note:
 *   `__tests__/security/file-upload-validation.test.ts` already exercises the
 *   broader OWASP-style cases against `validateImageFileDetailed` and
 *   `validateImageFileAsync` (executable masquerade, PDF rejection, SVG XSS,
 *   path traversal, double-extension, EXIF metadata flag, JPEG/PNG magic
 *   numbers). This file intentionally avoids those cases and focuses on:
 *
 *   1. `validateImageFile` (sync, `string | null`) — return-shape contract +
 *      one canonical example per failure branch so the wrapper that converts
 *      `{ valid, error? }` to `string | null` is exercised end-to-end.
 *   2. `validateImageFileAsync` — magic-number branches the security file
 *      does NOT cover (GIF success, WebP success/failure, unsupported MIME
 *      fall-through, arrayBuffer throw path).
 *   3. `resizeImageIfNeeded` — branch coverage for the early returns
 *      (threshold + GIF skip). Canvas-dependent stages are deliberately not
 *      asserted on real pixel output because jsdom's canvas is a stub —
 *      pixel/quality assertions would be testing the stub, not the impl.
 */

import { describe, it, expect } from 'vitest';
import {
  validateImageFile,
  validateImageFileAsync,
  resizeImageIfNeeded,
} from '../../../src/core/image-resize';

// --- helpers ---------------------------------------------------------------

/** Build a File whose .size reports the requested byte count without
 *  actually allocating that many bytes (jsdom honors the constructor data
 *  length, so we use a single Blob-with-fake-size pattern). */
function fileOfSize(bytes: number, name: string, type: string): File {
  const chunk = new Uint8Array(1);
  const f = new File([chunk], name, { type });
  Object.defineProperty(f, 'size', { value: bytes, configurable: true });
  return f;
}

function fileFromBytes(bytes: number[], name: string, type: string): File {
  return new File([new Uint8Array(bytes)], name, { type });
}

// --- validateImageFile (sync, string | null) -------------------------------

describe('validateImageFile (sync wrapper, string | null contract)', () => {
  it('returns null for a valid JPEG', () => {
    const file = new File(['ok'], 'photo.jpg', { type: 'image/jpeg' });
    expect(validateImageFile(file)).toBeNull();
  });

  it('returns the SVG rejection message (SVG is blocked before MIME check)', () => {
    const file = new File(['<svg/>'], 'a.svg', { type: 'image/svg+xml' });
    const err = validateImageFile(file);
    expect(err).not.toBeNull();
    expect(err).toContain('SVG');
  });

  it('returns the "MIME missing" message when File has empty type', () => {
    const file = new File(['x'], 'mystery.bin', { type: '' });
    const err = validateImageFile(file);
    expect(err).not.toBeNull();
    expect(err).toContain('지정');
  });

  it('returns the "unsupported format" message including the bad MIME', () => {
    const file = new File(['x'], 'doc.pdf', { type: 'application/pdf' });
    const err = validateImageFile(file);
    expect(err).not.toBeNull();
    expect(err).toContain('application/pdf');
  });

  it('returns the "empty file" message when size is 0', () => {
    const file = new File([], 'empty.png', { type: 'image/png' });
    expect(file.size).toBe(0);
    const err = validateImageFile(file);
    expect(err).toContain('비어');
  });

  it('returns the "size > 10MB" message including a MB number', () => {
    const file = fileOfSize(11 * 1024 * 1024, 'big.jpg', 'image/jpeg');
    const err = validateImageFile(file);
    expect(err).not.toBeNull();
    expect(err).toContain('MB');
  });

  it('returns the path-traversal message for ../ filenames', () => {
    const file = new File(['x'], '../evil.jpg', { type: 'image/jpeg' });
    const err = validateImageFile(file);
    expect(err).toContain('경로');
  });

  it('returns the null-byte filename message', () => {
    const file = new File(['x'], 'photo\0.jpg', { type: 'image/jpeg' });
    const err = validateImageFile(file);
    // Null-byte branch sits after filename validation; double-extension
    // path isn't triggered by this name so we land on the null-byte case.
    expect(err).not.toBeNull();
    expect(err).toContain('올바르지');
  });
});

// --- validateImageFileAsync (magic-number gaps) ----------------------------

describe('validateImageFileAsync (magic-number branches not covered by security suite)', () => {
  it('accepts a GIF whose bytes start with "GIF"', async () => {
    // 0x47 0x49 0x46 = "GIF"
    const file = fileFromBytes([0x47, 0x49, 0x46, 0x38, 0x39, 0x61], 'a.gif', 'image/gif');
    const result = await validateImageFileAsync(file);
    expect(result.valid).toBe(true);
  });

  it('rejects a GIF-claimed file whose bytes are not the GIF signature', async () => {
    // PNG signature claimed as GIF
    const file = fileFromBytes([0x89, 0x50, 0x4e, 0x47], 'fake.gif', 'image/gif');
    const result = await validateImageFileAsync(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('GIF');
  });

  it('accepts a WebP whose bytes match the RIFF....WEBP signature', async () => {
    // RIFF (4) + size (4) + WEBP (4) = 12 bytes minimum
    const file = fileFromBytes(
      [0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50],
      'a.webp',
      'image/webp',
    );
    const result = await validateImageFileAsync(file);
    expect(result.valid).toBe(true);
  });

  it('rejects a WebP-claimed file whose tail bytes are not "WEBP"', async () => {
    // RIFF header but tail = "AVI " — a real but wrong RIFF subtype.
    const file = fileFromBytes(
      [0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x41, 0x56, 0x49, 0x20],
      'fake.webp',
      'image/webp',
    );
    const result = await validateImageFileAsync(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('WebP');
  });

  it('returns the sync rejection unchanged when sync validation already fails', async () => {
    // SVG is rejected synchronously; async layer should short-circuit.
    const file = new File(['<svg/>'], 'a.svg', { type: 'image/svg+xml' });
    const result = await validateImageFileAsync(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('SVG');
  });

  it('surfaces an arrayBuffer read failure as a validation error', async () => {
    const file = new File(['x'], 'photo.jpg', { type: 'image/jpeg' });
    // Replace slice(...).arrayBuffer() with a rejecting promise to hit the
    // catch branch in validateMagicNumbers (which itself returns an error
    // shape, which is then returned by validateImageFileAsync's success path
    // since no throw escapes — we still get valid:false).
    const badSlice = {
      arrayBuffer: () => Promise.reject(new Error('disk read failed')),
    };
    Object.defineProperty(file, 'slice', {
      value: () => badSlice as unknown as Blob,
      configurable: true,
    });
    const result = await validateImageFileAsync(file);
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });
});

// --- resizeImageIfNeeded (early-return branches only) ----------------------

describe('resizeImageIfNeeded (early-return branches)', () => {
  it('returns the original file unchanged when size is at/below threshold', async () => {
    // Threshold is 10MB; 1KB is well below.
    const file = new File([new Uint8Array(1024)], 'small.jpg', { type: 'image/jpeg' });
    const result = await resizeImageIfNeeded(file);
    expect(result.wasResized).toBe(false);
    expect(result.file).toBe(file);
    expect(result.originalSize).toBe(file.size);
    expect(result.newSize).toBe(file.size);
  });

  it('returns the original file when type is image/gif even if oversized (animation preserved)', async () => {
    // Fake size > 10MB threshold; type is GIF so SKIP_RESIZE_TYPES wins.
    const file = fileOfSize(15 * 1024 * 1024, 'big.gif', 'image/gif');
    const result = await resizeImageIfNeeded(file);
    expect(result.wasResized).toBe(false);
    expect(result.file).toBe(file);
    expect(result.originalSize).toBe(15 * 1024 * 1024);
    expect(result.newSize).toBe(15 * 1024 * 1024);
  });

  // NOTE: Stage 1 (quality) / Stage 2 (dimension) branches require a working
  // canvas + Image decoder. jsdom provides only stubs (toBlob returns null,
  // Image.onload never fires for blob: URLs), so any assertion past the early
  // returns would be testing the stub. Those branches are exercised by the
  // integration suite once a real browser is available.
});
