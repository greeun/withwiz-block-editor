import { describe, it, expect } from 'vitest';
import { BUILT_IN_BLOCKS, createEmptyBlock, getBlockDef } from '../../../src/blocks/built-in';
import type { BlockData } from '../../../src/types';

describe('built-in 블록 정의 및 팩토리', () => {
  describe('BUILT_IN_BLOCKS - 22개 내장 블록 정의', () => {
    it('정확히 22개의 블록 타입 존재', () => {
      expect(BUILT_IN_BLOCKS).toHaveLength(22);
    });

    it('각 블록이 필수 필드를 가짐', () => {
      BUILT_IN_BLOCKS.forEach((block) => {
        expect(block).toHaveProperty('type');
        expect(block).toHaveProperty('label');
        expect(block).toHaveProperty('icon');
        expect(block).toHaveProperty('desc');
        expect(block).toHaveProperty('createEmpty');
      });
    });

    it('모든 type이 고유함', () => {
      const types = BUILT_IN_BLOCKS.map((b) => b.type);
      const uniqueTypes = new Set(types);
      expect(uniqueTypes.size).toBe(22);
    });

    it('모든 type이 문자열', () => {
      BUILT_IN_BLOCKS.forEach((block) => {
        expect(typeof block.type).toBe('string');
        expect(block.type.length).toBeGreaterThan(0);
      });
    });

    it('모든 label이 의미있는 문자열', () => {
      BUILT_IN_BLOCKS.forEach((block) => {
        expect(typeof block.label).toBe('string');
        expect(block.label.length).toBeGreaterThan(0);
      });
    });

    it('모든 icon이 존재', () => {
      BUILT_IN_BLOCKS.forEach((block) => {
        expect(block.icon).toBeDefined();
      });
    });

    it('모든 desc가 한글 설명', () => {
      BUILT_IN_BLOCKS.forEach((block) => {
        expect(typeof block.desc).toBe('string');
        expect(block.desc.length).toBeGreaterThan(0);
      });
    });

    it('모든 createEmpty가 함수', () => {
      BUILT_IN_BLOCKS.forEach((block) => {
        expect(typeof block.createEmpty).toBe('function');
      });
    });

    describe('22개 블록 타입 검증', () => {
      const expectedTypes = [
        'lead', 'paragraph', 'subheading', 'subheading-label',
        'divider', 'spacer',
        'img-full', 'img-inline', 'img-pair', 'gallery', 'img-text',
        'quote', 'quote-large',
        'stats', 'infobox', 'callout',
        'numcards', 'qa',
        'press-list', 'timeline',
        'video', 'cta'
      ];

      it('모든 필수 블록 타입이 포함됨', () => {
        const actualTypes = BUILT_IN_BLOCKS.map((b) => b.type);
        expectedTypes.forEach((type) => {
          expect(actualTypes).toContain(type);
        });
      });
    });
  });

  describe('getBlockDef() - 타입으로 블록 정의 조회', () => {
    it('존재하는 타입은 BlockDef 반환', () => {
      const def = getBlockDef('paragraph');
      expect(def).toBeDefined();
      expect(def?.type).toBe('paragraph');
      expect(def?.label).toBe('일반 단락');
    });

    it('모든 22개 타입을 조회 가능', () => {
      BUILT_IN_BLOCKS.forEach((expectedDef) => {
        const def = getBlockDef(expectedDef.type);
        expect(def).toEqual(expectedDef);
      });
    });

    it('존재하지 않는 타입은 undefined 반환', () => {
      const def = getBlockDef('non-existent-type');
      expect(def).toBeUndefined();
    });

    it('빈 문자열은 undefined 반환', () => {
      const def = getBlockDef('');
      expect(def).toBeUndefined();
    });

    it('대소문자 구분 (정확한 타입만 반환)', () => {
      const def1 = getBlockDef('Paragraph');
      const def2 = getBlockDef('PARAGRAPH');
      expect(def1).toBeUndefined();
      expect(def2).toBeUndefined();
    });

    it('하이픈 포함된 타입도 정확히 매칭', () => {
      const def = getBlockDef('subheading-label');
      expect(def).toBeDefined();
      expect(def?.type).toBe('subheading-label');

      const wrongDef = getBlockDef('subheading_label');
      expect(wrongDef).toBeUndefined();
    });
  });

  describe('createEmptyBlock() - 블록 팩토리 함수', () => {
    describe('기본 필드', () => {
      it('type과 id가 설정됨', () => {
        const block = createEmptyBlock('paragraph', 123);
        expect(block.type).toBe('paragraph');
        expect(block.id).toBe(123);
      });

      it('id는 숫자로 유지됨', () => {
        const block = createEmptyBlock('paragraph', 999);
        expect(typeof block.id).toBe('number');
        expect(block.id).toBe(999);
      });

      it('음수 id도 허용', () => {
        const block = createEmptyBlock('paragraph', -1);
        expect(block.id).toBe(-1);
      });

      it('0 id도 허용', () => {
        const block = createEmptyBlock('paragraph', 0);
        expect(block.id).toBe(0);
      });
    });

    describe('텍스트 블록', () => {
      it('lead: text 필드 초기화', () => {
        const block = createEmptyBlock('lead', 1);
        expect(block).toHaveProperty('text');
        expect(block.text).toBe('');
      });

      it('paragraph: text 필드 초기화', () => {
        const block = createEmptyBlock('paragraph', 1);
        expect(block).toHaveProperty('text');
        expect(block.text).toBe('');
      });

      it('subheading: text 필드 초기화', () => {
        const block = createEmptyBlock('subheading', 1);
        expect(block).toHaveProperty('text');
        expect(block.text).toBe('');
      });

      it('subheading-label: en, text 초기화', () => {
        const block = createEmptyBlock('subheading-label', 1);
        expect(block).toHaveProperty('en');
        expect(block).toHaveProperty('text');
        expect(block.en).toBe('');
        expect(block.text).toBe('');
      });
    });

    describe('레이아웃 블록', () => {
      it('divider: 추가 필드 없음', () => {
        const block = createEmptyBlock('divider', 1) as BlockData;
        expect(Object.keys(block)).toEqual(['type', 'id']);
      });

      it('spacer: size 필드 초기화 (medium 기본값)', () => {
        const block = createEmptyBlock('spacer', 1);
        expect(block).toHaveProperty('size');
        expect(block.size).toBe('medium');
      });
    });

    describe('이미지 블록', () => {
      it('img-full: src, cap 초기화', () => {
        const block = createEmptyBlock('img-full', 1);
        expect(block.src).toBe('');
        expect(block.cap).toBe('');
      });

      it('img-inline: src, cap, size 초기화', () => {
        const block = createEmptyBlock('img-inline', 1);
        expect(block.src).toBe('');
        expect(block.cap).toBe('');
        expect(block.size).toBe('full');
      });

      it('img-pair: src1, src2, cap 초기화', () => {
        const block = createEmptyBlock('img-pair', 1);
        expect(block.src1).toBe('');
        expect(block.src2).toBe('');
        expect(block.cap).toBe('');
      });

      it('gallery: src1, src2, src3, cap 초기화', () => {
        const block = createEmptyBlock('gallery', 1);
        expect(block.src1).toBe('');
        expect(block.src2).toBe('');
        expect(block.src3).toBe('');
        expect(block.cap).toBe('');
      });

      it('img-text: src, name, role, bio 초기화', () => {
        const block = createEmptyBlock('img-text', 1);
        expect(block.src).toBe('');
        expect(block.name).toBe('');
        expect(block.role).toBe('');
        expect(block.bio).toBe('');
      });
    });

    describe('인용 블록', () => {
      it('quote: text, attr 초기화', () => {
        const block = createEmptyBlock('quote', 1);
        expect(block.text).toBe('');
        expect(block.attr).toBe('');
      });

      it('quote-large: text, attr 초기화', () => {
        const block = createEmptyBlock('quote-large', 1);
        expect(block.text).toBe('');
        expect(block.attr).toBe('');
      });
    });

    describe('정보 블록', () => {
      it('stats: items 배열 3개 항목으로 초기화', () => {
        const block = createEmptyBlock('stats', 1);
        expect(Array.isArray(block.items)).toBe(true);
        expect(block.items?.length).toBe(3);
        block.items?.forEach((item) => {
          expect(item).toHaveProperty('num');
          expect(item).toHaveProperty('label');
          expect(item.num).toBe('');
          expect(item.label).toBe('');
        });
      });

      it('infobox: label과 items 초기화', () => {
        const block = createEmptyBlock('infobox', 1);
        expect(block.label).toBe('');
        expect(Array.isArray(block.items)).toBe(true);
        expect(block.items?.length).toBe(1);
        expect(block.items?.[0]).toHaveProperty('k');
        expect(block.items?.[0]).toHaveProperty('v');
      });

      it('callout: title, text 초기화', () => {
        const block = createEmptyBlock('callout', 1);
        expect(block.title).toBe('');
        expect(block.text).toBe('');
      });
    });

    describe('카드/리스트 블록', () => {
      it('numcards: items 배열 1개로 초기화', () => {
        const block = createEmptyBlock('numcards', 1);
        expect(Array.isArray(block.items)).toBe(true);
        expect(block.items?.length).toBe(1);
        expect(block.items?.[0]).toHaveProperty('title');
        expect(block.items?.[0]).toHaveProperty('desc');
      });

      it('qa: q, a 초기화', () => {
        const block = createEmptyBlock('qa', 1);
        expect(block.q).toBe('');
        expect(block.a).toBe('');
      });

      it('press-list: items 배열로 초기화', () => {
        const block = createEmptyBlock('press-list', 1);
        expect(Array.isArray(block.items)).toBe(true);
        expect(block.items?.length).toBe(1);
        expect(block.items?.[0]).toHaveProperty('src');
        expect(block.items?.[0]).toHaveProperty('date');
        expect(block.items?.[0]).toHaveProperty('title');
        expect(block.items?.[0]).toHaveProperty('ex');
        expect(block.items?.[0]).toHaveProperty('link');
      });

      it('timeline: items 배열로 초기화', () => {
        const block = createEmptyBlock('timeline', 1);
        expect(Array.isArray(block.items)).toBe(true);
        expect(block.items?.length).toBe(1);
        expect(block.items?.[0]).toHaveProperty('date');
        expect(block.items?.[0]).toHaveProperty('title');
        expect(block.items?.[0]).toHaveProperty('desc');
      });
    });

    describe('미디어 블록', () => {
      it('video: url, cap 초기화', () => {
        const block = createEmptyBlock('video', 1);
        expect(block.url).toBe('');
        expect(block.cap).toBe('');
      });

      it('cta: text, label, url 초기화', () => {
        const block = createEmptyBlock('cta', 1);
        expect(block.text).toBe('');
        expect(block.label).toBe('');
        expect(block.url).toBe('');
      });
    });

    describe('모든 22개 타입 생성 가능', () => {
      it('각 블록 타입마다 createEmptyBlock 실행 가능', () => {
        BUILT_IN_BLOCKS.forEach((blockDef, index) => {
          const block = createEmptyBlock(blockDef.type, index + 1);
          expect(block.type).toBe(blockDef.type);
          expect(block.id).toBe(index + 1);
        });
      });
    });

    describe('존재하지 않는 타입 처리', () => {
      it('미지정 타입은 type, id만 생성', () => {
        const block = createEmptyBlock('unknown-type', 1);
        expect(block.type).toBe('unknown-type');
        expect(block.id).toBe(1);
        // 다른 필드는 없음
        expect(Object.keys(block)).toEqual(['type', 'id']);
      });
    });
  });

  describe('createEmpty 팩토리 함수 (BlockDef.createEmpty)', () => {
    it('BUILT_IN_BLOCKS의 createEmpty 함수들도 정상 작동', () => {
      BUILT_IN_BLOCKS.forEach((blockDef) => {
        const block = blockDef.createEmpty(99);
        expect(block.type).toBe(blockDef.type);
        expect(block.id).toBe(99);
      });
    });

    it('getBlockDef로 가져온 블록의 createEmpty도 정상', () => {
      const def = getBlockDef('paragraph');
      const block = def?.createEmpty(42);
      expect(block?.type).toBe('paragraph');
      expect(block?.id).toBe(42);
    });
  });

  describe('동일성 검증', () => {
    it('같은 타입으로 생성한 블록들은 구조가 동일', () => {
      const block1 = createEmptyBlock('paragraph', 1);
      const block2 = createEmptyBlock('paragraph', 2);
      // type은 같지만 id는 다름
      expect(block1.type).toBe(block2.type);
      expect(block1.id).not.toBe(block2.id);
      // text도 모두 비어있음
      expect(block1.text).toBe(block2.text);
    });

    it('createEmptyBlock과 BlockDef.createEmpty는 같은 결과', () => {
      const def = getBlockDef('quote');
      const block1 = createEmptyBlock('quote', 100);
      const block2 = def?.createEmpty(100);
      expect(block1).toEqual(block2);
    });
  });
});
