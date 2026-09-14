// __tests__/security/attribute-injection.test.tsx
//
// 속성 주입(attribute injection) XSS 회귀 테스트.
// 문자열 포함 여부 대신 출력 HTML 을 jsdom <template> 으로 파싱해
// 실제로 생성된 요소의 속성 이름 목록을 검사한다.
// (template.content 는 비활성 문서라 스크립트 실행·이미지 요청이 일어나지 않는다.)
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { nl2br, linkify, createHtmlRenderer } from '../../src/core/html-renderer';
import { ArtistEditor } from '../../src/components/ArtistEditor';
import { BlockEditorProvider } from '../../src/context/BlockEditorProvider';
import { createSerializer } from '../../src/core/serializer';
import type { ArtistBioData, BlockData } from '../../src/types';

const LINK_PAYLOAD_DQ = 'see https://x.com/"onmouseover="alert(1) now';
const LINK_PAYLOAD_SQ = "see https://x.com/'onmouseover='alert(1) now";
const IMG_PAYLOAD = 'x.png" onerror="alert(1)';

function parseHtml(html: string): DocumentFragment {
  const tpl = document.createElement('template');
  tpl.innerHTML = html;
  return tpl.content;
}

function attrNames(el: Element): string[] {
  return Array.from(el.attributes).map((a) => a.name);
}

/** 모든 하위 요소에서 on* 로 시작하는 속성을 `tag[attr]` 형태로 수집 */
function eventHandlerAttrs(root: ParentNode): string[] {
  return Array.from(root.querySelectorAll('*')).flatMap((el) =>
    attrNames(el)
      .filter((name) => name.toLowerCase().startsWith('on'))
      .map((name) => `${el.tagName.toLowerCase()}[${name}]`),
  );
}

describe('SEC-007: linkify / nl2br 속성 주입 방지', () => {
  it('nl2br: URL 안의 큰따옴표로 a 요소에 이벤트 핸들러 속성을 만들 수 없음', () => {
    const frag = parseHtml(nl2br(LINK_PAYLOAD_DQ));
    const anchors = frag.querySelectorAll('a');

    expect(anchors).toHaveLength(1);
    expect(attrNames(anchors[0])).toEqual(['href', 'target', 'rel']);
    expect(eventHandlerAttrs(frag)).toEqual([]);
    expect(anchors[0].getAttribute('href')).toBe('https://x.com/"onmouseover="alert(1)');
  });

  it('linkify 단독 사용: 이스케이프되지 않은 큰따옴표가 들어와도 href 를 끊지 못함', () => {
    const frag = parseHtml(linkify(LINK_PAYLOAD_DQ));
    const anchors = frag.querySelectorAll('a');

    expect(anchors).toHaveLength(1);
    expect(attrNames(anchors[0])).toEqual(['href', 'target', 'rel']);
    expect(eventHandlerAttrs(frag)).toEqual([]);
    expect(anchors[0].getAttribute('href')).toBe('https://x.com/"onmouseover="alert(1)');
  });

  it('linkify 단독 사용: 작은따옴표는 href 에 &#39; 로 출력됨', () => {
    const html = linkify(LINK_PAYLOAD_SQ);
    const frag = parseHtml(html);
    const anchors = frag.querySelectorAll('a');

    expect(html).toContain('href="https://x.com/&#39;onmouseover=&#39;alert(1)"');
    expect(anchors).toHaveLength(1);
    expect(attrNames(anchors[0])).toEqual(['href', 'target', 'rel']);
    expect(eventHandlerAttrs(frag)).toEqual([]);
  });
});

describe('SEC-008: nl2br 를 쓰는 블록의 링크 속성 주입 방지', () => {
  const renderer = createHtmlRenderer('test');
  const cases: Array<[string, BlockData]> = [
    ['lead', { id: 1, type: 'lead', text: LINK_PAYLOAD_DQ }],
    ['paragraph', { id: 1, type: 'paragraph', text: LINK_PAYLOAD_DQ }],
    ['img-text.bio', { id: 1, type: 'img-text', name: 'n', bio: LINK_PAYLOAD_DQ }],
    ['quote', { id: 1, type: 'quote', text: LINK_PAYLOAD_DQ }],
    ['quote-large', { id: 1, type: 'quote-large', text: LINK_PAYLOAD_DQ }],
    ['callout', { id: 1, type: 'callout', text: LINK_PAYLOAD_DQ }],
    ['qa.a', { id: 1, type: 'qa', q: 'q', a: LINK_PAYLOAD_DQ }],
  ];

  it.each(cases)('%s: a 요소 속성은 href/target/rel 뿐', (_name, block) => {
    const frag = parseHtml(renderer.renderBlock(block));
    const anchors = Array.from(frag.querySelectorAll('a'));

    expect(anchors).toHaveLength(1);
    expect(attrNames(anchors[0])).toEqual(['href', 'target', 'rel']);
    expect(eventHandlerAttrs(frag)).toEqual([]);
  });
});

describe('SEC-009: ArtistEditor 이미지 src 속성 주입 방지', () => {
  const ser = createSerializer<ArtistBioData>('abe-blocks:');

  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function mount(data: ArtistBioData) {
    const onChange = vi.fn();
    render(
      <BlockEditorProvider uploadImage={vi.fn()}>
        <ArtistEditor content={ser.serialize(data)} onChange={onChange} />
      </BlockEditorProvider>,
    );
    const preview = document.querySelector('.abe-pv-article')!;
    return { onChange, preview };
  }

  /** textarea 를 바꿔 onChange 를 일으키고, 마지막 payload 의 HTML 부분을 파싱 */
  async function emittedHtml(onChange: ReturnType<typeof vi.fn>, text: string) {
    const textarea = document.querySelector<HTMLTextAreaElement>('.abe-textarea')!;
    fireEvent.change(textarea, { target: { value: text } });
    await waitFor(() => expect(onChange).toHaveBeenCalled());
    const payload = onChange.mock.calls.at(-1)![0] as string;
    return parseHtml(payload);
  }

  it('텍스트 + 대표 이미지: 따옴표가 든 mainImage 는 img 를 출력하지 않음 (미리보기·onChange)', async () => {
    const { onChange, preview } = mount({ text: '약력', mainImage: IMG_PAYLOAD, gallery: [] });

    expect(preview.querySelectorAll('img')).toHaveLength(0);
    expect(eventHandlerAttrs(preview)).toEqual([]);

    const frag = await emittedHtml(onChange, '약력 수정');
    expect(frag.querySelectorAll('img')).toHaveLength(0);
    expect(eventHandlerAttrs(frag)).toEqual([]);
  });

  it('대표 이미지만: 따옴표가 든 mainImage 는 img 를 출력하지 않음', () => {
    const { preview } = mount({ text: '', mainImage: IMG_PAYLOAD, gallery: [] });

    expect(preview.querySelector('.abe-pv-main-img')).toBeNull();
    expect(preview.querySelectorAll('img')).toHaveLength(0);
    expect(eventHandlerAttrs(preview)).toEqual([]);
  });

  it('허용되지 않는 프로토콜(javascript:) mainImage 는 img 를 출력하지 않음', () => {
    const { preview } = mount({ text: '약력', mainImage: 'javascript:alert(1)', gallery: [] });

    expect(preview.querySelector('.abe-pv-main-img')).toBeNull();
    expect(preview.querySelectorAll('img')).toHaveLength(0);
  });

  it('허용된 mainImage 는 그대로 img src 로 출력됨', () => {
    const { preview } = mount({
      text: '약력',
      mainImage: 'https://cdn.example.com/main.png?w=1&h=2',
      gallery: [],
    });

    const imgs = preview.querySelectorAll('.abe-pv-main-img img');
    expect(imgs).toHaveLength(1);
    expect(attrNames(imgs[0])).toEqual(['src', 'alt']);
    expect(imgs[0].getAttribute('src')).toBe('https://cdn.example.com/main.png?w=1&h=2');
  });

  it('갤러리: 따옴표가 든 항목은 제외하고 허용된 항목만 출력 (미리보기·onChange)', async () => {
    const ok = 'https://cdn.example.com/ok.png';
    const { onChange, preview } = mount({
      text: '',
      mainImage: '',
      gallery: [ok, IMG_PAYLOAD, "y.png' onerror='alert(2)", 'javascript:alert(3)'],
    });

    const check = (root: ParentNode) => {
      const imgs = root.querySelectorAll('.abe-pv-gallery-grid img');
      expect(imgs).toHaveLength(1);
      expect(attrNames(imgs[0])).toEqual(['src', 'alt', 'class']);
      expect(imgs[0].getAttribute('src')).toBe(ok);
      expect(root.querySelector('.abe-pv-gallery-grid')!.classList.contains('layout-1')).toBe(true);
      expect(eventHandlerAttrs(root)).toEqual([]);
    };

    check(preview);
    check(await emittedHtml(onChange, '약력'));
  });
});
