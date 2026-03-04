import { describe, it, expect } from 'vitest';
import { createSerializer } from '../../../src/core/serializer';
import type { BlockData } from '../../../src/types';

describe('serializer - 블록 데이터 직렬화/역직렬화', () => {
  const marker = 'BK_DATA_V1';
  const serializer = createSerializer<BlockData[]>(marker);

  describe('serialize() - 블록 배열을 HTML 주석으로 직렬화', () => {
    it('단순 배열을 base64 인코딩된 주석으로 변환', () => {
      const data: BlockData[] = [{ type: 'paragraph', id: 1, text: 'Hello' }];
      const result = serializer.serialize(data);
      expect(result).toContain(`<!-- ${marker}`);
      expect(result).toContain(' -->');
      expect(result.startsWith('\n')).toBe(true);
    });

    it('빈 배열도 직렬화 가능', () => {
      const data: BlockData[] = [];
      const result = serializer.serialize(data);
      expect(result).toContain(`<!-- ${marker}`);
    });

    it('복잡한 중첩 객체 직렬화', () => {
      const data: BlockData[] = [
        {
          type: 'press-list',
          id: 1,
          items: [
            { src: '중앙일보', date: '2024.01.01', title: '제목', ex: '요약', link: 'https://example.com' }
          ]
        }
      ];
      const result = serializer.serialize(data);
      expect(result).toContain(`<!-- ${marker}`);
    });

    it('특수문자 포함 데이터도 직렬화', () => {
      const data: BlockData[] = [
        { type: 'paragraph', id: 1, text: '<script>alert("xss")</script>' }
      ];
      const result = serializer.serialize(data);
      expect(result).toContain(`<!-- ${marker}`);
    });

    it('한글 포함 데이터 직렬화', () => {
      const data: BlockData[] = [
        { type: 'paragraph', id: 1, text: '안녕하세요. 한글 테스트입니다.' }
      ];
      const result = serializer.serialize(data);
      expect(result).toContain(`<!-- ${marker}`);
    });

    it('이모지 포함 데이터 직렬화', () => {
      const data: BlockData[] = [
        { type: 'paragraph', id: 1, text: '🎉 축하합니다! 🎊' }
      ];
      const result = serializer.serialize(data);
      expect(result).toContain(`<!-- ${marker}`);
    });
  });

  describe('deserialize() - HTML 주석을 블록 배열로 역직렬화', () => {
    it('직렬화된 데이터를 원본으로 복원', () => {
      const original: BlockData[] = [{ type: 'paragraph', id: 1, text: 'Hello' }];
      const serialized = serializer.serialize(original);
      const deserialized = serializer.deserialize(serialized);
      expect(deserialized).toEqual(original);
    });

    it('빈 배열도 복원 가능', () => {
      const original: BlockData[] = [];
      const serialized = serializer.serialize(original);
      const deserialized = serializer.deserialize(serialized);
      expect(deserialized).toEqual(original);
    });

    it('복잡한 중첩 객체 복원', () => {
      const original: BlockData[] = [
        {
          type: 'infobox',
          id: 1,
          label: '정보',
          items: [
            { k: '키1', v: '값1' },
            { k: '키2', v: '값2' }
          ]
        }
      ];
      const serialized = serializer.serialize(original);
      const deserialized = serializer.deserialize(serialized);
      expect(deserialized).toEqual(original);
    });

    it('마커가 없으면 null 반환', () => {
      const html = '<div>content without marker</div>';
      const result = serializer.deserialize(html);
      expect(result).toBeNull();
    });

    it('손상된 base64는 null 반환', () => {
      const html = `<!-- ${marker}INVALID_BASE64!!! -->`;
      const result = serializer.deserialize(html);
      expect(result).toBeNull();
    });

    it('완전히 손상된 JSON은 null 반환', () => {
      // base64로 인코딩된 유효하지 않은 JSON
      const invalidJson = btoa(encodeURIComponent('not a json'));
      const html = `<!-- ${marker}${invalidJson} -->`;
      const result = serializer.deserialize(html);
      expect(result).toBeNull();
    });

    it('여러 마커 중 올바른 것만 추출', () => {
      const original: BlockData[] = [{ type: 'paragraph', id: 1, text: 'correct' }];
      const serialized = serializer.serialize(original);
      const otherMarkerData = `<!-- OTHER_MARKER${btoa(encodeURIComponent('{}'))} -->${serialized}`;
      const result = serializer.deserialize(otherMarkerData);
      expect(result).toEqual(original);
    });

    it('HTML 본문 내에 마커가 포함되어 있어도 추출', () => {
      const original: BlockData[] = [{ type: 'paragraph', id: 1, text: 'data' }];
      const serialized = serializer.serialize(original);
      const html = `<div class="content"><p>some html</p>${serialized}</div>`;
      const result = serializer.deserialize(html);
      expect(result).toEqual(original);
    });

    it('특수문자 포함 데이터 복원', () => {
      const original: BlockData[] = [
        { type: 'paragraph', id: 1, text: '<>&"\' 모든 특수문자' }
      ];
      const serialized = serializer.serialize(original);
      const deserialized = serializer.deserialize(serialized);
      expect(deserialized).toEqual(original);
    });

    it('한글 데이터 완벽히 복원', () => {
      const original: BlockData[] = [
        { type: 'paragraph', id: 1, text: '한글 테스트: 가나다라마바사' }
      ];
      const serialized = serializer.serialize(original);
      const deserialized = serializer.deserialize(serialized);
      expect(deserialized).toEqual(original);
    });

    it('이모지 데이터 완벽히 복원', () => {
      const original: BlockData[] = [
        { type: 'paragraph', id: 1, text: '🎉🎊✨ 파티! 🚀🌟' }
      ];
      const serialized = serializer.serialize(original);
      const deserialized = serializer.deserialize(serialized);
      expect(deserialized).toEqual(original);
    });

    it('줄바꿈 포함 데이터 복원', () => {
      const original: BlockData[] = [
        { type: 'paragraph', id: 1, text: '줄1\n줄2\n줄3' }
      ];
      const serialized = serializer.serialize(original);
      const deserialized = serializer.deserialize(serialized);
      expect(deserialized).toEqual(original);
    });

    it('null 값 포함 객체도 복원', () => {
      const original: BlockData[] = [
        { type: 'paragraph', id: 1, text: null as any }
      ];
      const serialized = serializer.serialize(original);
      const deserialized = serializer.deserialize(serialized);
      expect(deserialized).toEqual(original);
    });

    it('undefined는 JSON 직렬화에서 제거됨', () => {
      const original = [{ type: 'paragraph', id: 1, text: 'hello', extra: undefined }];
      const serialized = serializer.serialize(original as any);
      const deserialized = serializer.deserialize(serialized);
      // undefined는 JSON 직렬화에서 제거되므로 deserialized에는 extra 필드가 없음
      expect(deserialized).toEqual([{ type: 'paragraph', id: 1, text: 'hello' }]);
    });
  });

  describe('Round-trip - serialize → deserialize 완전 동등성', () => {
    const testCases: BlockData[][] = [
      // 단일 블록
      [{ type: 'paragraph', id: 1, text: 'Simple text' }],

      // 여러 블록
      [
        { type: 'lead', id: 1, text: 'Lead paragraph' },
        { type: 'paragraph', id: 2, text: 'Normal paragraph' },
        { type: 'divider', id: 3 }
      ],

      // 복합 필드
      [
        {
          type: 'numcards',
          id: 1,
          items: [
            { title: 'First', desc: 'Description 1' },
            { title: 'Second', desc: 'Description 2' }
          ]
        }
      ],

      // 이미지 블록
      [
        {
          type: 'img-pair',
          id: 1,
          src1: 'https://example.com/1.jpg',
          src2: 'https://example.com/2.jpg',
          cap: 'Caption'
        }
      ],

      // 갤러리
      [
        {
          type: 'gallery',
          id: 1,
          src1: 'https://example.com/1.jpg',
          src2: 'https://example.com/2.jpg',
          src3: 'https://example.com/3.jpg',
          cap: 'Gallery caption'
        }
      ],

      // 인물 정보
      [
        {
          type: 'img-text',
          id: 1,
          src: 'https://example.com/profile.jpg',
          name: '홍길동',
          role: '감독',
          bio: '약력\n상세정보'
        }
      ],

      // 인용
      [
        {
          type: 'quote',
          id: 1,
          text: '"인용문\n여러줄',
          attr: '출처'
        }
      ],

      // Stats
      [
        {
          type: 'stats',
          id: 1,
          items: [
            { num: '100', label: '회' },
            { num: '1,000', label: '명' },
            { num: '500억', label: '원' }
          ]
        }
      ],

      // Infobox
      [
        {
          type: 'infobox',
          id: 1,
          label: '정보',
          items: [
            { k: '개봉일', v: '2024.01.01' },
            { k: '감독', v: '홍길동' }
          ]
        }
      ],

      // Press list
      [
        {
          type: 'press-list',
          id: 1,
          items: [
            {
              src: '중앙일보',
              date: '2024.01.01',
              title: '첫 기사',
              ex: '요약',
              link: 'https://example.com/1'
            },
            {
              src: '조선일보',
              date: '2024.01.02',
              title: '두 번째 기사',
              ex: '요약',
              link: 'https://example.com/2'
            }
          ]
        }
      ],

      // Timeline
      [
        {
          type: 'timeline',
          id: 1,
          items: [
            { date: '2024', title: 'Year start', desc: 'Beginning' },
            { date: '2024.06', title: 'Midyear', desc: 'Middle' }
          ]
        }
      ],

      // Video
      [
        {
          type: 'video',
          id: 1,
          url: 'https://youtube.com/embed/abc123',
          cap: 'Video title'
        }
      ],

      // CTA
      [
        {
          type: 'cta',
          id: 1,
          text: 'Click here',
          label: 'Go',
          url: 'https://example.com'
        }
      ]
    ];

    testCases.forEach((testData, index) => {
      it(`Round-trip 테스트 케이스 ${index + 1}`, () => {
        const serialized = serializer.serialize(testData);
        const deserialized = serializer.deserialize(serialized);
        expect(deserialized).toEqual(testData);
      });
    });
  });

  describe('다른 마커를 사용하는 serializer', () => {
    const customMarker = 'CUSTOM_MARKER_123';
    const customSerializer = createSerializer<BlockData[]>(customMarker);

    it('커스텀 마커로 직렬화/역직렬화', () => {
      const data: BlockData[] = [{ type: 'paragraph', id: 1, text: 'Custom marker test' }];
      const serialized = customSerializer.serialize(data);
      expect(serialized).toContain(`<!-- ${customMarker}`);
      const deserialized = customSerializer.deserialize(serialized);
      expect(deserialized).toEqual(data);
    });

    it('다른 마커는 인식 못함', () => {
      const data: BlockData[] = [{ type: 'paragraph', id: 1, text: 'test' }];
      const serialized = customSerializer.serialize(data);
      // 다른 serializer에서는 찾을 수 없음
      const otherMarker = createSerializer<BlockData[]>('DIFFERENT_MARKER');
      expect(otherMarker.deserialize(serialized)).toBeNull();
    });
  });

  describe('마커 문자열에 특수문자 포함', () => {
    const specialMarker = 'MARK_V1.0_-_TEST';
    const specialSerializer = createSerializer<BlockData[]>(specialMarker);

    it('특수문자 마커도 정상 작동', () => {
      const data: BlockData[] = [{ type: 'paragraph', id: 1, text: 'test' }];
      const serialized = specialSerializer.serialize(data);
      expect(serialized).toContain(`<!-- ${specialMarker}`);
      const deserialized = specialSerializer.deserialize(serialized);
      expect(deserialized).toEqual(data);
    });
  });

  describe('대량 블록 처리', () => {
    it('100개 블록 배열도 직렬화/역직렬화 가능', () => {
      const blocks: BlockData[] = Array.from({ length: 100 }, (_, i) => ({
        type: 'paragraph' as const,
        id: i + 1,
        text: `Block ${i + 1}`
      }));
      const serialized = serializer.serialize(blocks);
      const deserialized = serializer.deserialize(serialized);
      expect(deserialized).toEqual(blocks);
      expect(deserialized?.length).toBe(100);
    });

    it('각 블록이 독립적으로 올바른 데이터를 유지', () => {
      const blocks: BlockData[] = Array.from({ length: 20 }, (_, i) => ({
        type: 'paragraph' as const,
        id: i + 1,
        text: `번호 ${i + 1}: 한글 테스트 ${i + 1}`
      }));
      const serialized = serializer.serialize(blocks);
      const deserialized = serializer.deserialize(serialized);
      deserialized?.forEach((block, index) => {
        expect(block.id).toBe(index + 1);
        expect(block.text).toBe(`번호 ${index + 1}: 한글 테스트 ${index + 1}`);
      });
    });
  });
});
