import { describe, it, expect } from 'vitest';
import { h, nl2br, hAttr, linkify, sanitizeUrl, sanitizeImageSrc } from '../../../src/core/html-renderer';

/** 출력 HTML 을 jsdom <template> 으로 파싱 (비활성 문서라 스크립트 실행·리소스 요청이 없다) */
function parseHtml(html: string): DocumentFragment {
  const tpl = document.createElement('template');
  tpl.innerHTML = html;
  return tpl.content;
}

describe('html-renderer 헬퍼 함수들', () => {
  describe('h() - HTML 이스케이핑', () => {
    it('앰퍼샌드를 &amp;로 변환', () => {
      expect(h('Tom & Jerry')).toBe('Tom &amp; Jerry');
    });

    it('작은 괄호를 &lt;&gt;로 변환', () => {
      expect(h('<script>')).toBe('&lt;script&gt;');
    });

    it('큰따옴표를 &quot;로 변환 (속성 주입 방어)', () => {
      expect(h('안녕 "하세요"')).toBe('안녕 &quot;하세요&quot;');
    });

    it('작은따옴표를 &#39;로 변환 (속성 주입 방어)', () => {
      expect(h("it's")).toBe('it&#39;s');
    });

    it('앰퍼샌드를 먼저 처리해 따옴표 엔티티를 이중 이스케이프하지 않음', () => {
      expect(h(`"&'`)).toBe('&quot;&amp;&#39;');
    });

    it('빈 문자열 반환', () => {
      expect(h('')).toBe('');
    });

    it('undefined/null -> 빈 문자열로 처리', () => {
      expect(h(null as any)).toBe('');
      expect(h(undefined as any)).toBe('');
    });

    it('일반 텍스트 그대로 통과', () => {
      expect(h('안녕하세요')).toBe('안녕하세요');
    });

    it('복합 특수문자 이스케이핑', () => {
      expect(h('1 < 2 & 3 > 2')).toBe('1 &lt; 2 &amp; 3 &gt; 2');
    });
  });

  describe('nl2br() - 줄바꿈 처리', () => {
    it('줄바꿈 문자 \\n을 <br>로 변환', () => {
      expect(nl2br('첫 줄\n둘째 줄')).toBe('첫 줄<br>둘째 줄');
    });

    it('\\r\\n도 <br>로 변환', () => {
      expect(nl2br('첫 줄\r\n둘째 줄')).toBe('첫 줄<br>둘째 줄');
    });

    it('여러 줄바꿈 처리', () => {
      expect(nl2br('첫\n둘\n셋')).toBe('첫<br>둘<br>셋');
    });

    it('특수문자도 함께 이스케이핑', () => {
      expect(nl2br('<b>\n</b>')).toBe('&lt;b&gt;<br>&lt;/b&gt;');
    });

    it('빈 문자열 반환', () => {
      expect(nl2br('')).toBe('');
    });

    it('URL 뒤의 따옴표는 엔티티로 바뀌고 링크는 그 앞에서 끝나 href 속성을 끊지 못함', () => {
      expect(nl2br('see https://x.com/"onmouseover="alert(1) now')).toBe(
        'see <a href="https://x.com/" target="_blank" rel="noopener noreferrer">https://x.com/</a>&quot;onmouseover=&quot;alert(1) now',
      );
    });
  });

  describe('linkify() - URL 링크 변환', () => {
    it('http(s) URL을 a 요소로 감쌈', () => {
      expect(linkify('go https://example.com/path now')).toBe(
        'go <a href="https://example.com/path" target="_blank" rel="noopener noreferrer">https://example.com/path</a> now',
      );
    });

    it('원문 큰따옴표 앞에서 링크가 끝나 따옴표는 링크 밖 텍스트로 남음', () => {
      expect(linkify('see https://x.com/"onmouseover="alert(1) now')).toBe(
        'see <a href="https://x.com/" target="_blank" rel="noopener noreferrer">https://x.com/</a>"onmouseover="alert(1) now',
      );
    });

    it('원문 작은따옴표 앞에서 링크가 끝나 따옴표는 링크 밖 텍스트로 남음', () => {
      expect(linkify("see https://x.com/'onmouseover='alert(1) now")).toBe(
        "see <a href=\"https://x.com/\" target=\"_blank\" rel=\"noopener noreferrer\">https://x.com/</a>'onmouseover='alert(1) now",
      );
    });

    it('이미 인코딩된 &amp; 는 이중 이스케이프하지 않음', () => {
      expect(linkify('https://x.com/?a=1&amp;b=2')).toBe(
        '<a href="https://x.com/?a=1&amp;b=2" target="_blank" rel="noopener noreferrer">https://x.com/?a=1&amp;b=2</a>',
      );
    });
  });

  describe('linkify() - 따옴표로 감싼 URL (따옴표 앞에서 URL 일치가 끝남)', () => {
    /** 파싱 결과에서 a 요소가 1개인지 확인하고, 링크와 앞뒤 텍스트 노드를 돌려준다 */
    function parseSingleLink(html: string) {
      const frag = parseHtml(html);
      const anchors = frag.querySelectorAll('a');
      expect(anchors).toHaveLength(1);
      const a = anchors[0];
      return {
        frag,
        href: a.getAttribute('href'),
        linkText: a.textContent,
        before: a.previousSibling?.textContent ?? '',
        after: a.nextSibling?.textContent ?? '',
      };
    }

    it('nl2br: 큰따옴표로 감싼 URL 의 href 에 끝 따옴표가 포함되지 않음', () => {
      const r = parseSingleLink(nl2br('링크 "https://example.com" 참조'));

      expect(r.href).toBe('https://example.com');
      expect(r.linkText).toBe('https://example.com');
      expect(r.before).toBe('링크 "');
      expect(r.after).toBe('" 참조');
      expect(r.frag.textContent).toBe('링크 "https://example.com" 참조');
    });

    it('nl2br: 작은따옴표로 감싼 URL 의 href 에 끝 따옴표가 포함되지 않음', () => {
      const r = parseSingleLink(nl2br("링크 'https://example.com' 참조"));

      expect(r.href).toBe('https://example.com');
      expect(r.linkText).toBe('https://example.com');
      expect(r.before).toBe("링크 '");
      expect(r.after).toBe("' 참조");
    });

    it('linkify: 원문 큰따옴표로 감싼 URL', () => {
      const r = parseSingleLink(linkify('"https://example.com"'));

      expect(r.href).toBe('https://example.com');
      expect(r.linkText).toBe('https://example.com');
      expect(r.before).toBe('"');
      expect(r.after).toBe('"');
    });

    it('linkify: 원문 작은따옴표로 감싼 URL', () => {
      const r = parseSingleLink(linkify("'https://example.com'"));

      expect(r.href).toBe('https://example.com');
      expect(r.linkText).toBe('https://example.com');
      expect(r.before).toBe("'");
      expect(r.after).toBe("'");
    });

    it.each([
      ['&quot;', '"'],
      ['&#39;', "'"],
      ['&#x27;', "'"],
      ['&apos;', "'"],
    ])('linkify: 따옴표 엔티티 %s 앞에서 링크가 끝남', (entity, quote) => {
      const html = linkify(`https://example.com${entity}`);
      const r = parseSingleLink(html);

      expect(html.endsWith(`</a>${entity}`)).toBe(true);
      expect(r.href).toBe('https://example.com');
      expect(r.linkText).toBe('https://example.com');
      expect(r.after).toBe(quote);
    });

    it('linkify: &amp; 같은 다른 엔티티는 URL 에 계속 포함됨', () => {
      const r = parseSingleLink(linkify('https://x.com/?a=1&amp;b=2'));

      expect(r.href).toBe('https://x.com/?a=1&b=2');
      expect(r.linkText).toBe('https://x.com/?a=1&b=2');
      expect(r.before).toBe('');
      expect(r.after).toBe('');
    });
  });

  describe('hAttr() - 속성값 이스케이핑', () => {
    it('큰따옴표를 &quot;로 변환', () => {
      expect(hAttr('제목: "Hello"')).toBe('제목: &quot;Hello&quot;');
    });

    it('기본 이스케이핑도 함께 처리 (h + 큰따옴표)', () => {
      expect(hAttr('<img src="test" />')).toBe('&lt;img src=&quot;test&quot; /&gt;');
    });

    it('앰퍼샌드와 큰따옴표 모두', () => {
      expect(hAttr('a & "b"')).toBe('a &amp; &quot;b&quot;');
    });

    it('작은따옴표를 &#39;로 변환', () => {
      expect(hAttr("it's")).toBe('it&#39;s');
    });

    it('따옴표 엔티티를 이중 이스케이프하지 않음 (&amp;quot; 가 생기지 않음)', () => {
      const out = hAttr(`a "b" 'c' &`);
      expect(out).toBe('a &quot;b&quot; &#39;c&#39; &amp;');
      expect(out).not.toContain('&amp;quot;');
      expect(out).not.toContain('&amp;#39;');
    });

    it('빈 문자열 반환', () => {
      expect(hAttr('')).toBe('');
    });
  });

  describe('sanitizeUrl() - URL 검증 및 정제', () => {
    describe('위험한 프로토콜 차단', () => {
      it('javascript: 프로토콜 차단', () => {
        expect(sanitizeUrl('javascript:alert("xss")')).toBe('');
      });

      it('data: 프로토콜 차단', () => {
        expect(sanitizeUrl('data:text/html,<script>alert("xss")</script>')).toBe('');
      });

      it('vbscript: 프로토콜 차단', () => {
        expect(sanitizeUrl('vbscript:msgbox("xss")')).toBe('');
      });

      it('file:// 프로토콜 차단', () => {
        expect(sanitizeUrl('file:///etc/passwd')).toBe('');
      });

      it('대문자 JAVASCRIPT: 도 차단 (대소문자 무시)', () => {
        expect(sanitizeUrl('JAVASCRIPT:alert(1)')).toBe('');
        expect(sanitizeUrl('Javascript:alert(1)')).toBe('');
      });
    });

    describe('안전한 URL 허용', () => {
      it('http:// 프로토콜 허용', () => {
        expect(sanitizeUrl('http://example.com')).toBe('http://example.com');
      });

      it('https:// 프로토콜 허용', () => {
        expect(sanitizeUrl('https://example.com')).toBe('https://example.com');
      });

      it('상대 경로 /로 시작하는 URL 허용', () => {
        expect(sanitizeUrl('/articles/page')).toBe('/articles/page');
      });

      it('앵커 링크 #으로 시작하는 URL 허용', () => {
        expect(sanitizeUrl('#section')).toBe('#section');
      });

      it('./ 상대 경로 허용', () => {
        expect(sanitizeUrl('./images/pic.jpg')).toBe('./images/pic.jpg');
      });

      it('../ 상대 경로 허용', () => {
        expect(sanitizeUrl('../parent/file')).toBe('../parent/file');
      });

      it('쿼리 스트링 포함 URL 허용', () => {
        expect(sanitizeUrl('https://example.com?page=1&sort=name')).toBe('https://example.com?page=1&sort=name');
      });
    });

    describe('속성 주입 공격 방지', () => {
      it('큰따옴표 포함 URL 차단', () => {
        expect(sanitizeUrl('https://example.com" onclick="alert(1)')).toBe('');
      });

      it('작은따옴표 포함 URL 차단', () => {
        expect(sanitizeUrl("https://example.com' onmouseover='alert(1)")).toBe('');
      });

      it('< 문자 포함 URL 차단', () => {
        expect(sanitizeUrl('https://example.com<script>')).toBe('');
      });

      it('> 문자 포함 URL 차단', () => {
        expect(sanitizeUrl('https://example.com>alert')).toBe('');
      });
    });

    describe('엣지 케이스', () => {
      it('빈 문자열 반환', () => {
        expect(sanitizeUrl('')).toBe('');
      });

      it('공백만 있는 문자열 반환', () => {
        expect(sanitizeUrl('   ')).toBe('');
      });

      it('앞뒤 공백 제거 후 검증', () => {
        expect(sanitizeUrl('  https://example.com  ')).toBe('https://example.com');
      });
    });
  });

  describe('sanitizeImageSrc() - 이미지 URL 검증', () => {
    describe('위험한 프로토콜 차단', () => {
      it('javascript: 프로토콜 차단', () => {
        expect(sanitizeImageSrc('javascript:alert(1)')).toBe('');
      });

      it('data: 프로토콜 차단', () => {
        expect(sanitizeImageSrc('data:image/svg+xml,<svg>alert</svg>')).toBe('');
      });

      it('SVG 데이터 URI 차단', () => {
        expect(sanitizeImageSrc('data:image/svg+xml,%3Csvg%3E')).toBe('');
      });

      it('<svg 태그 포함 차단', () => {
        expect(sanitizeImageSrc('test<svg>alert</svg>.jpg')).toBe('');
      });

      it('<img 태그 포함 차단', () => {
        expect(sanitizeImageSrc('test<img src=1 onerror=alert(1)>')).toBe('');
      });
    });

    describe('안전한 이미지 URL 허용', () => {
      it('http:// 이미지 URL 허용', () => {
        expect(sanitizeImageSrc('http://example.com/image.jpg')).toBe('http://example.com/image.jpg');
      });

      it('https:// 이미지 URL 허용', () => {
        expect(sanitizeImageSrc('https://example.com/image.jpg')).toBe('https://example.com/image.jpg');
      });

      it('절대 경로 / 허용', () => {
        expect(sanitizeImageSrc('/images/photo.png')).toBe('/images/photo.png');
      });

      it('프로토콜 없는 상대 경로 허용', () => {
        expect(sanitizeImageSrc('images/photo.png')).toBe('images/photo.png');
      });

      it('./로 시작하는 상대 경로 허용', () => {
        expect(sanitizeImageSrc('./images/photo.png')).toBe('./images/photo.png');
      });

      it('../로 시작하는 상대 경로 허용', () => {
        expect(sanitizeImageSrc('../images/photo.png')).toBe('../images/photo.png');
      });

      it('쿼리 스트링 포함 이미지 URL 허용', () => {
        expect(sanitizeImageSrc('https://example.com/img.jpg?size=large&quality=90')).toBe(
          'https://example.com/img.jpg?size=large&quality=90'
        );
      });
    });

    describe('엣지 케이스', () => {
      it('빈 문자열 반환', () => {
        expect(sanitizeImageSrc('')).toBe('');
      });

      it('공백만 있는 문자열 반환', () => {
        expect(sanitizeImageSrc('   ')).toBe('');
      });
    });
  });
});
