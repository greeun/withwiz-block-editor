import { describe, it, expect } from 'vitest';
import { createHtmlRenderer } from '../../src/core/html-renderer';
import type { BlockData } from '../../src/types';

describe('PERF-001: Rendering Performance - Block Rendering', () => {
  const renderer = createHtmlRenderer('perf-test');

  describe('Large Block Rendering', () => {
    it('should render 100 blocks within 100ms', () => {
      const blocks: BlockData[] = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        type: 'paragraph',
        text: `Paragraph ${i}: This is test content for performance testing.`,
      }));

      const startTime = performance.now();
      const html = renderer.renderBlocks(blocks);
      const endTime = performance.now();

      const duration = endTime - startTime;

      expect(html).toBeTruthy();
      expect(duration).toBeLessThan(100);
    });

    it('should render 500 blocks within 300ms', () => {
      const blocks: BlockData[] = Array.from({ length: 500 }, (_, i) => ({
        id: i,
        type: 'paragraph',
        text: `Paragraph ${i}: Content for performance testing.`,
      }));

      const startTime = performance.now();
      const html = renderer.renderBlocks(blocks);
      const endTime = performance.now();

      const duration = endTime - startTime;

      expect(html).toBeTruthy();
      expect(duration).toBeLessThan(300);
    });

    it('should render 1000 blocks within 500ms', () => {
      const blocks: BlockData[] = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        type: 'paragraph',
        text: `Paragraph ${i}`,
      }));

      const startTime = performance.now();
      const html = renderer.renderBlocks(blocks);
      const endTime = performance.now();

      const duration = endTime - startTime;

      expect(html).toBeTruthy();
      expect(duration).toBeLessThan(500);
    });
  });

  describe('Complex Block Types Rendering', () => {
    it('should render mixed block types efficiently', () => {
      const blocks: BlockData[] = [
        ...Array.from({ length: 50 }, (_, i) => ({
          id: i * 3,
          type: 'paragraph' as const,
          text: `Paragraph ${i}`,
        })),
        ...Array.from({ length: 50 }, (_, i) => ({
          id: i * 3 + 1,
          type: 'img-full' as const,
          src: `/images/${i}.jpg`,
          cap: `Image ${i} caption`,
        })),
        ...Array.from({ length: 50 }, (_, i) => ({
          id: i * 3 + 2,
          type: 'quote' as const,
          text: `Quote ${i} text`,
          attr: `- Author ${i}`,
        })),
      ];

      const startTime = performance.now();
      const html = renderer.renderBlocks(blocks);
      const endTime = performance.now();

      const duration = endTime - startTime;

      expect(html).toBeTruthy();
      expect(duration).toBeLessThan(150);
    });
  });

  describe('Output Size Validation', () => {
    it('should keep HTML output reasonable for 100 blocks', () => {
      const blocks: BlockData[] = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        type: 'paragraph',
        text: `Block ${i}`,
      }));

      const html = renderer.renderBlocks(blocks);

      // Rough estimate: ~100 bytes per block for basic paragraph
      expect(html.length).toBeLessThan(100 * 100 * 2); // Allow 2x overhead
    });

    it('should not generate excessive whitespace', () => {
      const blocks: BlockData[] = Array.from({ length: 10 }, (_, i) => ({
        id: i,
        type: 'paragraph',
        text: `Block ${i}`,
      }));

      const html = renderer.renderBlocks(blocks);

      // Count consecutive newlines (more than 1 is excessive)
      const excessiveNewlines = (html.match(/\n\n+/g) || []).length;

      expect(excessiveNewlines).toBeLessThan(10);
    });
  });

  describe('Memory Efficiency', () => {
    it('should handle repeated rendering without memory growth', () => {
      const blocks: BlockData[] = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        type: 'paragraph',
        text: `Block ${i}`,
      }));

      const htmls = [];
      const startMem = (performance as any).memory?.usedJSHeapSize || 0;

      // Render multiple times
      for (let i = 0; i < 10; i++) {
        htmls.push(renderer.renderBlocks(blocks));
      }

      const endMem = (performance as any).memory?.usedJSHeapSize || 0;

      // All renders should succeed
      expect(htmls).toHaveLength(10);
      expect(htmls[0]).toBeTruthy();

      // Memory growth should be reasonable (if we can measure it)
      if (startMem && endMem) {
        const memGrowth = endMem - startMem;
        expect(memGrowth).toBeLessThan(5 * 1024 * 1024); // Less than 5MB growth
      }
    });
  });
});
