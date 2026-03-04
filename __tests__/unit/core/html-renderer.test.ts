import { describe, it, expect } from 'vitest';
import { h, nl2br, hAttr, sanitizeUrl, sanitizeImageSrc } from '../../../src/core/html-renderer';

describe('html-renderer 헬퍼 함수들', () => {
  describe('h() - HTML 이스케이핑', () => {
    it('앰퍼샌드를 &amp;로 변환', () => {
      expect(h('Tom & Jerry')).toBe('Tom &amp; Jerry');
    });

    it('작은 괄호를 &lt;&gt;로 변환', () => {
      expect(h('<script>')).toBe('&lt;script&gt;');
    });

    it('큰따옴표는 이스케이핑하지 않음 (nl2br에서 처리)', () => {
      expect(h('안녕 "하세요"')).toBe('안녕 "하세요"');
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
