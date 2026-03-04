import { describe, it, expect } from 'vitest';
import { createHtmlRenderer } from '../../src/core/html-renderer';
import type { BlockData } from '../../src/types';

describe('XSS Prevention - HTML Renderer Security', () => {
  const renderer = createHtmlRenderer('test');

  describe('SEC-001: Script Tag Prevention', () => {
    it('should escape script tags so they are not executable', () => {
      const block: BlockData = {
        id: 1,
        type: 'paragraph',
        text: 'Hello <script>alert("xss")</script> World',
      };

      const html = renderer.renderBlock(block);
      
      // Script tag should be escaped, not executable
      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;'); // Escaped version
    });

    it('should escape event handlers so they are not executable', () => {
      const block: BlockData = {
        id: 1,
        type: 'paragraph',
        text: 'Click <img src=x onerror="alert(1)">',
      };

      const html = renderer.renderBlock(block);
      
      // Event handler should be escaped
      expect(html).not.toContain('<img src=x onerror=');
      expect(html).toContain('&lt;img'); // HTML escaped
    });
  });

  describe('SEC-002: URL-based XSS Prevention', () => {
    it('should escape javascript: protocol in image src', () => {
      const block: BlockData = {
        id: 1,
        type: 'img-full',
        src: 'javascript:alert("xss")',
        cap: 'Image caption',
      };

      const html = renderer.renderBlock(block);
      
      expect(html).not.toContain('javascript:');
    });

    it('should escape javascript: protocol in CTA button href', () => {
      const block: BlockData = {
        id: 1,
        type: 'cta',
        text: 'Click me',
        label: 'Button',
        url: 'javascript:void(0);alert("xss")',
      };

      const html = renderer.renderBlock(block);
      
      expect(html).not.toContain('javascript:');
    });

    it('should escape data: protocol with dangerous content in image src', () => {
      const block: BlockData = {
        id: 1,
        type: 'img-full',
        src: 'data:text/html,<script>alert("xss")</script>',
      };

      const html = renderer.renderBlock(block);
      
      expect(html).not.toContain('<script>');
    });

    it('should escape vbscript: protocol', () => {
      const block: BlockData = {
        id: 1,
        type: 'cta',
        text: 'Click me',
        label: 'Button',
        url: 'vbscript:msgbox("xss")',
      };

      const html = renderer.renderBlock(block);
      
      expect(html).not.toContain('vbscript:');
    });
  });

  describe('SEC-003: Attribute Injection Prevention', () => {
    it('should reject image src with quote characters to prevent attribute breaking', () => {
      const block: BlockData = {
        id: 1,
        type: 'img-full',
        src: 'image.jpg" onerror="alert(1)',
      };

      const html = renderer.renderBlock(block);
      
      // Invalid URL with quotes should be rejected, so img tag won't render with src
      // The HTML should be empty div (since src is empty) or no img tag at all
      expect(html).not.toContain('onerror');
      expect(html).not.toContain('alert');
    });

    it('should reject URL with quote characters to prevent attribute breaking', () => {
      const block: BlockData = {
        id: 1,
        type: 'cta',
        text: 'Click',
        label: 'Button',
        url: '#" onclick="alert(1)" data-foo="',
      };

      const html = renderer.renderBlock(block);
      
      // Invalid URL with quotes should be rejected
      expect(html).not.toContain('onclick');
      expect(html).not.toContain('alert');
    });
  });

  describe('SEC-004: SVG-based XSS Prevention', () => {
    it('should escape SVG with script content in image src', () => {
      const block: BlockData = {
        id: 1,
        type: 'img-full',
        src: '<svg onload="alert(1)">',
      };

      const html = renderer.renderBlock(block);
      
      expect(html).not.toContain('onload');
      expect(html).not.toContain('<svg');
    });
  });

  describe('SEC-005: Text Content Escaping (Existing)', () => {
    it('should properly escape HTML entities in text', () => {
      const block: BlockData = {
        id: 1,
        type: 'paragraph',
        text: '<b>Bold</b> & "quotes"',
      };

      const html = renderer.renderBlock(block);
      
      expect(html).toContain('&lt;b&gt;');
      expect(html).toContain('&amp;');
      expect(html).not.toContain('<b>Bold</b>');
    });

    it('should escape HTML in image caption', () => {
      const block: BlockData = {
        id: 1,
        type: 'img-full',
        src: 'image.jpg',
        cap: '<script>alert("xss")</script>',
      };

      const html = renderer.renderBlock(block);
      
      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
    });
  });

  describe('SEC-006: Safe URL Detection', () => {
    it('should allow safe http URLs', () => {
      const block: BlockData = {
        id: 1,
        type: 'cta',
        text: 'Click',
        label: 'Button',
        url: 'https://example.com',
      };

      const html = renderer.renderBlock(block);
      
      expect(html).toContain('https://example.com');
    });

    it('should allow safe relative URLs', () => {
      const block: BlockData = {
        id: 1,
        type: 'cta',
        text: 'Click',
        label: 'Button',
        url: '/page/article',
      };

      const html = renderer.renderBlock(block);
      
      expect(html).toContain('/page/article');
    });

    it('should allow anchor links', () => {
      const block: BlockData = {
        id: 1,
        type: 'cta',
        text: 'Click',
        label: 'Button',
        url: '#section',
      };

      const html = renderer.renderBlock(block);
      
      expect(html).toContain('#section');
    });
  });
});
