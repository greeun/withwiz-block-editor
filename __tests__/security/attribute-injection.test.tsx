// __tests__/security/attribute-injection.test.tsx
//
// 속성 주입(attribute injection) XSS 회귀 테스트.
// 문자열 포함 여부 대신 출력 HTML 을 jsdom <template> 으로 파싱해
// 실제로 생성된 요소의 속성 이름 목록을 검사한다.
// (template.content 는 비활성 문서라 스크립트 실행·이미지 요청이 일어나지 않는다.)
import { describe, it, expect } from 'vitest';
import { nl2br, linkify, createHtmlRenderer } from '../../src/core/html-renderer';
import type { BlockData } from '../../src/types';

const LINK_PAYLOAD_DQ = 'see https://x.com/"onmouseover="alert(1) now';
const LINK_PAYLOAD_SQ = "see https://x.com/'onmouseover='alert(1) now";

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
  // 링크는 따옴표(원문 또는 엔티티) 앞에서 끝나므로 페이로드의 나머지는 a 요소 밖 텍스트로 남는다.
  it('nl2br: URL 안의 큰따옴표로 a 요소에 이벤트 핸들러 속성을 만들 수 없음', () => {
    const frag = parseHtml(nl2br(LINK_PAYLOAD_DQ));
    const anchors = frag.querySelectorAll('a');

    expect(anchors).toHaveLength(1);
    expect(attrNames(anchors[0])).toEqual(['href', 'target', 'rel']);
    expect(eventHandlerAttrs(frag)).toEqual([]);
    expect(anchors[0].getAttribute('href')).toBe('https://x.com/');
    expect(anchors[0].nextSibling?.textContent).toBe('"onmouseover="alert(1) now');
  });

  it('linkify 단독 사용: 이스케이프되지 않은 큰따옴표가 들어와도 href 를 끊지 못함', () => {
    const frag = parseHtml(linkify(LINK_PAYLOAD_DQ));
    const anchors = frag.querySelectorAll('a');

    expect(anchors).toHaveLength(1);
    expect(attrNames(anchors[0])).toEqual(['href', 'target', 'rel']);
    expect(eventHandlerAttrs(frag)).toEqual([]);
    expect(anchors[0].getAttribute('href')).toBe('https://x.com/');
    expect(anchors[0].nextSibling?.textContent).toBe('"onmouseover="alert(1) now');
  });

  it('linkify 단독 사용: 이스케이프되지 않은 작은따옴표가 들어와도 href 를 끊지 못함', () => {
    const html = linkify(LINK_PAYLOAD_SQ);
    const frag = parseHtml(html);
    const anchors = frag.querySelectorAll('a');

    expect(html).toContain('href="https://x.com/"');
    expect(anchors).toHaveLength(1);
    expect(attrNames(anchors[0])).toEqual(['href', 'target', 'rel']);
    expect(eventHandlerAttrs(frag)).toEqual([]);
    expect(anchors[0].getAttribute('href')).toBe('https://x.com/');
    expect(anchors[0].nextSibling?.textContent).toBe("'onmouseover='alert(1) now");
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
