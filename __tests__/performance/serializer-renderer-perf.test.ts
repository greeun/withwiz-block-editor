/**
 * PERF-002: Serializer / HtmlRenderer micro-benchmarks
 *
 * Layer: createSerializer + createHtmlRenderer 처리시간 (jsdom 단위 벤치)
 *
 * Companion to rendering-performance.test.ts (그쪽은 렌더러 단일 호출 시간만 측정).
 * 본 파일은:
 *   - serializer 단독 처리시간 (BUILT_IN_BLOCKS 전 타입 혼합)
 *   - serialize → deserialize round-trip 동치성 + 합산 처리시간
 *   - htmlRenderer 단일 호출 (500블록) p-percentile
 *   - htmlRenderer 동시 100건 (Promise.resolve wrap) 총시간
 *
 * 임계값은 로컬 jsdom baseline (M-series, vitest 4.1.7) 기준 측정값의
 * 약 10~15배 여유를 둠 — variance 30% 정도 관측, CI/타 환경 GC pause 감안.
 * 회귀가 의미있게 잡힐 정도로 낮춤 (작업 지시 PERF gap 보강).
 *
 * 측정 메모 (참고):
 *   SER     p95 ≈ 0.033–0.041 ms   →  임계 2 ms
 *   RT      p95 ≈ 0.069–0.080 ms   →  임계 5 ms
 *   REN500  p95 ≈ 0.158–0.233 ms   →  임계 5 ms
 *   CONC100 total ≈ 1.6–1.8 ms     →  임계 50 ms
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { createSerializer } from '../../src/core/serializer';
import { createHtmlRenderer } from '../../src/core/html-renderer';
import { BUILT_IN_BLOCKS, createEmptyBlock } from '../../src/blocks/built-in';
import type { BlockData } from '../../src/types';

/* ─── 측정 헬퍼 ──────────────────────────────────────────── */

// setup.ts 가 vi.useFakeTimers({ shouldAdvanceTime: true }) 를 걸어
// performance.now / Date.now 가 가속화/고정되므로, 본 perf 파일은
// 본격 측정 동안만 real timer 로 전환한다.
beforeAll(() => {
  vi.useRealTimers();
});
afterAll(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

/** ms 정밀 시각 — performance.now 대신 hrtime 사용 (jsdom polyfill 회피) */
function now(): number {
  return Number(process.hrtime.bigint()) / 1e6;
}

/** 작업지시에 명시된 percentile 함수 (inline) */
function p(arr: number[], n: number): number {
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.ceil((s.length * n) / 100) - 1];
}

/* ─── 픽스처 빌더 ────────────────────────────────────────── */

/**
 * BUILT_IN_BLOCKS 의 22개 타입을 순환하며 N개 블록을 만든다.
 * createEmptyBlock 으로 타입별 필수 필드를 채운 뒤, 빈 문자열을
 * 의미있는 더미 데이터로 덮어써 직렬화/렌더 work 가 0 이 되지 않게 한다.
 */
function makeMixedBlocks(count: number): BlockData[] {
  const out: BlockData[] = [];
  for (let i = 0; i < count; i++) {
    const def = BUILT_IN_BLOCKS[i % BUILT_IN_BLOCKS.length];
    const b = createEmptyBlock(def.type, i);

    // 스칼라 필드 채우기 (존재할 때만)
    if (b.text !== undefined) b.text = `텍스트 ${i} — perf sample content`;
    if (b.en !== undefined) b.en = `EN-${i}`;
    if (b.src !== undefined) b.src = `/img/${i}.jpg`;
    if (b.src1 !== undefined) b.src1 = `/img/${i}-1.jpg`;
    if (b.src2 !== undefined) b.src2 = `/img/${i}-2.jpg`;
    if (b.src3 !== undefined) b.src3 = `/img/${i}-3.jpg`;
    if (b.cap !== undefined) b.cap = `caption ${i}`;
    if (b.attr !== undefined) b.attr = `- Author ${i}`;
    if (b.name !== undefined) b.name = `Name ${i}`;
    if (b.role !== undefined) b.role = `Role ${i}`;
    if (b.bio !== undefined) b.bio = `Bio ${i}`;
    if (b.title !== undefined) b.title = `Title ${i}`;
    if (b.url !== undefined) b.url = `https://example.com/${i}`;
    if (b.label !== undefined) b.label = `Label ${i}`;
    if (b.q !== undefined) b.q = `Q-${i}`;
    if (b.a !== undefined) b.a = `A-${i}`;

    // 컬렉션 필드 (createEmptyBlock 이 세팅한 첫 row 를 그대로 사용,
    // 다만 의미있는 값으로 덮어쓴다)
    if (b.items) {
      b.items = b.items.map((row, j) => {
        const filled: Record<string, string> = {};
        for (const k of Object.keys(row)) filled[k] = `${k}-${i}-${j}`;
        return filled;
      });
    }
    out.push(b);
  }
  return out;
}

/* ─── 테스트 본체 ────────────────────────────────────────── */

describe('PERF-002: serializer / htmlRenderer micro-benchmarks', () => {
  const MARKER = 'nbe-perf:';

  describe('serializer 단독 처리시간', () => {
    it('100개 블록 직렬화 x100회 — p95 < 2ms', () => {
      const ser = createSerializer<BlockData[]>(MARKER);
      const blocks = makeMixedBlocks(100);

      const samples: number[] = [];
      let lastOut = '';
      for (let i = 0; i < 100; i++) {
        const t = now();
        lastOut = ser.serialize(blocks);
        samples.push(now() - t);
      }

      const p50 = p(samples, 50);
      const p95 = p(samples, 95);
      const p99 = p(samples, 99);

      // 결과가 실제로 의미 있는 길이를 가져야 함 (직렬화가 비어있지 않음)
      expect(lastOut.length).toBeGreaterThan(100);

      // 회귀 감지 — baseline ≈ 0.04ms 의 약 50배 상한
      expect(p95).toBeLessThan(2);
      // p99 도 너무 폭주하지 않도록
      expect(p99).toBeLessThan(5);

      // 디버깅에 유용 — vitest verbose 시 표시
      // eslint-disable-next-line no-console
      console.log(
        `[SER]    p50=${p50.toFixed(3)}ms  p95=${p95.toFixed(3)}ms  p99=${p99.toFixed(3)}ms  out=${lastOut.length}B`,
      );
    });
  });

  describe('serialize → deserialize round-trip', () => {
    it('동치성 보장 — deserialize 결과가 원본과 deep-equal', () => {
      const ser = createSerializer<BlockData[]>(MARKER);
      const blocks = makeMixedBlocks(100);

      const html = ser.serialize(blocks);
      const back = ser.deserialize(html);

      expect(back).not.toBeNull();
      expect(back).toEqual(blocks);
    });

    it('round-trip x100회 — p95 < 5ms', () => {
      const ser = createSerializer<BlockData[]>(MARKER);
      const blocks = makeMixedBlocks(100);

      const samples: number[] = [];
      let restored: BlockData[] | null = null;
      for (let i = 0; i < 100; i++) {
        const t = now();
        const html = ser.serialize(blocks);
        restored = ser.deserialize(html);
        samples.push(now() - t);
      }

      const p50 = p(samples, 50);
      const p95 = p(samples, 95);
      const p99 = p(samples, 99);

      // 마지막 round-trip 도 여전히 동치인지 검증 (loop 내부 회귀 방지)
      expect(restored).not.toBeNull();
      expect(restored).toEqual(blocks);

      // baseline ≈ 0.08ms 의 약 60배 상한
      expect(p95).toBeLessThan(5);
      expect(p99).toBeLessThan(10);

      // eslint-disable-next-line no-console
      console.log(
        `[RT]     p50=${p50.toFixed(3)}ms  p95=${p95.toFixed(3)}ms  p99=${p99.toFixed(3)}ms`,
      );
    });
  });

  describe('htmlRenderer 단일 호출', () => {
    it('500블록 호출 x30회 — p95 < 5ms', () => {
      const renderer = createHtmlRenderer('perf-pvb');
      const blocks = makeMixedBlocks(500);

      const samples: number[] = [];
      let lastHtml = '';
      for (let i = 0; i < 30; i++) {
        const t = now();
        lastHtml = renderer.renderBlocks(blocks);
        samples.push(now() - t);
      }

      const p50 = p(samples, 50);
      const p95 = p(samples, 95);
      const p99 = p(samples, 99);

      // 렌더 결과가 충분히 큰 HTML 이어야 함 (500블록 → 최소 수 KB)
      expect(lastHtml.length).toBeGreaterThan(5000);

      // baseline ≈ 0.2ms 의 약 25배 상한 (단일 호출은 variance 가 더 큼)
      expect(p95).toBeLessThan(5);
      expect(p99).toBeLessThan(15);

      // eslint-disable-next-line no-console
      console.log(
        `[REN500] p50=${p50.toFixed(3)}ms  p95=${p95.toFixed(3)}ms  p99=${p99.toFixed(3)}ms  out=${lastHtml.length}B`,
      );
    });
  });

  describe('htmlRenderer 동시 100건', () => {
    it('Promise.resolve wrap 으로 100회 호출 — 전체 < 50ms', async () => {
      const renderer = createHtmlRenderer('perf-pvb');
      // 동시처리 시나리오는 블록 수보다 호출 빈도 자체가 부하 — 적당히 50블록
      const blocks = makeMixedBlocks(50);

      const t = now();
      const results = await Promise.all(
        Array.from({ length: 100 }, () =>
          Promise.resolve().then(() => renderer.renderBlocks(blocks)),
        ),
      );
      const total = now() - t;

      // 100건 모두 정상 결과
      expect(results).toHaveLength(100);
      for (const html of results) {
        expect(html.length).toBeGreaterThan(100);
      }

      // baseline ≈ 1.7ms 의 약 30배 상한 (작업지시 < 500ms 에서 회귀감지 강화)
      expect(total).toBeLessThan(50);

      // eslint-disable-next-line no-console
      console.log(`[CONC100] total=${total.toFixed(3)}ms (100 renders / 50 blocks each)`);
    });
  });
});
