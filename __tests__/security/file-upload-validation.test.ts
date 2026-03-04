import { describe, it, expect, beforeEach } from 'vitest';
import { validateImageFile, validateImageFileAsync } from '../../src/core/image-resize';
import type { ResizeResult } from '../../src/types';

describe('SEC-002: File Upload Validation - Image Security', () => {
  describe('File Type Validation', () => {
    it('should accept JPEG files', () => {
      const file = new File(['fake image data'], 'photo.jpg', { type: 'image/jpeg' });
      
      const result = validateImageFile(file);
      
      expect(result.valid).toBe(true);
    });

    it('should accept PNG files', () => {
      const file = new File(['fake image data'], 'photo.png', { type: 'image/png' });
      
      const result = validateImageFile(file);
      
      expect(result.valid).toBe(true);
    });

    it('should accept WebP files', () => {
      const file = new File(['fake image data'], 'photo.webp', { type: 'image/webp' });
      
      const result = validateImageFile(file);
      
      expect(result.valid).toBe(true);
    });

    it('should accept GIF files', () => {
      const file = new File(['fake image data'], 'animation.gif', { type: 'image/gif' });
      
      const result = validateImageFile(file);
      
      expect(result.valid).toBe(true);
    });

    it('should reject executable files masquerading as images', () => {
      const file = new File(['MZ\x90'], 'malware.jpg', { type: 'application/exe' });
      
      const result = validateImageFile(file);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('지원');
    });

    it('should reject PDF files', () => {
      const file = new File(['%PDF-1.4'], 'document.jpg', { type: 'application/pdf' });
      
      const result = validateImageFile(file);
      
      expect(result.valid).toBe(false);
    });

    it('should reject SVG files with scripts', () => {
      const svgContent = '<svg onload="alert(1)"><script>alert("xss")</script></svg>';
      const file = new File([svgContent], 'malicious.svg', { type: 'image/svg+xml' });
      
      const result = validateImageFile(file);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('보안');
    });

    it('should reject files without MIME type', () => {
      const file = new File(['data'], 'file.bin');
      
      const result = validateImageFile(file);
      
      expect(result.valid).toBe(false);
    });
  });

  describe('File Size Validation', () => {
    it('should accept files under size limit', () => {
      const smallFile = new File(['x'.repeat(1000)], 'small.jpg', { type: 'image/jpeg' });
      
      const result = validateImageFile(smallFile);
      
      expect(result.valid).toBe(true);
    });

    it('should reject files exceeding size limit (10MB)', () => {
      // 11MB
      const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
      
      const result = validateImageFile(largeFile);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('MB');
    });

    it('should reject empty files', () => {
      const emptyFile = new File([], 'empty.jpg', { type: 'image/jpeg' });
      
      const result = validateImageFile(emptyFile);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('비어');
    });
  });

  describe('Filename Validation', () => {
    it('should accept normal filenames', () => {
      const file = new File(['data'], 'photo-2024-03-03.jpg', { type: 'image/jpeg' });
      
      const result = validateImageFile(file);
      
      expect(result.valid).toBe(true);
    });

    it('should reject filenames with path traversal attempts', () => {
      const file = new File(['data'], '../../../etc/passwd.jpg', { type: 'image/jpeg' });
      
      const result = validateImageFile(file);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('경로');
    });

    it('should reject filenames with null bytes', () => {
      const file = new File(['data'], 'photo.jpg\0.exe', { type: 'image/jpeg' });
      
      const result = validateImageFile(file);
      
      expect(result.valid).toBe(false);
    });

    it('should accept filenames with spaces and special characters', () => {
      const file = new File(['data'], 'my photo (2024).jpg', { type: 'image/jpeg' });
      
      const result = validateImageFile(file);
      
      expect(result.valid).toBe(true);
    });

    it('should reject filenames with double extensions', () => {
      const file = new File(['data'], 'photo.jpg.exe', { type: 'image/jpeg' });
      
      const result = validateImageFile(file);
      
      expect(result.valid).toBe(false);
    });
  });

  describe('Image Content Validation (Magic Numbers)', () => {
    it('should validate JPEG magic numbers', async () => {
      // JPEG magic: FF D8 FF
      const jpegData = Buffer.from([0xFF, 0xD8, 0xFF]);
      const file = new File([jpegData], 'photo.jpg', { type: 'image/jpeg' });
      
      const result = await validateImageFileAsync(file);
      
      expect(result.valid).toBe(true);
    });

    it('should validate PNG magic numbers', async () => {
      // PNG magic: 89 50 4E 47
      const pngData = Buffer.from([0x89, 0x50, 0x4E, 0x47]);
      const file = new File([pngData], 'photo.png', { type: 'image/png' });
      
      const result = await validateImageFileAsync(file);
      
      expect(result.valid).toBe(true);
    });

    it('should reject file with wrong magic numbers for claimed type', async () => {
      // PDF magic: 25 50 44 46 (%PDF)
      const pdfData = Buffer.from([0x25, 0x50, 0x44, 0x46]);
      const file = new File([pdfData], 'photo.jpg', { type: 'image/jpeg' });
      
      const result = await validateImageFileAsync(file);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('올바르지');
    });
  });

  describe('Metadata Security', () => {
    it('should identify files with EXIF data', () => {
      // JPEG with EXIF marker: FF D8 FF E1
      const jpegWithExif = Buffer.from([0xFF, 0xD8, 0xFF, 0xE1, 0x00, 0x10, 0x45, 0x78, 0x69, 0x66]);
      const file = new File([jpegWithExif], 'photo.jpg', { type: 'image/jpeg' });
      
      const result = validateImageFile(file);
      
      expect(result.valid).toBe(true);
      expect(result.hasMetadata).toBe(true);
    });

    it('should warn about potential metadata in PNG', () => {
      // PNG with text chunk marker: 89 50 4E 47 ... 74 45 58 74
      const pngWithMetadata = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x00, 0x00, 0x00, 0x00, 0x74, 0x45, 0x58, 0x74]);
      const file = new File([pngWithMetadata], 'photo.png', { type: 'image/png' });
      
      const result = validateImageFile(file);
      
      expect(result.valid).toBe(true);
      expect(result.hasMetadata).toBe(true);
    });
  });
});
