import { describe, it, expect } from 'vitest';
import { createHtmlRenderer } from '../../../src/core/html-renderer';
import type { BlockData } from '../../../src/types';

describe('html-renderer 블록 렌더링 (22개 타입)', () => {
  const renderer = createHtmlRenderer('test');
  const renderBlock = renderer.renderBlock;

  describe('텍스트 블록', () => {
    describe('lead - 리드 단락', () => {
      it('텍스트가 있으면 div.test-lead로 렌더링', () => {
        const block: BlockData = { type: 'lead', id: 1, text: '기사의 도입부' };
        expect(renderBlock(block)).toBe('<div class="test-lead">기사의 도입부</div>');
      });

      it('줄바꿈이 <br>로 변환됨', () => {
        const block: BlockData = { type: 'lead', id: 1, text: '첫 줄\n둘째 줄' };
        expect(renderBlock(block)).toBe('<div class="test-lead">첫 줄<br>둘째 줄</div>');
      });

      it('텍스트가 없으면 빈 문자열', () => {
        const block: BlockData = { type: 'lead', id: 1, text: '' };
        expect(renderBlock(block)).toBe('');
      });

      it('특수문자 이스케이핑', () => {
        const block: BlockData = { type: 'lead', id: 1, text: '<script>alert(1)</script>' };
        expect(renderBlock(block)).toBe('<div class="test-lead">&lt;script&gt;alert(1)&lt;/script&gt;</div>');
      });
    });

    describe('paragraph - 일반 단락', () => {
      it('텍스트가 있으면 p.test-p로 렌더링', () => {
        const block: BlockData = { type: 'paragraph', id: 1, text: '본문 텍스트' };
        expect(renderBlock(block)).toBe('<p class="test-p">본문 텍스트</p>');
      });

      it('텍스트가 없으면 빈 문자열', () => {
        const block: BlockData = { type: 'paragraph', id: 1, text: '' };
        expect(renderBlock(block)).toBe('');
      });

      it('줄바꿈이 <br>로 변환됨', () => {
        const block: BlockData = { type: 'paragraph', id: 1, text: '줄1\n줄2' };
        expect(renderBlock(block)).toBe('<p class="test-p">줄1<br>줄2</p>');
      });
    });

    describe('subheading - 소제목', () => {
      it('텍스트가 있으면 div.test-sh로 렌더링', () => {
        const block: BlockData = { type: 'subheading', id: 1, text: '소제목' };
        expect(renderBlock(block)).toBe('<div class="test-sh">소제목</div>');
      });

      it('HTML 이스케이핑 (줄바꿈 미변환)', () => {
        const block: BlockData = { type: 'subheading', id: 1, text: '제목\n다음줄' };
        expect(renderBlock(block)).toBe('<div class="test-sh">제목\n다음줄</div>');
      });

      it('텍스트가 없으면 빈 문자열', () => {
        const block: BlockData = { type: 'subheading', id: 1, text: '' };
        expect(renderBlock(block)).toBe('');
      });
    });

    describe('subheading-label - 소제목+부제', () => {
      it('en 필드가 있으면 sh-en + sh 모두 렌더링', () => {
        const block: BlockData = { type: 'subheading-label', id: 1, en: 'Subtitle', text: '부제목' };
        expect(renderBlock(block)).toBe('<div class="test-sh-en">Subtitle</div><div class="test-sh">부제목</div>');
      });

      it('en 필드 없으면 sh만 렌더링', () => {
        const block: BlockData = { type: 'subheading-label', id: 1, en: '', text: '부제목' };
        expect(renderBlock(block)).toBe('<div class="test-sh">부제목</div>');
      });

      it('text가 없으면 en만 렌더링', () => {
        const block: BlockData = { type: 'subheading-label', id: 1, en: 'English', text: '' };
        expect(renderBlock(block)).toBe('<div class="test-sh-en">English</div>');
      });

      it('둘 다 없으면 빈 문자열', () => {
        const block: BlockData = { type: 'subheading-label', id: 1, en: '', text: '' };
        expect(renderBlock(block)).toBe('');
      });
    });
  });

  describe('레이아웃 블록', () => {
    describe('divider - 구분선', () => {
      it('항상 div.test-hr 렌더링', () => {
        const block: BlockData = { type: 'divider', id: 1 };
        expect(renderBlock(block)).toBe('<div class="test-hr"></div>');
      });
    });

    describe('spacer - 여백', () => {
      it('size=small이면 16px', () => {
        const block: BlockData = { type: 'spacer', id: 1, size: 'small' };
        expect(renderBlock(block)).toBe('<div style="height:16px"></div>');
      });

      it('size=medium이면 32px', () => {
        const block: BlockData = { type: 'spacer', id: 1, size: 'medium' };
        expect(renderBlock(block)).toBe('<div style="height:32px"></div>');
      });

      it('size=large이면 56px', () => {
        const block: BlockData = { type: 'spacer', id: 1, size: 'large' };
        expect(renderBlock(block)).toBe('<div style="height:56px"></div>');
      });

      it('size 미지정이면 32px (기본값)', () => {
        const block: BlockData = { type: 'spacer', id: 1 };
        expect(renderBlock(block)).toBe('<div style="height:32px"></div>');
      });
    });
  });

  describe('이미지 블록', () => {
    describe('img-full - 이미지 전폭', () => {
      it('src가 있으면 img 태그 렌더링', () => {
        const block: BlockData = { type: 'img-full', id: 1, src: 'https://example.com/img.jpg', cap: '' };
        expect(renderBlock(block)).toContain('<img src="https://example.com/img.jpg" alt="">');
      });

      it('cap이 있으면 캡션 추가', () => {
        const block: BlockData = { type: 'img-full', id: 1, src: 'https://example.com/img.jpg', cap: '사진 설명' };
        expect(renderBlock(block)).toContain('<div class="test-cap">사진 설명</div>');
      });

      it('src가 없으면 빈 문자열', () => {
        const block: BlockData = { type: 'img-full', id: 1, src: '', cap: '캡션' };
        expect(renderBlock(block)).toBe('');
      });

      it('위험한 src는 제거됨', () => {
        const block: BlockData = { type: 'img-full', id: 1, src: 'javascript:alert(1)', cap: '' };
        expect(renderBlock(block)).toBe('<div class="test-imgf"><img src="" alt=""></div>');
      });
    });

    describe('img-inline - 이미지 본문폭', () => {
      it('size=small이면 width 50%', () => {
        const block: BlockData = { type: 'img-inline', id: 1, src: 'https://example.com/img.jpg', size: 'small', cap: '' };
        expect(renderBlock(block)).toContain('width:50%');
      });

      it('size=medium이면 width 70%', () => {
        const block: BlockData = { type: 'img-inline', id: 1, src: 'https://example.com/img.jpg', size: 'medium', cap: '' };
        expect(renderBlock(block)).toContain('width:70%');
      });

      it('size=full이면 width 100%', () => {
        const block: BlockData = { type: 'img-inline', id: 1, src: 'https://example.com/img.jpg', size: 'full', cap: '' };
        expect(renderBlock(block)).toContain('width:100%');
      });

      it('src가 없으면 빈 문자열', () => {
        const block: BlockData = { type: 'img-inline', id: 1, src: '', size: 'full', cap: '' };
        expect(renderBlock(block)).toBe('');
      });
    });

    describe('img-pair - 이미지 2장', () => {
      it('src1, src2 모두 있으면 두 이미지 렌더링', () => {
        const block: BlockData = { type: 'img-pair', id: 1, src1: 'https://example.com/1.jpg', src2: 'https://example.com/2.jpg', cap: '' };
        const html = renderBlock(block);
        expect(html).toContain('https://example.com/1.jpg');
        expect(html).toContain('https://example.com/2.jpg');
      });

      it('src1만 있어도 렌더링', () => {
        const block: BlockData = { type: 'img-pair', id: 1, src1: 'https://example.com/1.jpg', src2: '', cap: '' };
        expect(renderBlock(block)).toContain('https://example.com/1.jpg');
      });

      it('src2만 있어도 렌더링', () => {
        const block: BlockData = { type: 'img-pair', id: 1, src1: '', src2: 'https://example.com/2.jpg', cap: '' };
        expect(renderBlock(block)).toContain('https://example.com/2.jpg');
      });

      it('둘 다 없으면 빈 문자열', () => {
        const block: BlockData = { type: 'img-pair', id: 1, src1: '', src2: '', cap: '' };
        expect(renderBlock(block)).toBe('');
      });

      it('cap이 있으면 캡션 추가', () => {
        const block: BlockData = { type: 'img-pair', id: 1, src1: 'https://example.com/1.jpg', src2: '', cap: '두 사진' };
        expect(renderBlock(block)).toContain('<div class="test-cap">두 사진</div>');
      });
    });

    describe('gallery - 갤러리 3장', () => {
      it('3개 이미지 모두 렌더링', () => {
        const block: BlockData = {
          type: 'gallery',
          id: 1,
          src1: 'https://example.com/1.jpg',
          src2: 'https://example.com/2.jpg',
          src3: 'https://example.com/3.jpg',
          cap: ''
        };
        const html = renderBlock(block);
        expect(html).toContain('https://example.com/1.jpg');
        expect(html).toContain('https://example.com/2.jpg');
        expect(html).toContain('https://example.com/3.jpg');
      });

      it('일부 이미지만 있어도 렌더링', () => {
        const block: BlockData = {
          type: 'gallery',
          id: 1,
          src1: 'https://example.com/1.jpg',
          src2: '',
          src3: '',
          cap: ''
        };
        const html = renderBlock(block);
        expect(html).toContain('https://example.com/1.jpg');
      });

      it('캡션도 렌더링 가능', () => {
        const block: BlockData = {
          type: 'gallery',
          id: 1,
          src1: 'https://example.com/1.jpg',
          src2: '',
          src3: '',
          cap: '갤러리 캡션'
        };
        expect(renderBlock(block)).toContain('<div class="test-cap">갤러리 캡션</div>');
      });
    });

    describe('img-text - 인물 소개', () => {
      it('src와 name만 있으면 렌더링', () => {
        const block: BlockData = {
          type: 'img-text',
          id: 1,
          src: 'https://example.com/profile.jpg',
          name: '홍길동',
          role: '',
          bio: ''
        };
        const html = renderBlock(block);
        expect(html).toContain('<div class="test-nm">홍길동</div>');
      });

      it('role과 bio도 함께 렌더링', () => {
        const block: BlockData = {
          type: 'img-text',
          id: 1,
          src: 'https://example.com/profile.jpg',
          name: '홍길동',
          role: '감독',
          bio: '약력 설명'
        };
        const html = renderBlock(block);
        expect(html).toContain('<div class="test-rl">감독</div>');
        expect(html).toContain('<div class="test-bio">약력 설명</div>');
      });

      it('src 없으면 name이 있어도 렌더링', () => {
        const block: BlockData = {
          type: 'img-text',
          id: 1,
          src: '',
          name: '홍길동',
          role: '',
          bio: ''
        };
        const html = renderBlock(block);
        expect(html).toContain('<div class="test-nm">홍길동</div>');
      });

      it('name도 없으면 빈 문자열', () => {
        const block: BlockData = {
          type: 'img-text',
          id: 1,
          src: '',
          name: '',
          role: '',
          bio: ''
        };
        expect(renderBlock(block)).toBe('');
      });

      it('bio의 줄바꿈이 <br>로 변환됨', () => {
        const block: BlockData = {
          type: 'img-text',
          id: 1,
          src: '',
          name: '홍길동',
          role: '',
          bio: '줄1\n줄2'
        };
        expect(renderBlock(block)).toContain('줄1<br>줄2');
      });
    });
  });

  describe('인용 및 정보 블록', () => {
    describe('quote - 인용문', () => {
      it('text와 attr이 함께 렌더링', () => {
        const block: BlockData = { type: 'quote', id: 1, text: '인용문 내용', attr: '출처' };
        const html = renderBlock(block);
        expect(html).toContain('<p>인용문 내용</p>');
        expect(html).toContain('<div class="test-at">출처</div>');
      });

      it('attr이 없으면 생략', () => {
        const block: BlockData = { type: 'quote', id: 1, text: '인용문 내용', attr: '' };
        expect(renderBlock(block)).not.toContain('<div class="test-at">');
      });

      it('text가 없으면 빈 문자열', () => {
        const block: BlockData = { type: 'quote', id: 1, text: '', attr: '출처' };
        expect(renderBlock(block)).toBe('');
      });

      it('text의 줄바꿈이 <br>로 변환됨', () => {
        const block: BlockData = { type: 'quote', id: 1, text: '줄1\n줄2', attr: '' };
        expect(renderBlock(block)).toContain('줄1<br>줄2');
      });
    });

    describe('quote-large - 인용문 대형', () => {
      it('&ldquo; 마커와 함께 렌더링', () => {
        const block: BlockData = { type: 'quote-large', id: 1, text: '큰 인용', attr: '' };
        expect(renderBlock(block)).toContain('&ldquo;');
        expect(renderBlock(block)).toContain('큰 인용');
      });

      it('attr이 있으면 함께 렌더링', () => {
        const block: BlockData = { type: 'quote-large', id: 1, text: '큰 인용', attr: '저자' };
        expect(renderBlock(block)).toContain('저자');
      });

      it('text가 없으면 빈 문자열', () => {
        const block: BlockData = { type: 'quote-large', id: 1, text: '', attr: '저자' };
        expect(renderBlock(block)).toBe('');
      });
    });

    describe('stats - 숫자 하이라이트', () => {
      it('items 배열로 여러 항목 렌더링', () => {
        const block: BlockData = {
          type: 'stats',
          id: 1,
          items: [
            { num: '100', label: '회' },
            { num: '1,000', label: '명' }
          ]
        };
        const html = renderBlock(block);
        expect(html).toContain('100');
        expect(html).toContain('회');
        expect(html).toContain('1,000');
        expect(html).toContain('명');
      });

      it('num이 비어있으면 — 기호로 표시', () => {
        const block: BlockData = {
          type: 'stats',
          id: 1,
          items: [
            { num: '', label: '표시 없음' }
          ]
        };
        expect(renderBlock(block)).toContain('—');
      });

      it('items가 없으면 빈 문자열', () => {
        const block: BlockData = { type: 'stats', id: 1, items: [] };
        expect(renderBlock(block)).toBe('');
      });
    });

    describe('infobox - 정보 박스', () => {
      it('label과 items 렌더링', () => {
        const block: BlockData = {
          type: 'infobox',
          id: 1,
          label: '정보',
          items: [
            { k: '키', v: '값' }
          ]
        };
        const html = renderBlock(block);
        expect(html).toContain('정보');
        expect(html).toContain('<strong>키</strong>');
        expect(html).toContain('값');
      });

      it('label이 없으면 "Info" 기본값', () => {
        const block: BlockData = {
          type: 'infobox',
          id: 1,
          label: '',
          items: []
        };
        expect(renderBlock(block)).toContain('Info');
      });
    });

    describe('callout - 강조 박스', () => {
      it('title과 text 렌더링', () => {
        const block: BlockData = { type: 'callout', id: 1, title: '주의', text: '중요한 내용' };
        const html = renderBlock(block);
        expect(html).toContain('<div class="test-ct">주의</div>');
        expect(html).toContain('중요한 내용');
      });

      it('title이 없으면 생략', () => {
        const block: BlockData = { type: 'callout', id: 1, title: '', text: '내용' };
        expect(renderBlock(block)).not.toContain('<div class="test-ct">');
      });

      it('text가 없으면 빈 문자열', () => {
        const block: BlockData = { type: 'callout', id: 1, title: '제목', text: '' };
        expect(renderBlock(block)).toBe('');
      });

      it('text의 줄바꿈이 <br>로 변환됨', () => {
        const block: BlockData = { type: 'callout', id: 1, title: '', text: '줄1\n줄2' };
        expect(renderBlock(block)).toContain('줄1<br>줄2');
      });
    });
  });

  describe('카드/리스트 블록', () => {
    describe('numcards - 넘버 카드', () => {
      it('번호가 01, 02로 패딩됨', () => {
        const block: BlockData = {
          type: 'numcards',
          id: 1,
          items: [
            { title: '첫 번째', desc: '' },
            { title: '두 번째', desc: '' }
          ]
        };
        const html = renderBlock(block);
        expect(html).toContain('01');
        expect(html).toContain('02');
      });

      it('title과 desc 렌더링', () => {
        const block: BlockData = {
          type: 'numcards',
          id: 1,
          items: [
            { title: '제목', desc: '설명' }
          ]
        };
        const html = renderBlock(block);
        expect(html).toContain('<h3>제목</h3>');
        expect(html).toContain('<p>설명</p>');
      });

      it('items가 없으면 빈 문자열', () => {
        const block: BlockData = { type: 'numcards', id: 1, items: [] };
        expect(renderBlock(block)).toBe('');
      });
    });

    describe('qa - Q&A', () => {
      it('질문과 답변 렌더링', () => {
        const block: BlockData = { type: 'qa', id: 1, q: '질문?', a: '답변.' };
        const html = renderBlock(block);
        expect(html).toContain('질문?');
        expect(html).toContain('답변.');
      });

      it('질문만 있어도 렌더링', () => {
        const block: BlockData = { type: 'qa', id: 1, q: '질문?', a: '' };
        expect(renderBlock(block)).toContain('질문?');
      });

      it('답변만 있어도 렌더링', () => {
        const block: BlockData = { type: 'qa', id: 1, q: '', a: '답변.' };
        expect(renderBlock(block)).toContain('답변.');
      });

      it('둘 다 없으면 빈 문자열', () => {
        const block: BlockData = { type: 'qa', id: 1, q: '', a: '' };
        expect(renderBlock(block)).toBe('');
      });

      it('답변의 줄바꿈이 <br>로 변환됨', () => {
        const block: BlockData = { type: 'qa', id: 1, q: '', a: '줄1\n줄2' };
        expect(renderBlock(block)).toContain('줄1<br>줄2');
      });
    });

    describe('press-list - 보도 목록', () => {
      it('src, title, date, ex 렌더링', () => {
        const block: BlockData = {
          type: 'press-list',
          id: 1,
          items: [
            { src: '중앙일보', date: '2024.01.01', title: '기사제목', ex: '요약', link: '' }
          ]
        };
        const html = renderBlock(block);
        expect(html).toContain('중앙일보');
        expect(html).toContain('2024.01.01');
        expect(html).toContain('기사제목');
        expect(html).toContain('요약');
      });

      it('link가 있으면 href 추가', () => {
        const block: BlockData = {
          type: 'press-list',
          id: 1,
          items: [
            { src: '언론', date: '', title: '제목', ex: '', link: 'https://example.com' }
          ]
        };
        expect(renderBlock(block)).toContain('href="https://example.com"');
      });

      it('src와 title 모두 없으면 skip', () => {
        const block: BlockData = {
          type: 'press-list',
          id: 1,
          items: [
            { src: '', date: '', title: '', ex: '', link: '' }
          ]
        };
        expect(renderBlock(block)).toBe('<div class="test-pl"></div>');
      });

      it('items가 없으면 빈 문자열', () => {
        const block: BlockData = { type: 'press-list', id: 1, items: [] };
        expect(renderBlock(block)).toBe('');
      });
    });

    describe('timeline - 타임라인', () => {
      it('date, title, desc 렌더링', () => {
        const block: BlockData = {
          type: 'timeline',
          id: 1,
          items: [
            { date: '2024년', title: '일정', desc: '설명' }
          ]
        };
        const html = renderBlock(block);
        expect(html).toContain('2024년');
        expect(html).toContain('일정');
        expect(html).toContain('설명');
      });

      it('일부 필드만 있어도 렌더링', () => {
        const block: BlockData = {
          type: 'timeline',
          id: 1,
          items: [
            { date: '2024년', title: '', desc: '' }
          ]
        };
        expect(renderBlock(block)).toContain('2024년');
      });

      it('items가 없으면 빈 문자열', () => {
        const block: BlockData = { type: 'timeline', id: 1, items: [] };
        expect(renderBlock(block)).toBe('');
      });
    });
  });

  describe('미디어 및 CTA 블록', () => {
    describe('video - 영상', () => {
      it('url이 있으면 iframe으로 렌더링', () => {
        const block: BlockData = { type: 'video', id: 1, url: 'https://youtube.com/embed/abc', cap: '' };
        expect(renderBlock(block)).toContain('iframe');
        expect(renderBlock(block)).toContain('https://youtube.com/embed/abc');
      });

      it('cap이 있으면 캡션 추가', () => {
        const block: BlockData = { type: 'video', id: 1, url: 'https://youtube.com/embed/abc', cap: '영상 설명' };
        expect(renderBlock(block)).toContain('<div class="test-cap">영상 설명</div>');
      });

      it('url이 없으면 빈 문자열', () => {
        const block: BlockData = { type: 'video', id: 1, url: '', cap: '캡션' };
        expect(renderBlock(block)).toBe('');
      });

      it('위험한 url은 제거됨', () => {
        const block: BlockData = { type: 'video', id: 1, url: 'javascript:alert(1)', cap: '' };
        expect(renderBlock(block)).toBe('<div class="test-vid"><div class="test-vw"><iframe src="" allowfullscreen></iframe></div></div>');
      });
    });

    describe('cta - CTA 버튼', () => {
      it('text와 label이 함께 렌더링', () => {
        const block: BlockData = { type: 'cta', id: 1, text: '클릭하세요', label: '더보기', url: 'https://example.com' };
        const html = renderBlock(block);
        expect(html).toContain('클릭하세요');
        expect(html).toContain('더보기');
        expect(html).toContain('href="https://example.com"');
      });

      it('label이 없으면 버튼 생략', () => {
        const block: BlockData = { type: 'cta', id: 1, text: '텍스트', label: '', url: '' };
        expect(renderBlock(block)).not.toContain('<a class="test-cta-btn"');
      });

      it('text가 없으면 label만 있어도 렌더링', () => {
        const block: BlockData = { type: 'cta', id: 1, text: '', label: '버튼', url: 'https://example.com' };
        expect(renderBlock(block)).toContain('버튼');
      });

      it('text와 label 모두 없으면 빈 문자열', () => {
        const block: BlockData = { type: 'cta', id: 1, text: '', label: '', url: '' };
        expect(renderBlock(block)).toBe('');
      });

      it('url이 없으면 href="#" 기본값', () => {
        const block: BlockData = { type: 'cta', id: 1, text: '', label: '버튼', url: '' };
        expect(renderBlock(block)).toContain('href="#"');
      });

      it('위험한 url은 제거됨', () => {
        const block: BlockData = { type: 'cta', id: 1, text: '', label: '버튼', url: 'javascript:alert(1)' };
        expect(renderBlock(block)).toContain('href=""');
      });
    });
  });

  describe('알 수 없는 블록 타입', () => {
    it('미지정 타입이면 빈 문자열', () => {
      const block: BlockData = { type: 'unknown-type' as any, id: 1 };
      expect(renderBlock(block)).toBe('');
    });
  });

  describe('CSS 클래스 프리픽스', () => {
    it('다른 프리픽스를 사용할 수 있음', () => {
      const customRenderer = createHtmlRenderer('custom-prefix');
      const block: BlockData = { type: 'paragraph', id: 1, text: '텍스트' };
      expect(customRenderer.renderBlock(block)).toBe('<p class="custom-prefix-p">텍스트</p>');
    });
  });

  describe('catClass - 카테고리 클래스', () => {
    it('infobox에 catClass가 추가됨', () => {
      const customRenderer = createHtmlRenderer('test', 'onstage');
      const block: BlockData = { type: 'infobox', id: 1, label: '정보', items: [] };
      expect(customRenderer.renderBlock(block)).toContain('test-lbl onstage');
    });

    it('cta에도 catClass가 추가됨', () => {
      const customRenderer = createHtmlRenderer('test', 'featured');
      const block: BlockData = { type: 'cta', id: 1, text: '텍스트', label: '버튼', url: '#' };
      expect(customRenderer.renderBlock(block)).toContain('test-cta featured');
    });
  });
});
