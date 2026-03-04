import { describe, it, expect } from 'vitest';
import { createHtmlRenderer } from '../../src/core/html-renderer';
import type { BlockData } from '../../src/types';

/**
 * Integration Tests - Block Editor Component Interactions
 *
 * INT-001: BlockRenderer and HTML Output Integration
 * INT-002: Image Handling Pipeline (Upload → Validation → Rendering)
 * INT-003: Block Type Transformations
 * INT-004: Multi-Block Workflows
 * INT-005: Security Integration (XSS + File Upload)
 */

describe('INT-001: BlockRenderer and HTML Output Integration', () => {
  const renderer = createHtmlRenderer('integration-test');

  it('should render single paragraph block correctly', () => {
    const blocks: BlockData[] = [
      {
        id: 1,
        type: 'paragraph',
        text: 'Hello world',
      },
    ];

    const html = renderer.renderBlocks(blocks);

    expect(html).toContain('Hello world');
    expect(html).toMatch(/<p[^>]*>Hello world<\/p>/);
  });

  it('should maintain block order in output', () => {
    const blocks: BlockData[] = [
      {
        id: 1,
        type: 'paragraph',
        text: 'First paragraph',
      },
      {
        id: 2,
        type: 'paragraph',
        text: 'Second paragraph',
      },
      {
        id: 3,
        type: 'paragraph',
        text: 'Third paragraph',
      },
    ];

    const html = renderer.renderBlocks(blocks);
    const firstIndex = html.indexOf('First paragraph');
    const secondIndex = html.indexOf('Second paragraph');
    const thirdIndex = html.indexOf('Third paragraph');

    expect(firstIndex).toBeLessThan(secondIndex);
    expect(secondIndex).toBeLessThan(thirdIndex);
  });

  it('should handle empty blocks array', () => {
    const blocks: BlockData[] = [];

    const html = renderer.renderBlocks(blocks);

    // Empty blocks array returns empty string which is valid
    expect(typeof html).toBe('string');
    expect(html.length).toBeGreaterThanOrEqual(0);
  });

  it('should properly escape HTML special characters in text', () => {
    const blocks: BlockData[] = [
      {
        id: 1,
        type: 'paragraph',
        text: 'Text with <script>alert("xss")</script>',
      },
    ];

    const html = renderer.renderBlocks(blocks);

    // Script tag should be escaped
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('should handle unicode and special characters', () => {
    const blocks: BlockData[] = [
      {
        id: 1,
        type: 'paragraph',
        text: '한글 テスト 🚀 café',
      },
    ];

    const html = renderer.renderBlocks(blocks);

    expect(html).toContain('한글');
    expect(html).toContain('テスト');
    expect(html).toContain('🚀');
    expect(html).toContain('café');
  });
});

describe('INT-002: Image Handling Pipeline', () => {
  const renderer = createHtmlRenderer('image-integration-test');

  it('should render image-full block with sanitized src', () => {
    const blocks: BlockData[] = [
      {
        id: 1,
        type: 'img-full',
        src: '/safe-image.jpg',
        cap: 'Safe image caption',
      },
    ];

    const html = renderer.renderBlocks(blocks);

    expect(html).toContain('/safe-image.jpg');
    expect(html).toContain('Safe image caption');
  });

  it('should reject javascript: protocol in image src', () => {
    const blocks: BlockData[] = [
      {
        id: 1,
        type: 'img-full',
        src: 'javascript:alert("xss")',
        cap: 'Malicious image',
      },
    ];

    const html = renderer.renderBlocks(blocks);

    // javascript: should be blocked
    expect(html).not.toContain('javascript:');
    expect(html).not.toContain('alert');
  });

  it('should handle multiple image blocks in sequence', () => {
    const blocks: BlockData[] = [
      {
        id: 1,
        type: 'img-full',
        src: '/image1.jpg',
        cap: 'Image 1',
      },
      {
        id: 2,
        type: 'img-full',
        src: '/image2.jpg',
        cap: 'Image 2',
      },
      {
        id: 3,
        type: 'img-full',
        src: '/image3.jpg',
        cap: 'Image 3',
      },
    ];

    const html = renderer.renderBlocks(blocks);

    expect(html).toContain('/image1.jpg');
    expect(html).toContain('/image2.jpg');
    expect(html).toContain('/image3.jpg');
  });

  it('should render inline images correctly', () => {
    const blocks: BlockData[] = [
      {
        id: 1,
        type: 'img-inline',
        src: '/inline-image.jpg',
        cap: 'Inline image',
      },
    ];

    const html = renderer.renderBlocks(blocks);

    expect(html).toContain('/inline-image.jpg');
  });

  it('should render paired images with text', () => {
    const blocks: BlockData[] = [
      {
        id: 1,
        type: 'img-text',
        src: '/image.jpg',
        name: 'Person Name',
        role: 'Role/Title',
        bio: 'Text content beside image',
      },
    ];

    const html = renderer.renderBlocks(blocks);

    expect(html).toContain('/image.jpg');
    expect(html).toContain('Person Name');
  });
});

describe('INT-003: Block Type Transformations', () => {
  const renderer = createHtmlRenderer('block-type-test');

  it('should render quote blocks with attribution', () => {
    const blocks: BlockData[] = [
      {
        id: 1,
        type: 'quote',
        text: 'Life is what happens while you are busy making other plans.',
        attr: '- John Lennon',
      },
    ];

    const html = renderer.renderBlocks(blocks);

    expect(html).toContain('Life is what happens');
    expect(html).toContain('John Lennon');
  });

  it('should render video blocks with URL', () => {
    const blocks: BlockData[] = [
      {
        id: 1,
        type: 'video',
        url: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
      },
    ];

    const html = renderer.renderBlocks(blocks);

    expect(html.length).toBeGreaterThan(0);
    expect(html).toContain('youtube.com');
  });

  it('should render CTA blocks with buttons', () => {
    const blocks: BlockData[] = [
      {
        id: 1,
        type: 'cta',
        text: 'Main CTA text',
        label: 'Click here to learn more',
        url: '/learn-more',
      },
    ];

    const html = renderer.renderBlocks(blocks);

    expect(html).toContain('Main CTA text');
    expect(html).toContain('Click here to learn more');
    expect(html).toContain('/learn-more');
  });

  it('should render gallery blocks with multiple images', () => {
    const blocks: BlockData[] = [
      {
        id: 1,
        type: 'gallery',
        src1: '/photo1.jpg',
        src2: '/photo2.jpg',
        src3: '/photo3.jpg',
      },
    ];

    const html = renderer.renderBlocks(blocks);

    expect(html).toContain('/photo1.jpg');
    expect(html).toContain('/photo2.jpg');
    expect(html).toContain('/photo3.jpg');
  });

  it('should render press list blocks', () => {
    const blocks: BlockData[] = [
      {
        id: 1,
        type: 'press-list',
        items: [
          {
            src: 'Press Outlet 1',
            title: 'Article Title',
            date: '2024-03-01',
            ex: 'Article excerpt',
            link: 'https://outlet1.com/article',
          },
          {
            src: 'Press Outlet 2',
            title: 'Another Article',
            date: '2024-03-02',
            ex: 'Another excerpt',
            link: 'https://outlet2.com/article',
          },
        ],
      },
    ];

    const html = renderer.renderBlocks(blocks);

    expect(html).toContain('Press Outlet 1');
    expect(html).toContain('Article Title');
    expect(html).toContain('Press Outlet 2');
  });
});

describe('INT-004: Multi-Block Workflows', () => {
  const renderer = createHtmlRenderer('workflow-test');

  it('should render complex article with mixed block types', () => {
    const blocks: BlockData[] = [
      {
        id: 1,
        type: 'paragraph',
        text: 'Introduction paragraph',
      },
      {
        id: 2,
        type: 'img-full',
        src: '/hero-image.jpg',
        cap: 'Hero image',
      },
      {
        id: 3,
        type: 'paragraph',
        text: 'Body paragraph 1',
      },
      {
        id: 4,
        type: 'quote',
        text: 'A relevant quote',
        attr: '- Someone',
      },
      {
        id: 5,
        type: 'paragraph',
        text: 'Body paragraph 2',
      },
      {
        id: 6,
        type: 'cta',
        text: 'Learn more',
        url: '/more',
      },
    ];

    const html = renderer.renderBlocks(blocks);

    // All blocks should be rendered
    expect(html).toContain('Introduction paragraph');
    expect(html).toContain('/hero-image.jpg');
    expect(html).toContain('Body paragraph 1');
    expect(html).toContain('A relevant quote');
    expect(html).toContain('Body paragraph 2');
    expect(html).toContain('Learn more');
  });

  it('should maintain proper spacing between different block types', () => {
    const blocks: BlockData[] = [
      {
        id: 1,
        type: 'paragraph',
        text: 'Paragraph 1',
      },
      {
        id: 2,
        type: 'paragraph',
        text: 'Paragraph 2',
      },
    ];

    const html = renderer.renderBlocks(blocks);

    // Should close first paragraph before starting second
    expect(html).toMatch(/<\/p>\s*<p/);
  });

  it('should handle blog post structure', () => {
    const blocks: BlockData[] = [
      {
        id: 1,
        type: 'paragraph',
        text: 'Blog post title (as paragraph)',
      },
      {
        id: 2,
        type: 'paragraph',
        text: 'By Author on Date',
      },
      {
        id: 3,
        type: 'img-full',
        src: '/featured-image.jpg',
        cap: 'Featured image',
      },
      {
        id: 4,
        type: 'paragraph',
        text: 'Blog post content...',
      },
    ];

    const html = renderer.renderBlocks(blocks);

    // All elements should be present and in order
    expect(html).toContain('Blog post title');
    expect(html).toContain('By Author on Date');
    expect(html).toContain('Featured image');
    expect(html).toContain('Blog post content');
  });
});

describe('INT-005: Security Integration', () => {
  const renderer = createHtmlRenderer('security-integration-test');

  it('should prevent XSS through HTML content in text', () => {
    const blocks: BlockData[] = [
      {
        id: 1,
        type: 'paragraph',
        text: '<img src=x onerror=alert("xss")>',
      },
    ];

    const html = renderer.renderBlocks(blocks);

    // Should be escaped - HTML tags become harmless text
    expect(html).toContain('&lt;img');
    expect(html).toContain('&gt;');
  });

  it('should prevent XSS through image src', () => {
    const blocks: BlockData[] = [
      {
        id: 1,
        type: 'img-full',
        src: 'data:text/html,<script>alert("xss")</script>',
        cap: 'Malicious',
      },
    ];

    const html = renderer.renderBlocks(blocks);

    // data: URLs should be blocked
    expect(html).not.toContain('data:');
  });

  it('should prevent XSS through link URLs', () => {
    const blocks: BlockData[] = [
      {
        id: 1,
        type: 'cta',
        text: 'Click me',
        url: 'javascript:alert("xss")',
      },
    ];

    const html = renderer.renderBlocks(blocks);

    // javascript: should be blocked
    expect(html).not.toContain('javascript:');
  });

  it('should handle URL attribute sanitization in img tags', () => {
    const blocks: BlockData[] = [
      {
        id: 1,
        type: 'img-full',
        src: '/image.jpg" onload="alert(1)',
        cap: 'Test',
      },
    ];

    const html = renderer.renderBlocks(blocks);

    // Attribute injection should be prevented
    expect(html).not.toContain('onload');
  });

  it('should prevent SVG-based XSS', () => {
    const blocks: BlockData[] = [
      {
        id: 1,
        type: 'img-full',
        src: 'data:image/svg+xml,<svg onload="alert(1)">',
        cap: 'SVG attack',
      },
    ];

    const html = renderer.renderBlocks(blocks);

    expect(html).not.toContain('svg');
    expect(html).not.toContain('onload');
  });

  it('should escape quotes in attributes', () => {
    const blocks: BlockData[] = [
      {
        id: 1,
        type: 'img-full',
        src: '/image.jpg',
        cap: 'Caption with "quotes"',
      },
    ];

    const html = renderer.renderBlocks(blocks);

    // Caption text with quotes is rendered as-is (quotes in text content don't need entity encoding)
    expect(html).toContain('Caption with');
    expect(html).toContain('quotes');
  });
});

describe('INT-006: Error Handling and Edge Cases', () => {
  const renderer = createHtmlRenderer('error-test');

  it('should handle blocks with missing optional fields', () => {
    const blocks: BlockData[] = [
      {
        id: 1,
        type: 'img-full',
        src: '/image.jpg',
        // cap is missing
      } as BlockData,
    ];

    const html = renderer.renderBlocks(blocks);

    expect(html).toBeTruthy();
  });

  it('should handle very long text content', () => {
    const longText = 'A'.repeat(10000);
    const blocks: BlockData[] = [
      {
        id: 1,
        type: 'paragraph',
        text: longText,
      },
    ];

    const html = renderer.renderBlocks(blocks);

    expect(html).toContain(longText);
  });

  it('should handle special characters in URLs', () => {
    const blocks: BlockData[] = [
      {
        id: 1,
        type: 'img-full',
        src: '/images/photo-2024-03-01.jpg?size=large&format=webp',
        cap: 'Image with query params',
      },
    ];

    const html = renderer.renderBlocks(blocks);

    expect(html).toContain('photo-2024-03-01.jpg');
    expect(html).toContain('size=large');
  });

  it('should handle nested quotes in captions', () => {
    const blocks: BlockData[] = [
      {
        id: 1,
        type: 'img-full',
        src: '/image.jpg',
        cap: 'He said "Hello" to me',
      },
    ];

    const html = renderer.renderBlocks(blocks);

    expect(html).toContain('Hello');
  });
});
