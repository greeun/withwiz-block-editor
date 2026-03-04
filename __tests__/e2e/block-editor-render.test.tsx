import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createHtmlRenderer } from '../../src/core/html-renderer';
import type { BlockData } from '../../src/types';

// HTML 렌더링 결과를 DOM에 마운트하는 헬퍼 컴포넌트
function HtmlRenderer({ html }: { html: string }) {
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

describe('BlockRenderer E2E - HTML 렌더링 결과 DOM 검증', () => {
  const renderer = createHtmlRenderer('test');

  describe('단일 블록 렌더링', () => {
    it('단락 블록이 <p> 태그로 렌더링됨', () => {
      const block: BlockData = { type: 'paragraph', id: 1, text: '안녕하세요' };
      const html = renderer.renderBlock(block);
      const { container } = render(<HtmlRenderer html={html} />);
      const paragraph = container.querySelector('p.test-p');
      expect(paragraph).toBeInTheDocument();
      expect(paragraph?.textContent).toBe('안녕하세요');
    });

    it('리드 단락이 <div.test-lead>로 렌더링됨', () => {
      const block: BlockData = { type: 'lead', id: 1, text: '도입부 텍스트' };
      const html = renderer.renderBlock(block);
      const { container } = render(<HtmlRenderer html={html} />);
      const lead = container.querySelector('.test-lead');
      expect(lead).toBeInTheDocument();
      expect(lead?.textContent).toBe('도입부 텍스트');
    });

    it('이미지 블록이 <img> 태그 포함', () => {
      const block: BlockData = { type: 'img-full', id: 1, src: 'https://example.com/image.jpg', cap: '' };
      const html = renderer.renderBlock(block);
      const { container } = render(<HtmlRenderer html={html} />);
      const img = container.querySelector('img');
      expect(img).toBeInTheDocument();
      expect(img?.getAttribute('src')).toBe('https://example.com/image.jpg');
    });

    it('구분선이 <div.test-hr>로 렌더링됨', () => {
      const block: BlockData = { type: 'divider', id: 1 };
      const html = renderer.renderBlock(block);
      const { container } = render(<HtmlRenderer html={html} />);
      const divider = container.querySelector('.test-hr');
      expect(divider).toBeInTheDocument();
    });
  });

  describe('다중 블록 렌더링 및 순서', () => {
    it('여러 블록이 순서대로 렌더링됨', () => {
      const blocks: BlockData[] = [
        { type: 'paragraph', id: 1, text: 'First' },
        { type: 'paragraph', id: 2, text: 'Second' },
        { type: 'paragraph', id: 3, text: 'Third' }
      ];
      const html = renderer.renderBlocks(blocks);
      const { container } = render(<HtmlRenderer html={html} />);
      const paragraphs = container.querySelectorAll('p');
      expect(paragraphs).toHaveLength(3);
      expect(paragraphs[0].textContent).toBe('First');
      expect(paragraphs[1].textContent).toBe('Second');
      expect(paragraphs[2].textContent).toBe('Third');
    });

    it('DOM에서 블록 순서 유지', () => {
      const blocks: BlockData[] = [
        { type: 'lead', id: 1, text: '첫 번째' },
        { type: 'divider', id: 2 },
        { type: 'paragraph', id: 3, text: '세 번째' }
      ];
      const html = renderer.renderBlocks(blocks);
      const { container } = render(<HtmlRenderer html={html} />);
      const children = Array.from(container.querySelectorAll('*')).slice(0, 3);
      expect(children[0].textContent).toContain('첫 번째');
    });
  });

  describe('특수 문자 이스케이핑', () => {
    it('HTML 특수문자가 이스케이핑됨', () => {
      const block: BlockData = { type: 'paragraph', id: 1, text: '<script>alert(1)</script>' };
      const html = renderer.renderBlock(block);
      expect(html).toContain('&lt;script&gt;');
      expect(html).not.toContain('<script>');  // 실제 HTML 태그가 아님
    });

    it('& 문자 이스케이핑', () => {
      const block: BlockData = { type: 'paragraph', id: 1, text: 'Tom & Jerry' };
      const html = renderer.renderBlock(block);
      expect(html).toContain('&amp;');
    });

    it('따옴표 포함 텍스트 렌더링', () => {
      const block: BlockData = { type: 'quote', id: 1, text: '문장은 "따옴표"를 포함', attr: '' };
      const html = renderer.renderBlock(block);
      const { container } = render(<HtmlRenderer html={html} />);
      expect(container.textContent).toContain('따옴표');
    });
  });

  describe('XSS 공격 방지 검증', () => {
    it('javascript: URL 차단 - 이미지 src', () => {
      const block: BlockData = { type: 'img-full', id: 1, src: 'javascript:alert(1)', cap: '' };
      const html = renderer.renderBlock(block);
      expect(html).not.toContain('javascript:');
    });

    it('data: URL 차단 - 이미지 src', () => {
      const block: BlockData = { type: 'img-full', id: 1, src: 'data:text/html,<script>alert(1)</script>', cap: '' };
      const html = renderer.renderBlock(block);
      expect(html).not.toContain('data:');
    });

    it('CTA 버튼의 링크도 검증됨', () => {
      const block: BlockData = { type: 'cta', id: 1, text: 'Click', label: 'Button', url: 'javascript:alert(1)' };
      const html = renderer.renderBlock(block);
      expect(html).not.toContain('javascript:');
    });

    it('외부 링크는 target="_blank" 설정', () => {
      const block: BlockData = {
        type: 'press-list',
        id: 1,
        items: [
          { src: '매체', date: '', title: '기사', ex: '', link: 'https://example.com' }
        ]
      };
      const html = renderer.renderBlock(block);
      expect(html).toContain('target="_blank"');
      expect(html).toContain('rel="noopener noreferrer"');
    });
  });

  describe('이미지 렌더링', () => {
    it('여러 이미지가 모두 렌더링됨', () => {
      const block: BlockData = {
        type: 'img-pair',
        id: 1,
        src1: 'https://example.com/1.jpg',
        src2: 'https://example.com/2.jpg',
        cap: ''
      };
      const html = renderer.renderBlock(block);
      const { container } = render(<HtmlRenderer html={html} />);
      const images = container.querySelectorAll('img');
      expect(images).toHaveLength(2);
      expect(images[0].getAttribute('src')).toContain('1.jpg');
      expect(images[1].getAttribute('src')).toContain('2.jpg');
    });

    it('이미지 캡션이 렌더링됨', () => {
      const block: BlockData = { type: 'img-full', id: 1, src: 'https://example.com/img.jpg', cap: '사진 설명' };
      const html = renderer.renderBlock(block);
      const { container } = render(<HtmlRenderer html={html} />);
      expect(container.querySelector('.test-cap')?.textContent).toBe('사진 설명');
    });

    it('갤러리 블록이 3개 이미지 렌더링', () => {
      const block: BlockData = {
        type: 'gallery',
        id: 1,
        src1: 'https://example.com/1.jpg',
        src2: 'https://example.com/2.jpg',
        src3: 'https://example.com/3.jpg',
        cap: ''
      };
      const html = renderer.renderBlock(block);
      const { container } = render(<HtmlRenderer html={html} />);
      const images = container.querySelectorAll('img');
      expect(images).toHaveLength(3);
    });
  });

  describe('빈 블록 처리', () => {
    it('텍스트가 없는 단락은 렌더링 안됨', () => {
      const block: BlockData = { type: 'paragraph', id: 1, text: '' };
      const html = renderer.renderBlock(block);
      expect(html).toBe('');
    });

    it('빈 배열은 빈 문자열 반환', () => {
      const blocks: BlockData[] = [];
      const html = renderer.renderBlocks(blocks);
      expect(html).toBe('');
    });
  });

  describe('복합 블록 렌더링', () => {
    it('Quote 블록이 텍스트와 귀인을 모두 포함', () => {
      const block: BlockData = { type: 'quote', id: 1, text: '인용문 내용입니다', attr: '— 저자' };
      const html = renderer.renderBlock(block);
      const { container } = render(<HtmlRenderer html={html} />);
      expect(container.textContent).toContain('인용문 내용입니다');
      expect(container.textContent).toContain('저자');
    });

    it('Stats 블록이 숫자와 레이블 표시', () => {
      const block: BlockData = {
        type: 'stats',
        id: 1,
        items: [
          { num: '100', label: '회' },
          { num: '1,000', label: '명' }
        ]
      };
      const html = renderer.renderBlock(block);
      const { container } = render(<HtmlRenderer html={html} />);
      expect(container.textContent).toContain('100');
      expect(container.textContent).toContain('회');
      expect(container.textContent).toContain('1,000');
      expect(container.textContent).toContain('명');
    });

    it('Callout 블록이 제목과 본문 표시', () => {
      const block: BlockData = { type: 'callout', id: 1, title: '중요', text: '주의 사항입니다' };
      const html = renderer.renderBlock(block);
      const { container } = render(<HtmlRenderer html={html} />);
      expect(container.textContent).toContain('중요');
      expect(container.textContent).toContain('주의 사항입니다');
    });

    it('CTA 블록이 텍스트와 버튼 렌더링', () => {
      const block: BlockData = {
        type: 'cta',
        id: 1,
        text: '지금 확인하세요',
        label: '더보기',
        url: 'https://example.com'
      };
      const html = renderer.renderBlock(block);
      const { container } = render(<HtmlRenderer html={html} />);
      expect(container.textContent).toContain('지금 확인하세요');
      expect(container.textContent).toContain('더보기');
    });
  });

  describe('HTML 특수문자 렌더링', () => {
    it('DOM textContent로 검증 시 올바른 텍스트', () => {
      const block: BlockData = { type: 'paragraph', id: 1, text: '1 < 2 & 3 > 2' };
      const html = renderer.renderBlock(block);
      const { container } = render(<HtmlRenderer html={html} />);
      expect(container.textContent).toContain('1 < 2 & 3 > 2');
    });

    it('원문 보기 텍스트가 정확히 렌더링', () => {
      const block: BlockData = {
        type: 'press-list',
        id: 1,
        items: [
          { src: '언론', date: '', title: '제목', ex: '', link: 'https://example.com' }
        ]
      };
      const html = renderer.renderBlock(block);
      const { container } = render(<HtmlRenderer html={html} />);
      expect(container.textContent).toContain('원문 보기');
    });
  });

  describe('CSS 프리픽스 적용', () => {
    it('커스텀 프리픽스가 모든 클래스에 적용됨', () => {
      const block1: BlockData = { type: 'paragraph', id: 1, text: 'Test' };
      const block2: BlockData = { type: 'divider', id: 2 };
      const renderer2 = createHtmlRenderer('custom');
      const html1 = renderer2.renderBlock(block1);
      const html2 = renderer2.renderBlock(block2);
      
      expect(html1).toContain('custom-p');
      expect(html2).toContain('custom-hr');
    });
  });

  describe('줄바꿈 처리', () => {
    it('텍스트의 줄바꿈이 <br>로 렌더링됨', () => {
      const block: BlockData = { type: 'paragraph', id: 1, text: '첫 줄\n둘째 줄\n셋째 줄' };
      const html = renderer.renderBlock(block);
      const { container } = render(<HtmlRenderer html={html} />);
      const brs = container.querySelectorAll('br');
      expect(brs.length).toBeGreaterThanOrEqual(2);
    });

    it('Lead 블록에서 줄바꿈 처리', () => {
      const block: BlockData = { type: 'lead', id: 1, text: 'Line 1\nLine 2' };
      const html = renderer.renderBlock(block);
      const { container } = render(<HtmlRenderer html={html} />);
      expect(container.innerHTML).toContain('<br>');
    });
  });

  describe('렌더링 래퍼 함수', () => {
    it('renderBlocksWrapped에서 test-body 클래스 생성', () => {
      const blocks: BlockData[] = [
        { type: 'paragraph', id: 1, text: 'test' }
      ];
      const html = renderer.renderBlocksWrapped(blocks);
      const { container } = render(<HtmlRenderer html={html} />);
      expect(container.querySelector('.test-body')).toBeInTheDocument();
    });

    it('모든 블록은 test-body 내에 포함됨', () => {
      const blocks: BlockData[] = [
        { type: 'paragraph', id: 1, text: 'text1' },
        { type: 'divider', id: 2 }
      ];
      const html = renderer.renderBlocksWrapped(blocks);
      const { container } = render(<HtmlRenderer html={html} />);
      const body = container.querySelector('.test-body');
      const paragraph = body?.querySelector('p');
      const divider = body?.querySelector('.test-hr');
      expect(paragraph).toBeInTheDocument();
      expect(divider).toBeInTheDocument();
    });
  });

  describe('catClass 옵션', () => {
    it('catClass가 infobox에 추가됨', () => {
      const renderer2 = createHtmlRenderer('test', 'onstage');
      const block: BlockData = { type: 'infobox', id: 1, label: '정보', items: [] };
      const html = renderer2.renderBlock(block);
      expect(html).toContain('onstage');
    });

    it('catClass가 cta에도 추가됨', () => {
      const renderer2 = createHtmlRenderer('test', 'featured');
      const block: BlockData = { type: 'cta', id: 1, text: '텍스트', label: '버튼', url: '#' };
      const html = renderer2.renderBlock(block);
      expect(html).toContain('featured');
    });
  });
});
