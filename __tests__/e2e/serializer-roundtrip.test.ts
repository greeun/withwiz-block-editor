import { createSerializer } from '../../src/core/serializer';
import { createHtmlRenderer } from '../../src/core/html-renderer';
import { BUILT_IN_BLOCKS, createEmptyBlock } from '../../src/blocks/built-in';
import type { BlockData } from '../../src/types';

describe('E2E - 직렬화 라운드트립 (BlockData → HTML → BlockData → 렌더링)', () => {
  const marker = 'BK_DATA_V1';
  const serializer = createSerializer<BlockData[]>(marker);
  const renderer = createHtmlRenderer('test');

  describe('단순 블록 라운드트립', () => {
    it('단락 블록: 직렬화 → 역직렬화 → 렌더링 검증', () => {
      const originalBlocks: BlockData[] = [
        { type: 'paragraph', id: 1, text: '이것은 단락입니다.' }
      ];

      // 1단계: 직렬화 (JSON을 base64로 인코딩하여 HTML 주석에 저장)
      const serialized = serializer.serialize(originalBlocks);
      expect(serialized).toContain(`<!-- ${marker}`);

      // 2단계: 역직렬화 (HTML 주석에서 JSON을 추출하여 원본 복원)
      const deserialized = serializer.deserialize(serialized);
      expect(deserialized).toEqual(originalBlocks);

      // 3단계: 렌더링 (역직렬화된 데이터가 원본과 동일한 HTML을 생성)
      const originalHtml = originalBlocks.map(b => renderer.renderBlock(b)).join('');
      const restoredHtml = deserialized!.map(b => renderer.renderBlock(b)).join('');
      expect(restoredHtml).toBe(originalHtml);
      expect(restoredHtml).toContain('<p');
      expect(restoredHtml).toContain('이것은 단락입니다');
    });

    it('리드 블록: 라운드트립 검증', () => {
      const originalBlocks: BlockData[] = [
        { type: 'lead', id: 1, text: 'Lead text\nWith newline' }
      ];

      const serialized = serializer.serialize(originalBlocks);
      const deserialized = serializer.deserialize(serialized);
      expect(deserialized).toEqual(originalBlocks);

      const originalHtml = originalBlocks.map(b => renderer.renderBlock(b)).join('');
      const restoredHtml = deserialized!.map(b => renderer.renderBlock(b)).join('');
      expect(restoredHtml).toBe(originalHtml);
      expect(restoredHtml).toContain('test-lead');
      expect(restoredHtml).toContain('<br>');
    });

    it('이미지 블록: 라운드트립 검증', () => {
      const originalBlocks: BlockData[] = [
        {
          type: 'img-full',
          id: 1,
          src: 'https://example.com/image.jpg',
          cap: '이미지 캡션'
        }
      ];

      const serialized = serializer.serialize(originalBlocks);
      const deserialized = serializer.deserialize(serialized);
      expect(deserialized).toEqual(originalBlocks);

      const originalHtml = originalBlocks.map(b => renderer.renderBlock(b)).join('');
      const restoredHtml = deserialized!.map(b => renderer.renderBlock(b)).join('');
      expect(restoredHtml).toBe(originalHtml);
      expect(restoredHtml).toContain('https://example.com/image.jpg');
      expect(restoredHtml).toContain('이미지 캡션');
    });
  });

  describe('복합 블록 라운드트립', () => {
    it('여러 블록 타입 혼합: 라운드트립 검증', () => {
      const originalBlocks: BlockData[] = [
        { type: 'paragraph', id: 1, text: '첫 번째 문단' },
        { type: 'divider', id: 2 },
        { type: 'lead', id: 3, text: '리드 텍스트' },
        {
          type: 'img-full',
          id: 4,
          src: 'https://example.com/pic.jpg',
          cap: '사진'
        }
      ];

      const serialized = serializer.serialize(originalBlocks);
      const deserialized = serializer.deserialize(serialized);
      expect(deserialized).toEqual(originalBlocks);

      // 렌더링된 HTML 검증
      const originalHtml = originalBlocks.map(b => renderer.renderBlock(b)).join('');
      const restoredHtml = deserialized!.map(b => renderer.renderBlock(b)).join('');
      expect(restoredHtml).toBe(originalHtml);
      expect(restoredHtml).toContain('첫 번째 문단');
      expect(restoredHtml).toContain('리드 텍스트');
      expect(restoredHtml).toContain('사진');
    });

    it('인용문 블록: 라운드트립 검증', () => {
      const originalBlocks: BlockData[] = [
        {
          type: 'quote',
          id: 1,
          text: '이것은 인용문입니다.',
          attr: '저자 이름'
        }
      ];

      const serialized = serializer.serialize(originalBlocks);
      const deserialized = serializer.deserialize(serialized);
      expect(deserialized).toEqual(originalBlocks);

      const originalHtml = originalBlocks.map(b => renderer.renderBlock(b)).join('');
      const restoredHtml = deserialized!.map(b => renderer.renderBlock(b)).join('');
      expect(restoredHtml).toBe(originalHtml);
      expect(restoredHtml).toContain('이것은 인용문입니다');
      expect(restoredHtml).toContain('저자 이름');
    });

    it('통계 블록: 라운드트립 검증', () => {
      const originalBlocks: BlockData[] = [
        {
          type: 'stats',
          id: 1,
          items: [
            { num: '100', label: '회' },
            { num: '2,000', label: '명' }
          ]
        }
      ];

      const serialized = serializer.serialize(originalBlocks);
      const deserialized = serializer.deserialize(serialized);
      expect(deserialized).toEqual(originalBlocks);

      const originalHtml = originalBlocks.map(b => renderer.renderBlock(b)).join('');
      const restoredHtml = deserialized!.map(b => renderer.renderBlock(b)).join('');
      expect(restoredHtml).toBe(originalHtml);
      expect(restoredHtml).toContain('100');
      expect(restoredHtml).toContain('회');
    });

    it('CTA 블록: 라운드트립 검증', () => {
      const originalBlocks: BlockData[] = [
        {
          type: 'cta',
          id: 1,
          text: '자세히 보기',
          label: '링크',
          url: 'https://example.com/page'
        }
      ];

      const serialized = serializer.serialize(originalBlocks);
      const deserialized = serializer.deserialize(serialized);
      expect(deserialized).toEqual(originalBlocks);

      const originalHtml = originalBlocks.map(b => renderer.renderBlock(b)).join('');
      const restoredHtml = deserialized!.map(b => renderer.renderBlock(b)).join('');
      expect(restoredHtml).toBe(originalHtml);
      expect(restoredHtml).toContain('자세히 보기');
      expect(restoredHtml).toContain('https://example.com/page');
    });

    it('타임라인 블록: 라운드트립 검증', () => {
      const originalBlocks: BlockData[] = [
        {
          type: 'timeline',
          id: 1,
          items: [
            { date: '2024.01', title: '첫 번째', desc: '시작' },
            { date: '2024.06', title: '두 번째', desc: '중간' }
          ]
        }
      ];

      const serialized = serializer.serialize(originalBlocks);
      const deserialized = serializer.deserialize(serialized);
      expect(deserialized).toEqual(originalBlocks);

      const originalHtml = originalBlocks.map(b => renderer.renderBlock(b)).join('');
      const restoredHtml = deserialized!.map(b => renderer.renderBlock(b)).join('');
      expect(restoredHtml).toBe(originalHtml);
      expect(restoredHtml).toContain('첫 번째');
      expect(restoredHtml).toContain('2024.06');
    });
  });

  describe('특수문자 및 인코딩 라운드트립', () => {
    it('HTML 특수문자 포함 데이터: 라운드트립 검증', () => {
      const originalBlocks: BlockData[] = [
        { type: 'paragraph', id: 1, text: '<script>alert("xss")</script>' }
      ];

      const serialized = serializer.serialize(originalBlocks);
      const deserialized = serializer.deserialize(serialized);
      expect(deserialized).toEqual(originalBlocks);

      // 렌더링된 HTML에서는 이스케이프되어야 함
      const restoredHtml = deserialized!.map(b => renderer.renderBlock(b)).join('');
      expect(restoredHtml).toContain('&lt;');
      expect(restoredHtml).toContain('&gt;');
      expect(restoredHtml).not.toContain('<script>');
    });

    it('한글 및 특수문자: 라운드트립 검증', () => {
      const originalBlocks: BlockData[] = [
        { type: 'paragraph', id: 1, text: '한글 테스트: 가나다라마 (한글) "따옴표"' }
      ];

      const serialized = serializer.serialize(originalBlocks);
      const deserialized = serializer.deserialize(serialized);
      expect(deserialized).toEqual(originalBlocks);

      const originalHtml = originalBlocks.map(b => renderer.renderBlock(b)).join('');
      const restoredHtml = deserialized!.map(b => renderer.renderBlock(b)).join('');
      expect(restoredHtml).toBe(originalHtml);
      expect(restoredHtml).toContain('한글 테스트');
    });

    it('이모지 및 유니코드: 라운드트립 검증', () => {
      const originalBlocks: BlockData[] = [
        { type: 'paragraph', id: 1, text: '🎉 축하합니다! 🎊 이모지 테스트 ✨' }
      ];

      const serialized = serializer.serialize(originalBlocks);
      const deserialized = serializer.deserialize(serialized);
      expect(deserialized).toEqual(originalBlocks);

      const originalHtml = originalBlocks.map(b => renderer.renderBlock(b)).join('');
      const restoredHtml = deserialized!.map(b => renderer.renderBlock(b)).join('');
      expect(restoredHtml).toBe(originalHtml);
      expect(restoredHtml).toContain('축하합니다');
    });

    it('줄바꿈 포함: 라운드트립 검증', () => {
      const originalBlocks: BlockData[] = [
        { type: 'paragraph', id: 1, text: '첫 줄\n둘째 줄\n셋째 줄' }
      ];

      const serialized = serializer.serialize(originalBlocks);
      const deserialized = serializer.deserialize(serialized);
      expect(deserialized).toEqual(originalBlocks);

      const originalHtml = originalBlocks.map(b => renderer.renderBlock(b)).join('');
      const restoredHtml = deserialized!.map(b => renderer.renderBlock(b)).join('');
      expect(restoredHtml).toBe(originalHtml);
      expect(restoredHtml).toContain('<br>');
    });
  });

  describe('HTML 마킹 포함 라운드트립', () => {
    it('마커 포함 HTML: 직렬화된 데이터와 실제 콘텐츠 함께 존재', () => {
      const originalBlocks: BlockData[] = [
        { type: 'paragraph', id: 1, text: '콘텐츠' }
      ];

      // BlockData가 JSON 형태로 마커와 함께 저장되는 시나리오
      const serialized = serializer.serialize(originalBlocks);
      
      // 마커가 포함되어 있음
      expect(serialized).toContain(`<!-- ${marker}`);

      // 역직렬화
      const deserialized = serializer.deserialize(serialized);
      expect(deserialized).toEqual(originalBlocks);
    });

    it('복잡한 HTML 구조 내에 마커 포함: 라운드트립 검증', () => {
      const originalBlocks: BlockData[] = [
        { type: 'paragraph', id: 1, text: '첫 번째' },
        { type: 'paragraph', id: 2, text: '두 번째' }
      ];

      const serialized = serializer.serialize(originalBlocks);
      
      // 실제 콘텐츠가 앞에 있고 마커가 뒤에 있는 구조
      const html = `<div class="content">${serialized}</div>`;
      
      const deserialized = serializer.deserialize(html);
      expect(deserialized).toEqual(originalBlocks);
    });
  });

  describe('대량 데이터 라운드트립', () => {
    it('50개 블록 라운드트립 검증', () => {
      const originalBlocks: BlockData[] = Array.from({ length: 50 }, (_, i) => ({
        type: 'paragraph' as const,
        id: i + 1,
        text: `블록 ${i + 1}: ${i * 2} 설명입니다.`
      }));

      const serialized = serializer.serialize(originalBlocks);
      const deserialized = serializer.deserialize(serialized);
      
      expect(deserialized).toEqual(originalBlocks);
      expect(deserialized?.length).toBe(50);

      // 모든 블록이 올바르게 렌더링됨
      const htmlParts = deserialized!.map(b => renderer.renderBlock(b));
      expect(htmlParts.length).toBe(50);
      expect(htmlParts[0]).toContain('블록 1');
      expect(htmlParts[49]).toContain('블록 50');
    });

    it('다양한 블록 타입 혼합 대량 데이터: 라운드트립 검증', () => {
      const blockTypes: Array<BlockData['type']> = [
        'paragraph',
        'lead',
        'divider',
        'spacer',
        'subheading'
      ];

      const originalBlocks: BlockData[] = Array.from({ length: 25 }, (_, i) => {
        const blockType = blockTypes[i % blockTypes.length];
        const baseBlock: any = { type: blockType, id: i + 1 };

        if (blockType === 'paragraph' || blockType === 'lead') {
          baseBlock.text = `텍스트 ${i + 1}`;
        } else if (blockType === 'spacer') {
          baseBlock.size = 'small';
        } else if (blockType === 'subheading') {
          baseBlock.text = `제목 ${i + 1}`;
        }

        return baseBlock;
      });

      const serialized = serializer.serialize(originalBlocks);
      const deserialized = serializer.deserialize(serialized);
      
      expect(deserialized).toEqual(originalBlocks);
      expect(deserialized?.length).toBe(25);

      // 각 블록이 올바르게 렌더링됨
      deserialized!.forEach((block, index) => {
        const html = renderer.renderBlock(block);
        expect(html).toBeTruthy();
      });
    });
  });

  describe('에러 처리 및 엣지 케이스', () => {
    it('빈 블록 배열: 라운드트립 검증', () => {
      const originalBlocks: BlockData[] = [];

      const serialized = serializer.serialize(originalBlocks);
      const deserialized = serializer.deserialize(serialized);
      
      expect(deserialized).toEqual(originalBlocks);
      expect(deserialized?.length).toBe(0);
    });

    it('마커 없는 HTML: 역직렬화 실패', () => {
      const html = '<div><p>일반 HTML</p></div>';
      const deserialized = serializer.deserialize(html);
      
      expect(deserialized).toBeNull();
    });

    it('손상된 데이터: 역직렬화 실패', () => {
      const html = `<!-- ${marker}INVALID_BASE64!!! -->`;
      const deserialized = serializer.deserialize(html);
      
      expect(deserialized).toBeNull();
    });

    it('필드 누락된 블록도 라운드트립 가능', () => {
      // 일부 필드가 없는 불완전한 블록도 처리
      const originalBlocks: BlockData[] = [
        { type: 'paragraph', id: 1 } as any // text 필드 없음
      ];

      const serialized = serializer.serialize(originalBlocks);
      const deserialized = serializer.deserialize(serialized);
      
      expect(deserialized).toEqual(originalBlocks);
    });
  });
});
