# @withwiz/block-editor 테스트 분류 체계

## 개요

| 항목 | 내용 |
|------|------|
| 대상 | `@withwiz/block-editor` 0.3.1 React 컴포넌트 라이브러리 |
| 범위 | src/ 전체 (core/, blocks/, components/, context/, hooks/, mini-editor/) |
| 기준 커밋 | `a483153` (chore(release): 0.3.1, develop). 문서 브랜치에는 병합 커밋 `d3a108f` 로 반영 |
| 환경 | Vitest 4.1.7 + jsdom 29.1.1 + @testing-library/react 16.3.2 + React 19.2.6 |
| 전역 설정 | `__tests__/setup.ts`: jest-dom, matchMedia·IntersectionObserver·ResizeObserver mock, `vi.useFakeTimers({ shouldAdvanceTime: true })` 전역 적용 |
| 실측 결과 (2026-09-15) | `npm ci` 후 `npm test`(`vitest run`) 실행: 파일 23개, 테스트 525개 (통과 499, 실패 0, 스킵 0, todo 26), 소요 1.94s. 같은 날 첫 실행(JSON 리포터)에서는 PERF-002 1건이 측정 편차로 실패했고 단독·전체 재실행에서 통과했다 (TC-P-003 비고) |
| 목표 커버리지 | `vitest.config.ts` 기재값: Stmts 85%, Lines 85%, Funcs 85%, Branches 80% (측정 불가 사유는 "테스트 커버리지 목표" 절 참조) |
| 문서 이력 | 2026-03-04 `docs/plans/2026-03-04-test-classification.md` 로 최초 작성. 2026-09-13 `docs/testing/test-classification.md` 로 이동하고 0.3.0 코드 기준으로 전면 갱신. 2026-09-15 develop(0.3.1) 병합 후 속성 주입 수정과 신규 보안 테스트 기준으로 갱신 |

**버전별 변경 반영 범위**

| 버전 | 커밋 | 테스트 분류에 반영한 변경 |
|------|------|------------------------|
| 0.1.x | `73fa209` 등 | ArtistEditor·ImageUploadField·BlockEditor·BlockRenderer 는 첫 커밋(2026-03-03)부터 존재했으나 2026-03-04 문서에는 빠져 있었다 |
| 0.2.0 | `fd8a97b`~`f97493c` | MiniEditor(toolbar-config, useRichText, MiniEditor) 추가와 하드닝 7종 |
| 0.2.0 | `ebdd83c`, `ebacfd0` | 렌더러 시맨틱 HTML 개선 (subheading → `h2`, 이미지·영상 → `figure`/`figcaption`, 인용 → `blockquote`, 캡션 → `alt`) |
| 0.2.0 | `5c037cc`, `cec4b9e` | useImageDropZone maxFiles 안내 수정, Provider·image-resize·ArtistEditor·MiniEditor 여정·PERF-002 테스트 추가 |
| 0.3.0 | `709f130` | BlockPreviewTheme 추가 (테스트 없음) |
| 0.3.1 | `977be3f`, `a483153` | `h()` 가 `"`·`'` 도 이스케이프 (`hAttr()` 는 `h()` 를 그대로 반환), `linkify()` href 값 따옴표 이스케이프, ArtistEditor 미리보기·onChange HTML 이미지 src 에 `sanitizeImageSrc()` + `hAttr()` 적용. `__tests__/security/attribute-injection.test.tsx` (SEC-007~009, 15건) 추가, `html-renderer.test.ts` 기대값 1건 변경·9건 추가 |

### 표기 규칙

| 항목 | 규칙 |
|------|------|
| 시나리오 ID | `SC-{도메인}-{3자리 번호}` |
| 케이스 ID | `TC-{도메인}-{3자리 번호}`. 각 TC 속성 표의 **시나리오** 행에 상위 SC 를 명시한다 |
| 도메인 약어 | Unit `U`, Integration `I`, API `A`, E2E `E`, Security `S`, Performance `P`, Accessibility `AC`, Smoke `SM`, Load/Stress `L`, Chaos `C` |
| 상태 | ✅ 완료: 테스트가 존재하고 통과한다. 🔲 계획: 실제 단언을 가진 테스트가 없다 |
| 테스트 수 | 해당 TC 에 속한 `it`/`it.todo` 개수를 2026-09-15 실측 JSON 리포트 기준으로 기재한다 |
| 단계 표 근거 | ✅ 완료 TC 는 실제 테스트 이름과 단언에서 대표 항목을 뽑는다. 🔲 계획 TC 는 소스 코드 동작에 근거한다 |

---

## 시나리오 목록

| ID | 시나리오 | 유형 | 우선순위 | 상태 |
|----|---------|------|---------|------|
| SC-U-001 | HTML 이스케이핑 함수 검증 | Unit | Critical | ✅ 완료 |
| SC-U-002 | 직렬화/역직렬화 기능 검증 | Unit | Critical | ✅ 완료 |
| SC-U-003 | 22개 내장 블록 정의 검증 | Unit | High | ✅ 완료 |
| SC-U-004 | 모든 블록 타입 HTML 렌더링 검증 | Unit | High | ✅ 완료 |
| SC-U-005 | 이미지 유효성 검사 (sync) | Unit | High | ✅ 완료 |
| SC-U-006 | 이미지 유효성 검사 (async, magic number) | Unit | High | ✅ 완료 |
| SC-U-007 | 이미지 리사이즈 로직 (Canvas API 모킹) | Unit | High | 🔲 계획 |
| SC-U-008 | BlockEditorProvider 컨텍스트 제공 | Unit | Medium | ✅ 완료 |
| SC-U-009 | BlockRenderer 에디터 폼 렌더링 | Unit | Medium | 🔲 계획 |
| SC-U-010 | useImageDropZone hook 동작 | Unit | Medium | ✅ 완료 |
| SC-U-011 | 이미지 리사이즈 조기 반환 분기 (임계값 이하·GIF) | Unit | Medium | ✅ 완료 |
| SC-U-012 | MiniEditor 툴바 버튼 구성 (TOOLBAR_GROUPS) | Unit | Low | ✅ 완료 |
| SC-U-013 | useRichText 서식 명령·상태 hook | Unit | Medium | ✅ 완료 |
| SC-U-014 | MiniEditor 컴포넌트 기본 렌더링 | Unit | Medium | ✅ 완료 |
| SC-U-015 | MiniEditor 폼·IME·sanitize·placeholder·ref 회귀 방지 | Unit | High | ✅ 완료 |
| SC-U-016 | MiniEditor 접근성 속성·서식 단축키 회귀 방지 | Unit | High | ✅ 완료 |
| SC-U-017 | ImageUploadField 업로드 필드 동작 | Unit | High | 🔲 계획 |
| SC-U-018 | BlockPreviewTheme 스타일 주입 | Unit | Medium | 🔲 계획 |
| SC-U-019 | URL 자동 링크 변환 (linkify) href 따옴표 이스케이프 | Unit | Critical | ✅ 완료 |
| SC-I-001 | 블록 렌더러 → HTML 출력 파이프라인 | Integration | Critical | ✅ 완료 |
| SC-I-002 | 이미지 처리 파이프라인 | Integration | High | ✅ 완료 |
| SC-I-003 | 멀티 블록 타입 혼합 렌더링 | Integration | High | ✅ 완료 |
| SC-I-004 | XSS 방어 통합 시나리오 | Integration | Critical | ✅ 완료 |
| SC-I-005 | 누락 필드·긴 텍스트·URL 특수문자 경계값 렌더링 | Integration | Medium | ✅ 완료 |
| SC-I-006 | ArtistEditor + BlockEditorProvider 사용자 흐름 | Integration | High | ✅ 완료 |
| SC-I-007 | BlockEditor 편집 흐름 (블록 조작 → onChange 출력) | Integration | High | 🔲 계획 |
| SC-A-001 | JWT 인증 성공 이미지 업로드 | API | Critical | ✅ 완료 |
| SC-A-002 | JWT 만료/미인증 → 401 에러 처리 | API | Critical | ✅ 완료 |
| SC-A-003 | 파일 크기 초과 → 클라이언트 사전 차단 | API | High | 🔲 계획 |
| SC-A-004 | 비허용 MIME 타입 → 클라이언트 거부 | API | High | ✅ 완료 |
| SC-A-005 | UploadResult key 필드 계약 검증 | API | High | ✅ 완료 |
| SC-A-006 | 네트워크 오류 → 에러 상태 복원 | API | Medium | ✅ 완료 |
| SC-A-007 | disabled 상태 → 업로드 차단 | API | Medium | ✅ 완료 |
| SC-A-008 | UploadResult url 누락·빈 문자열 처리 | API | Medium | 🔲 계획 |
| SC-E-001 | 블록 데이터 → 직렬화 → 역직렬화 → 렌더링 풀 사이클 | E2E | Critical | ✅ 완료 |
| SC-E-002 | 렌더러 HTML 출력을 DOM 에 마운트하여 검증 | E2E | High | ✅ 완료 |
| SC-E-003 | MiniEditor 사용자 편집 여정 | E2E | High | ✅ 완료 |
| SC-S-001 | XSS 공격 방어 (텍스트 콘텐츠) | Security | Critical | ✅ 완료 |
| SC-S-002 | 파일 업로드 보안 검증 | Security | Critical | ✅ 완료 |
| SC-S-003 | 본문 URL 자동 링크 변환 속성 주입 차단 | Security | Critical | ✅ 완료 |
| SC-S-004 | ArtistEditor 이미지 src 속성 주입 차단 | Security | Critical | ✅ 완료 |
| SC-S-005 | ArtistEditor 업로드 파일 클라이언트 검증 | Security | High | 🔲 계획 |
| SC-S-006 | MiniEditor sanitize 미지정 시 HTML 주입 계약 | Security | Medium | 🔲 계획 |
| SC-P-001 | 대량 블록 렌더링 성능 | Performance | High | ✅ 완료 |
| SC-P-002 | 렌더링 출력 크기 최적화 | Performance | Low | ✅ 완료 |
| SC-P-003 | serializer·renderer 마이크로 벤치마크 (p95) | Performance | High | ✅ 완료 |
| SC-P-004 | PERF-001 시간 측정을 실제 타이머 기준으로 교정 | Performance | High | 🔲 계획 |
| SC-AC-001 | WCAG 2.1 AA 준수 검증 | Accessibility | High | ✅ 완료 |
| SC-AC-002 | 이미지 대체 텍스트 요구사항 | Accessibility | High | ✅ 완료 |
| SC-AC-003 | 링크 텍스트 명확성 | Accessibility | Medium | ✅ 완료 |
| SC-AC-004 | 렌더러 출력 스타일 가드 (대비·글자 크기·outline) | Accessibility | Medium | ✅ 완료 |
| SC-AC-005 | 키보드 탐색·폼 접근성 위임 항목 | Accessibility | Medium | 🔲 계획 |
| SC-AC-006 | ImageUploadField 파일 입력 레이블 연결 | Accessibility | High | 🔲 계획 |
| SC-AC-007 | ImageUploadField 키보드 조작 | Accessibility | High | 🔲 계획 |
| SC-AC-008 | ImageUploadField 오류·진행 상태 안내 | Accessibility | Medium | 🔲 계획 |
| SC-AC-009 | video 블록 iframe title 속성 | Accessibility | Medium | 🔲 계획 |
| SC-AC-010 | BlockEditor·BlockRenderer·ArtistEditor 편집 컨트롤 접근 가능한 이름 | Accessibility | Medium | 🔲 계획 |
| SC-SM-001 | exports 서브패스 18개 해석·로드 | Smoke | High | 🔲 계획 |
| SC-SM-002 | 루트 엔트리 런타임 export 목록 고정 | Smoke | Medium | 🔲 계획 |

---

## 1. Unit Tests (단위 테스트)

**목적:** 개별 함수·hook·컴포넌트를 독립적으로 검증한다. 외부 의존성은 mock 또는 Provider 로 대체한다.

**실행 명령:** `npm run test:unit`

---

### TC-U-001: HTML 이스케이핑 함수 (h, nl2br, hAttr)

| 항목 | 내용 |
|------|------|
| **시나리오** | SC-U-001 |
| **파일** | `__tests__/unit/core/html-renderer.test.ts` (`h()`·`nl2br()`·`hAttr()` describe) |
| **대상** | `src/core/html-renderer.ts`: `h()`, `nl2br()`, `hAttr()` |
| **우선순위** | Critical |
| **전제조건** | 없음 (순수 함수) |
| **테스트 데이터** | `'Tom & Jerry'`, `'<script>'`, `'안녕 "하세요"'`, `"it's"`, `'첫 줄\r\n둘째 줄'`, `'see https://x.com/"onmouseover="alert(1) now'` |

| # | 단계 | 예상 결과 |
|---|------|---------|
| 1 | `h('Tom & Jerry')` 호출 | `'Tom &amp; Jerry'` 반환 |
| 2 | `h('<script>')` 호출 | `'&lt;script&gt;'` 반환 |
| 3 | `h('안녕 "하세요"')` / `h("it's")` 호출 | `'안녕 &quot;하세요&quot;'` / `'it&#39;s'` 반환 |
| 4 | `` h(`"&'`) `` 호출 | `'&quot;&amp;&#39;'` 반환 (`&` 를 먼저 처리하므로 따옴표 엔티티가 이중 이스케이프되지 않음) |
| 5 | `h(null)`, `h(undefined)` 호출 | `''` 반환 |
| 6 | `nl2br('첫 줄\r\n둘째 줄')` 호출 | `'첫 줄<br>둘째 줄'` 반환 |
| 7 | `nl2br('see https://x.com/"onmouseover="alert(1) now')` 호출 | `href` 값과 링크 텍스트가 모두 `https://x.com/&quot;onmouseover=&quot;alert(1)` 인 `<a ... target="_blank" rel="noopener noreferrer">` 1개로 변환 (따옴표가 href 를 끊지 못함) |
| 8 | `hAttr('<img src="test" />')` 호출 | `'&lt;img src=&quot;test&quot; /&gt;'` 반환 |
| 9 | `` hAttr(`a "b" 'c' &`) `` 호출 | `'a &quot;b&quot; &#39;c&#39; &amp;'` 반환, `&amp;quot;`·`&amp;#39;` 미포함 |

- **자동화:** 가능 ✅ | **테스트 수:** 21개 (2026-09-15 실측: h 9, nl2br 6, hAttr 6)
- **비고:** 0.3.1 (`977be3f`) 에서 `h()` 가 큰따옴표·작은따옴표도 이스케이프하도록 바뀌었다. 3단계 기대값이 `'안녕 "하세요"'` 에서 `'안녕 &quot;하세요&quot;'` 로 바뀌었고 테스트 이름도 `큰따옴표는 이스케이핑하지 않음 (nl2br에서 처리)` 에서 `큰따옴표를 &quot;로 변환 (속성 주입 방어)` 로 바뀌었다. `hAttr()` 는 이제 `h()` 를 그대로 반환하므로 두 함수 출력이 같다. 같은 버전에서 h 2건(3단계 작은따옴표, 4단계), nl2br 1건(7단계), hAttr 2건(작은따옴표 변환, 9단계)이 추가되었다. `linkify()` 단독 검증은 TC-U-020, 블록 경유 속성 주입 검증은 TC-S-003 에서 다룬다.

---

### TC-U-002: URL 새니타이저 (sanitizeUrl, sanitizeImageSrc)

| 항목 | 내용 |
|------|------|
| **시나리오** | SC-U-001 |
| **파일** | `__tests__/unit/core/html-renderer.test.ts` (`sanitizeUrl()`·`sanitizeImageSrc()` describe) |
| **대상** | `src/core/html-renderer.ts`: `sanitizeUrl()`, `sanitizeImageSrc()` |
| **우선순위** | Critical |

| # | 단계 | 예상 결과 |
|---|------|---------|
| 1 | `sanitizeUrl('javascript:alert("xss")')` | `''` 반환 |
| 2 | `sanitizeUrl('JAVASCRIPT:alert(1)')`, `sanitizeUrl('Javascript:alert(1)')` | 모두 `''` 반환 (대소문자 무시) |
| 3 | `sanitizeUrl('file:///etc/passwd')` | `''` 반환 |
| 4 | `sanitizeUrl('https://example.com" onclick="alert(1)')` | `''` 반환 (속성 주입 차단) |
| 5 | `sanitizeUrl('  https://example.com  ')` | `'https://example.com'` 반환 (앞뒤 공백 제거) |
| 6 | `sanitizeImageSrc('test<svg>alert</svg>.jpg')`, `sanitizeImageSrc('images/photo.png')` | `''` 반환 / 원본 상대 경로 반환 |

- **자동화:** 가능 ✅ | **테스트 수:** 33개 (2026-09-15 실측: sanitizeUrl 19, sanitizeImageSrc 14)

---

### TC-U-003: 직렬화/역직렬화 (createSerializer)

| 항목 | 내용 |
|------|------|
| **시나리오** | SC-U-002 |
| **파일** | `__tests__/unit/core/serializer.test.ts` |
| **대상** | `src/core/serializer.ts`: `createSerializer()` |
| **우선순위** | Critical |
| **테스트 데이터** | 마커 `BK_DATA_V1`, 라운드트립 케이스 13개, 커스텀 마커 `CUSTOM_MARKER_123`·`MARK_V1.0_-_TEST`, 100개 블록 |

| # | 단계 | 예상 결과 |
|---|------|---------|
| 1 | `serialize([{ type: 'paragraph', id: 1, text: 'Hello' }])` 호출 | `\n` 으로 시작하고 `<!-- BK_DATA_V1` 과 ` -->` 를 포함 |
| 2 | `deserialize(serialize(original))` 호출 | 원본 배열과 `toEqual` |
| 3 | 마커 없는 HTML 역직렬화 | `null` 반환 |
| 4 | `<!-- BK_DATA_V1INVALID_BASE64!!! -->` 역직렬화 | `null` 반환 (크래시 없음) |
| 5 | 다른 마커(`OTHER_MARKER`) 뒤에 올바른 마커가 있는 HTML | 올바른 마커 데이터만 복원 |
| 6 | 100개 블록 라운드트립 | 길이 100, 원본과 동일 |

- **자동화:** 가능 ✅ | **테스트 수:** 38개 (2026-09-15 실측)

---

### TC-U-004: 내장 블록 정의 (BUILT_IN_BLOCKS)

| 항목 | 내용 |
|------|------|
| **시나리오** | SC-U-003 |
| **파일** | `__tests__/unit/blocks/built-in.test.ts` |
| **대상** | `src/blocks/built-in.ts`: `BUILT_IN_BLOCKS`, `createEmptyBlock()`, `getBlockDef()` |
| **우선순위** | High |

| # | 단계 | 예상 결과 |
|---|------|---------|
| 1 | `BUILT_IN_BLOCKS` 길이 확인 | `22` |
| 2 | 모든 블록 `type` 고유성 확인 | `Set` 크기 22 |
| 3 | `getBlockDef('Paragraph')`, `getBlockDef('PARAGRAPH')` 호출 | 모두 `undefined` (대소문자 구분) |
| 4 | `createEmptyBlock('stats', 1)` 호출 | `items` 3개, 각 항목의 `num`·`label` 이 빈 문자열 |
| 5 | `createEmptyBlock('unknown-type', 1)` 호출 | 키가 `['type', 'id']` 뿐 |
| 6 | `createEmptyBlock('quote', 100)` 과 `getBlockDef('quote').createEmpty(100)` 비교 | 동일 객체 구조 |

- **자동화:** 가능 ✅ | **테스트 수:** 47개 (2026-09-15 실측)

---

### TC-U-005: 이미지 유효성 검사 sync (validateImageFile)

| 항목 | 내용 |
|------|------|
| **시나리오** | SC-U-005 |
| **파일** | `__tests__/unit/core/image-resize.test.ts` (`validateImageFile (sync wrapper, string \| null contract)` describe) |
| **대상** | `src/core/image-resize.ts`: `validateImageFile()` (`string \| null` 반환 래퍼) |
| **우선순위** | High |
| **테스트 데이터** | `size` 속성을 재정의한 11MB 파일, 파일명 `../evil.jpg`·`photo\0.jpg` |

| # | 단계 | 예상 결과 |
|---|------|---------|
| 1 | 정상 JPEG(`photo.jpg`) 검증 | `null` 반환 |
| 2 | `image/svg+xml` 파일 검증 | `SVG` 를 포함한 문자열 반환 |
| 3 | MIME 이 빈 문자열인 파일 검증 | `지정` 을 포함한 문자열 반환 |
| 4 | `application/pdf` 파일 검증 | `application/pdf` 를 포함한 문자열 반환 |
| 5 | 0 bytes 파일 / 11MB 파일 검증 | `비어` 포함 / `MB` 포함 문자열 반환 |
| 6 | `../evil.jpg` / `photo\0.jpg` 검증 | `경로` 포함 / `올바르지` 포함 문자열 반환 |

- **자동화:** 가능 ✅ | **테스트 수:** 8개 (2026-09-15 실측)
- **비고:** 2026-03-04 문서가 계획한 신규 파일 `image-resize-validate.test.ts` 는 만들어지지 않았고 `image-resize.test.ts` 에 구현되었다. 이중 확장자와 `hasMetadata` 는 TC-S-002 가 담당한다. GIF 입력 시 `hasMetadata: false` 분기는 어느 테스트도 검증하지 않는다.

---

### TC-U-006: 이미지 유효성 검사 async + magic number (validateImageFileAsync)

| 항목 | 내용 |
|------|------|
| **시나리오** | SC-U-006 |
| **파일** | `__tests__/unit/core/image-resize.test.ts` (`validateImageFileAsync (magic-number branches not covered by security suite)` describe) |
| **대상** | `src/core/image-resize.ts`: `validateImageFileAsync()` |
| **우선순위** | High |
| **전제조건** | jsdom 의 `File`·`ArrayBuffer` 사용 |
| **테스트 데이터** | GIF `47 49 46 38 39 61`, PNG `89 50 4e 47`, WebP `RIFF....WEBP` 12 bytes, `RIFF....AVI ` 12 bytes |

| # | 단계 | 예상 결과 |
|---|------|---------|
| 1 | GIF 시그니처 + `image/gif` | `{ valid: true }` |
| 2 | PNG 시그니처 + `image/gif` | `valid: false`, error 에 `GIF` 포함 |
| 3 | `RIFF....WEBP` + `image/webp` | `{ valid: true }` |
| 4 | `RIFF....AVI ` + `image/webp` | `valid: false`, error 에 `WebP` 포함 |
| 5 | SVG 파일 | sync 거부 결과를 그대로 반환 (error 에 `SVG` 포함) |
| 6 | `file.slice().arrayBuffer()` 가 reject 하도록 재정의 | `valid: false`, error 정의됨 |

- **자동화:** 가능 ✅ | **테스트 수:** 6개 (2026-09-15 실측)
- **비고:** JPEG·PNG 시그니처 일치/불일치는 TC-S-002 가 담당한다. 계획 파일명 `image-resize-async.test.ts` 대신 `image-resize.test.ts` 에 구현되었다.

---

### TC-U-007: 이미지 리사이즈 (resizeImageIfNeeded) 🔲 계획

| 항목 | 내용 |
|------|------|
| **시나리오** | SC-U-007 |
| **파일** | `__tests__/unit/core/image-resize.test.ts` (추가 예정) |
| **대상** | `src/core/image-resize.ts`: `resizeImageIfNeeded()` 의 Canvas 단계 (`loadImage`, `canvasToBlob`, `toResult`) |
| **우선순위** | High |
| **전제조건** | `Image`(onload/onerror), `URL.createObjectURL`/`revokeObjectURL`, `HTMLCanvasElement.getContext`·`toBlob` vi.mock 필요. jsdom canvas 는 stub 이므로 실제 픽셀 결과는 검증 대상이 아니다 |
| **테스트 데이터** | `size` 를 10MB·15MB 로 재정의한 JPEG·PNG·WebP, `toBlob` 이 반환할 Blob 크기 시퀀스 |

| # | 단계 | 예상 결과 |
|---|------|---------|
| 1 | 정확히 10MB(10×1024×1024 bytes) JPEG | `{ wasResized: false }`, 원본 반환 (`size <= RESIZE_THRESHOLD`) |
| 2 | 15MB JPEG, 첫 `toBlob` 결과 5MB | 1단계 품질 0.85 에서 종료, `{ wasResized: true, newSize: 5MB }` |
| 3 | 15MB JPEG, 1단계 5회(품질 0.85/0.75/0.65/0.55/0.5) 모두 10MB 초과 | 2단계 배율 0.9 부터 품질 0.75 로 재시도 |
| 4 | 1·2단계 모두 10MB 초과 | 마지막으로 배율 0.3·품질 0.5 결과를 크기와 무관하게 반환 |
| 5 | PNG 입력 | 출력 MIME `image/jpeg`, 파일명 확장자 `.jpg` |
| 6 | `my-photo.jpeg` JPEG 입력 / WebP 입력 | 출력 파일명 `my-photo.jpg` / 확장자 `.webp` |
| 7 | `getContext('2d')` 가 `null` / `toBlob` 콜백 인자가 `null` / `Image.onerror` 발생 | 각각 `이미지 처리에 실패했습니다.` / `이미지 변환에 실패했습니다.` / `이미지 로드에 실패했습니다.` 로 reject, `onerror` 경로에서도 `revokeObjectURL` 호출 |

- **자동화:** 가능 ✅ (Canvas API 전체 모킹 필요)
- **비고:** 조기 반환 분기(1KB JPEG, 15MB GIF)는 TC-U-012 로 완료되었다. 이 함수의 Canvas 단계는 `useImageDropZone` 경유로는 실행되지 않는다(TC-A-003 비고 참조). 공개 export 를 직접 호출하는 호스트 경로에서만 실행된다.

---

### TC-U-008: BlockEditorProvider 컨텍스트

| 항목 | 내용 |
|------|------|
| **시나리오** | SC-U-008 |
| **파일** | `__tests__/unit/context/BlockEditorProvider.test.tsx` |
| **대상** | `src/context/BlockEditorProvider.tsx`: `BlockEditorProvider`, `useBlockEditorContext()` |
| **우선순위** | Medium |
| **전제조건** | React + @testing-library/react `renderHook` |

| # | 단계 | 예상 결과 |
|---|------|---------|
| 1 | Provider 없이 `useBlockEditorContext()` 호출 | 메시지에 `BlockEditorProvider` 를 포함한 `Error` |
| 2 | `uploadImage` 만 전달 | `autoResize=true`, `maxSizeMB=10` |
| 3 | `onError` 미전달 | `onError === console.error` |
| 4 | 컨텍스트 `uploadImage` 참조 확인 후 File 로 호출 | 전달한 함수와 동일 참조, 1회 호출·File 인자·결과 `url` 전달 |
| 5 | 컨텍스트 `onError('업로드 실패')` 호출 | 소비자 콜백이 같은 메시지로 1회 호출 |
| 6 | `autoResize={false}`, `maxSizeMB={5}` 전달 | 컨텍스트에 `false`, `5` 반영 |

- **자동화:** 가능 ✅ | **테스트 수:** 7개 (2026-09-15 실측)

---

### TC-U-009: BlockRenderer 에디터 폼 🔲 계획

| 항목 | 내용 |
|------|------|
| **시나리오** | SC-U-009 |
| **파일** | `__tests__/unit/components/BlockRenderer.test.tsx` (신규) |
| **대상** | `src/components/BlockRenderer.tsx` (314줄, 테스트에서 import 하는 파일 0개) |
| **우선순위** | Medium |
| **전제조건** | `ImageUploadField` vi.mock (실제 컴포넌트는 Provider 가 필요하다) |

| # | 단계 | 예상 결과 |
|---|------|---------|
| 1 | `paragraph` 블록 렌더링 | `<textarea class="be-textarea">`, placeholder `본문 내용을 입력하세요.` |
| 2 | textarea 값 변경 | `updateBlock(id, 'text', 새값)` 호출 |
| 3 | `size` 가 없는 `spacer` 블록 렌더링 | `<select>` 값 `medium`, 옵션 3개 (small/medium/large) |
| 4 | `stats` 블록 items 2개 렌더링 후 두 번째 행 × 클릭 | `.be-stats-row` 2개, `removeSubItem(id, 1)` 호출 |
| 5 | `+ 항목 추가` 클릭 | `addSubItem(id, 'stats')` 호출 |
| 6 | `img-full` 블록 렌더링 후 mock 에 전달된 `onClear(blockId, 'src')` 실행 | mock 이 `blockId`·`field='src'` 를 받고, `updateBlock(id, 'src', '')` 호출 |
| 7 | `unknown` 타입 블록 | `null` 반환 |

- **자동화:** 가능 ✅
- **비고:** 추가·삭제 버튼(`be-add-row-btn`, `be-kv-delete`)에는 `type` 속성이 지정되어 있지 않다. 폼 제출 영향은 TC-I-007 8단계에서 검증한다.

---

### TC-U-010: useImageDropZone hook

| 항목 | 내용 |
|------|------|
| **시나리오** | SC-U-010 |
| **파일** | `__tests__/unit/hooks/useImageDropZone.test.tsx` |
| **대상** | `src/hooks/useImageDropZone.ts` |
| **우선순위** | Medium |
| **전제조건** | 실제 `BlockEditorProvider` 로 감싼다 (`autoResize=false`, `maxSizeMB=10`). 실제 `validateImageFile` 사용 |

| # | 단계 | 예상 결과 |
|---|------|---------|
| 1 | `types` 에 `Files` 가 있는 dragEnter 2회 → dragLeave 1회 → 1회 더 | `isDragOver` true → true → false (카운터 기반) |
| 2 | `multiple=false` 로 이미지 3개 drop | `uploadImage` 1회 (`a.jpg`), `onUpload` 1회 |
| 3 | `multiple=true, maxFiles=2` 로 3개 drop / `maxFiles=1` 에서 4000ms 경과 | 업로드 2회, error `최대 2개까지 업로드할 수 있습니다.` / 경과 후 error `null` |
| 4 | `handleFileInput` 에 JPEG + SVG 전달 | 업로드 0회, error 설정 (배치 전체 거부) |
| 5 | PDF 만 drop | 업로드 0회, error 에 `이미지` 포함 |
| 6 | `uploadImage` 가 `Error('서버가 거부함')` throw | error·Provider `onError` 모두 `서버가 거부함`, `isUploading=false` |

- **자동화:** 가능 ✅ | **테스트 수:** 20개 (2026-09-15 실측)
- **비고:** 파일 머리 주석에 명시된 대로 리사이즈 단계(`isResizing`, 크기 초과 메시지)는 실행하지 않는다. 해당 분기는 TC-A-003 에서 다룬다.

---

### TC-U-011: 블록 타입별 HTML 렌더링 (renderBlock)

| 항목 | 내용 |
|------|------|
| **시나리오** | SC-U-004 |
| **파일** | `__tests__/unit/core/html-renderer-blocks.test.ts` |
| **대상** | `src/core/html-renderer.ts`: `createHtmlRenderer().renderBlock()` 22개 타입 분기, prefix, `catClass` |
| **우선순위** | High |
| **테스트 데이터** | prefix `test`, 22개 타입별 describe |

| # | 단계 | 예상 결과 |
|---|------|---------|
| 1 | `lead` 블록 text `'<script>alert(1)</script>'` | `<div class="test-lead">&lt;script&gt;alert(1)&lt;/script&gt;</div>` |
| 2 | `subheading` 블록 text `'제목\n다음줄'` | `<h2 class="test-sh">제목\n다음줄</h2>` (줄바꿈 미변환) |
| 3 | `size` 가 없는 `spacer` 블록 | `<div style="height:32px"></div>` |
| 4 | `img-full` 블록 src `javascript:alert(1)` | `<figure class="test-imgf"><img src="" alt=""></figure>` |
| 5 | `video` 블록 url `javascript:alert(1)` | `<figure class="test-vid"><div class="test-vw"><iframe src="" allowfullscreen></iframe></div></figure>` |
| 6 | `cta` 블록 label 만 있고 url 빈 값 / `createHtmlRenderer('test', 'featured')` | `href="#"` 포함 / `test-cta featured` 포함 |

- **자동화:** 가능 ✅ | **테스트 수:** 85개 (2026-09-15 실측)
- **비고:** 2026-03-04 문서는 이 파일을 Unit 테스트 수(219)에 합산했지만 TC 로 기술하지 않았다.

---

### TC-U-012: 이미지 리사이즈 조기 반환 분기

| 항목 | 내용 |
|------|------|
| **시나리오** | SC-U-011 |
| **파일** | `__tests__/unit/core/image-resize.test.ts` (`resizeImageIfNeeded (early-return branches)` describe) |
| **대상** | `src/core/image-resize.ts`: `resizeImageIfNeeded()` 의 `RESIZE_THRESHOLD`·`SKIP_RESIZE_TYPES` 분기 |
| **우선순위** | Medium |

| # | 단계 | 예상 결과 |
|---|------|---------|
| 1 | 1KB JPEG 입력 | `wasResized: false`, `file` 이 원본과 같은 참조 |
| 2 | 1KB JPEG 결과 크기 확인 | `originalSize`·`newSize` 모두 `file.size` |
| 3 | `size` 를 15MB 로 재정의한 GIF 입력 | `wasResized: false`, 원본 참조, `originalSize`·`newSize` 모두 15MB |

- **자동화:** 가능 ✅ | **테스트 수:** 2개 (2026-09-15 실측, 전체 단언 기재)

---

### TC-U-013: MiniEditor 툴바 구성 (TOOLBAR_GROUPS)

| 항목 | 내용 |
|------|------|
| **시나리오** | SC-U-012 |
| **파일** | `__tests__/unit/mini-editor/toolbar-config.test.ts` |
| **대상** | `src/mini-editor/toolbar-config.ts`: `TOOLBAR_GROUPS` |
| **우선순위** | Low |

| # | 단계 | 예상 결과 |
|---|------|---------|
| 1 | 그룹 수 확인 | 3 |
| 2 | 그룹 0 `command` 목록 | `['bold', 'italic', 'strikeThrough']` |
| 3 | 그룹 1 `value` 목록 | `['h1', 'h2', 'h3']` |
| 4 | 그룹 2 구성 | `insertUnorderedList`, `insertOrderedList`, `formatBlock` 포함, 세 번째 `value` 는 `blockquote` |
| 5 | 모든 버튼 | `label`·`title` 존재 |

- **자동화:** 가능 ✅ | **테스트 수:** 5개 (2026-09-15 실측)
- **비고:** `ariaLabel` 필드 값은 이 파일에서 단언하지 않는다. 렌더링된 `aria-label` 은 TC-U-017 이 검증한다.

---

### TC-U-014: useRichText hook

| 항목 | 내용 |
|------|------|
| **시나리오** | SC-U-013 |
| **파일** | `__tests__/unit/mini-editor/useRichText.test.ts` |
| **대상** | `src/mini-editor/useRichText.ts` |
| **우선순위** | Medium |
| **전제조건** | `document.execCommand`·`queryCommandState`·`queryCommandValue` stub, `editorRef` 에 document 에 부착한 `contentEditable` div 지정 후 focus |

| # | 단계 | 예상 결과 |
|---|------|---------|
| 1 | `useRichText(undefined, undefined)` 반환값 확인 | `editorRef`, `formatState`, `execFormat`, `handleInput`, `handleCompositionStart`/`End` 제공 |
| 2 | 초기 `formatState` | bold·italic·strikeThrough·h1·insertUnorderedList·blockquote 모두 `false` |
| 3 | `execFormat('bold')` | `document.execCommand('bold', false, undefined)` 호출 |
| 4 | innerHTML `<p>hello</p>` 지정 후 `execFormat('bold')` | `onChange('<p>hello</p>')` |
| 5 | innerHTML `<p>world</p>` 지정 후 `handleInput()` | `onChange('<p>world</p>')` |
| 6 | `queryCommandState('bold')` 가 true 인 상태에서 `execFormat('bold')` | `formatState.bold === true` |

- **자동화:** 가능 ✅ | **테스트 수:** 6개 (2026-09-15 실측)

---

### TC-U-015: MiniEditor 기본 렌더링

| 항목 | 내용 |
|------|------|
| **시나리오** | SC-U-014 |
| **파일** | `__tests__/unit/mini-editor/MiniEditor.test.tsx` |
| **대상** | `src/mini-editor/MiniEditor.tsx` |
| **우선순위** | Medium |
| **전제조건** | `execCommand`·`queryCommand*` stub |

| # | 단계 | 예상 결과 |
|---|------|---------|
| 1 | 기본 렌더링 | `.bme-wrapper`, `.bme-toolbar`, `.bme-content` 존재 |
| 2 | 버튼·구분선 수 | `.bme-btn` 9개, `.bme-separator` 2개 |
| 3 | `placeholder="입력하세요"` | `.bme-content` 의 `data-placeholder="입력하세요"` |
| 4 | `className="my-custom"`, `minHeight={300}` | `.bme-wrapper.my-custom` 존재, `style.minHeight === '300px'` |
| 5 | `굵게` 버튼 mouseDown | `execCommand('bold', false, undefined)` 호출 |
| 6 | 에디터 focus 후 bold 활성 상태에서 `굵게` mouseDown | 버튼에 `bme-btn--active` 클래스 |

- **자동화:** 가능 ✅ | **테스트 수:** 8개 (2026-09-15 실측)
- **비고:** 테스트 이름 `calls onChange when toolbar button is clicked` 는 onChange 호출을 언급하지만 단언은 `execCommand` 호출만 확인한다.

---

### TC-U-016: MiniEditor 하드닝 회귀 방지 (폼·IME·sanitize·formatState·placeholder·ref)

| 항목 | 내용 |
|------|------|
| **시나리오** | SC-U-015 |
| **파일** | `__tests__/unit/mini-editor/MiniEditor.regressions.test.tsx` (Regression #1, #2, #3, #5, #6, #7) |
| **대상** | `src/mini-editor/MiniEditor.tsx`, `src/mini-editor/useRichText.ts` |
| **우선순위** | High |
| **전제조건** | `execCommand`·`queryCommand*` stub |

| # | 단계 | 예상 결과 |
|---|------|---------|
| 1 | `<form onSubmit>` 안에서 `굵게` 버튼 mouseDown·click | 모든 버튼 `type="button"`, onSubmit 미호출 |
| 2 | compositionStart → innerHTML `한글` → input → compositionEnd | 조합 중 onChange 0회, 종료 시 1회 (`한글`) / 조합 중 value prop 변경 시 DOM 유지 |
| 3 | `sanitize` prop (script 제거 함수 / 대문자 변환 함수) | 주입 결과 `<p>ok</p>` / onChange 인자 `<P>X</P>` |
| 4 | 포커스를 에디터 밖 input 에 두고 `handleInput()` | `queryCommandState` 가 true 여도 formatState 값이 모두 false |
| 5 | 빈 마운트 / `<p><br></p>` 입력 / 이미지만 입력 | `data-empty="true"` / `data-empty="true"` / 속성 제거 |
| 6 | `ref.clear()` / `ref.focus()` / `ref.getEditorElement()` | innerHTML `''`·onChange(`''`)·`data-empty="true"` / activeElement 가 편집 영역 / contenteditable div 반환 |

- **자동화:** 가능 ✅ | **테스트 수:** 16개 (2026-09-15 실측: #1 2, #2 3, #3 2, #5 1, #6 4, #7 4)

---

### TC-U-017: MiniEditor 접근성 속성·서식 단축키

| 항목 | 내용 |
|------|------|
| **시나리오** | SC-U-016 |
| **파일** | `__tests__/unit/mini-editor/MiniEditor.regressions.test.tsx` (Regression #4) |
| **대상** | `src/mini-editor/MiniEditor.tsx`: `role`/`aria-*` 속성, `handleKeyDown` |
| **우선순위** | High |
| **기준** | WCAG 2.1 SC 4.1.2 (Name, Role, Value), SC 2.1.1 (Keyboard) |

| # | 단계 | 예상 결과 |
|---|------|---------|
| 1 | 툴바 렌더링 | `role="toolbar"`, `aria-label` 존재 |
| 2 | `ariaLabel="뉴스 본문"` 전달 | 편집 영역 `role="textbox"`, `aria-multiline="true"`, `aria-label="뉴스 본문"` |
| 3 | 모든 툴바 버튼 확인 | `aria-label` 존재, `aria-pressed="false"` |
| 4 | italic 활성 상태에서 `기울임` mouseDown | `aria-pressed="true"` |
| 5 | Ctrl+b / Ctrl+i / Ctrl+s keyDown | `execCommand` 가 `bold` / `italic` / `strikeThrough` 로 호출 |
| 6 | Cmd+B (metaKey) / Ctrl+Alt+B keyDown | bold 실행 / `execCommand` 미호출 |

- **자동화:** 가능 ✅ | **테스트 수:** 9개 (2026-09-15 실측)
- **비고:** 파일 위치에 따라 Unit 으로 집계한다. 7절 Accessibility 에서 교차 참조한다.

---

### TC-U-018: ImageUploadField 업로드 필드 🔲 계획

| 항목 | 내용 |
|------|------|
| **시나리오** | SC-U-017 |
| **파일** | `__tests__/unit/components/ImageUploadField.test.tsx` (신규) |
| **대상** | `src/components/ImageUploadField.tsx` (79줄, 테스트에서 import 하는 파일 0개) |
| **우선순위** | High |
| **전제조건** | 실제 `BlockEditorProvider` 로 감싼다 (`useImageDropZone` → `useBlockEditorContext`). `HTMLInputElement.prototype.click` spy |
| **테스트 데이터** | `blockId=1`, `field='src'`, 1KB JPEG, `size` 를 15MB 로 재정의한 JPEG |

| # | 단계 | 예상 결과 |
|---|------|---------|
| 1 | `src=''` 로 렌더링 | `input[type="file"][accept="image/*"]` 가 `display:none`, 영역 `.be-img-upload` 에 `+ 이미지 업로드`, `JPG, PNG, WebP, GIF`, `10MB 초과시 자동 최적화` 표시 |
| 2 | `src=''` 상태에서 영역 클릭 | 숨겨진 input 의 `click()` 1회 호출 |
| 3 | `src='/a.jpg'` 로 렌더링 후 영역 클릭 | 영역에 `has-image` 클래스, `<img src="/a.jpg" alt="">`·`.be-img-remove-btn` 렌더링, `click()` 미호출 |
| 4 | × 버튼 클릭 | `onClear(1, 'src')` 호출, 영역 클릭 핸들러로 전파되지 않음 (`stopPropagation`) |
| 5 | input change 로 1KB JPEG 선택, `uploadImage` 가 `{ url, key }` resolve | `onUploadComplete(1, 'src', url)`, `onKeyTracked(key)` 호출, input `value` 가 `''` 로 초기화 |
| 6 | `uploadImage` 가 pending 상태 | 영역에 `is-uploading` 클래스, 텍스트 `업로드 중...`, 영역 클릭 시 `click()` 미호출 |
| 7 | `types` 에 `Files` 가 있는 dragEnter | 영역에 `is-drag-over` 클래스, 텍스트 `여기에 놓으세요` |
| 8 | `uploadImage` 가 `Error('업로드 실패')` reject | `.be-error` 텍스트 `업로드 실패` |
| 9 | 기본 Provider 에서 15MB JPEG 선택 | `.be-error` 텍스트 `파일 크기가 10MB를 초과합니다: 15.0MB`, `uploadImage` 미호출. 안내 문구 `10MB 초과시 자동 최적화` 와 실제 동작이 다르므로 문구 또는 동작 중 기준을 결정해야 한다 |
| 10 | `<form>` 안에서 × 버튼 클릭 | 현재 소스: 버튼에 `type` 속성이 없어 `button.type === 'submit'` 이다. 기대: form 이 제출되지 않아야 한다 (MiniEditor Regression #1 과 같은 기준) |

- **자동화:** 가능 ✅
- **비고:** 9단계와 10단계의 현재 소스 동작은 2026-09-13 워크트리 밖 임시 테스트로 확인했다 (`input.type='file'`, 레이블 없음, 영역 `role`·`tabindex` 없음, × 버튼 `type='submit'`·`aria-label` 없음·텍스트 `×`). 접근성 항목은 TC-AC-006~008 에서 다룬다. 우선순위 갭 1순위(사전 조사 6순위)에 해당한다.

---

### TC-U-019: BlockPreviewTheme 스타일 주입 🔲 계획

| 항목 | 내용 |
|------|------|
| **시나리오** | SC-U-018 |
| **파일** | `__tests__/unit/components/BlockPreviewTheme.test.tsx` (신규) |
| **대상** | `src/components/BlockPreviewTheme.tsx` (26줄, 테스트에서 import 하는 파일 0개) |
| **우선순위** | Medium |
| **전제조건** | React 19 (`<style href precedence>` 호이스팅·중복 제거). 현재 Vitest 설정은 CSS 를 처리하지 않으므로 `styles/preview.css` import 값이 빈 문자열이다 |

| # | 단계 | 예상 결과 |
|---|------|---------|
| 1 | `<BlockPreviewTheme />` 1개를 `<div>` 안에 렌더링 | `document.head` 에 `<style data-href="@withwiz/block-editor/preview" data-precedence="default">` 1개, 렌더링한 컨테이너 안에는 `<style>` 없음 |
| 2 | 같은 트리에 2개 렌더링 | `document.head` 의 해당 `<style>` 1개 (중복 제거) |
| 3 | Vitest 환경에서 style 텍스트 확인 | 길이 0 이다. CSS 본문 검증은 이 TC 가 아니라 빌드 산출물 기준 TC-SM-001 5단계에서 수행한다 |
| 4 | 컴포넌트 props 확인 | props 를 받지 않으며 `href`·`precedence` 값이 `@withwiz/block-editor/preview`·`default` 로 고정되어 있다 |

- **자동화:** 가능 ✅
- **비고:** 1~3단계 결과는 2026-09-13 워크트리 밖 임시 테스트(React 19.2.6)로 확인했다. `package.json` 의 `peerDependencies.react` 는 `>=18.0.0` 인데 `CLAUDE.md` 는 이 컴포넌트가 React 19 이상을 요구한다고 기재한다. React 18 환경 동작은 devDependencies 에 React 18 이 없어 확인하지 않았다. 우선순위 갭 1순위(사전 조사 6순위)에 해당한다.

---

### TC-U-020: URL 자동 링크 변환 (linkify)

| 항목 | 내용 |
|------|------|
| **시나리오** | SC-U-019 |
| **파일** | `__tests__/unit/core/html-renderer.test.ts` (`linkify()` describe) |
| **대상** | `src/core/html-renderer.ts`: `linkify()` (정규식 `https?:\/\/[^\s<]+` 에 일치한 URL 을 `<a>` 로 감싸고, href 값의 `"`·`'` 만 `&quot;`·`&#39;` 로 바꾼다. 링크 텍스트와 `&` 는 그대로 둔다) |
| **우선순위** | Critical |
| **전제조건** | 없음 (순수 함수). 소스 주석상 입력은 `h()` 로 이스케이프된 HTML 이다 |
| **테스트 데이터** | `'go https://example.com/path now'`, `'see https://x.com/"onmouseover="alert(1) now'`, `"see https://x.com/'onmouseover='alert(1) now"`, `'https://x.com/?a=1&amp;b=2'` |

| # | 단계 | 예상 결과 |
|---|------|---------|
| 1 | `linkify('go https://example.com/path now')` 호출 | `'go <a href="https://example.com/path" target="_blank" rel="noopener noreferrer">https://example.com/path</a> now'` 반환 |
| 2 | 큰따옴표가 든 URL 입력 | `href="https://x.com/&quot;onmouseover=&quot;alert(1)"`, 링크 텍스트는 원문 `https://x.com/"onmouseover="alert(1)` 그대로 |
| 3 | 작은따옴표가 든 URL 입력 | `href="https://x.com/&#39;onmouseover=&#39;alert(1)"`, 링크 텍스트는 원문 그대로 |
| 4 | `linkify('https://x.com/?a=1&amp;b=2')` 호출 | href 와 링크 텍스트 모두 `https://x.com/?a=1&amp;b=2` (`&amp;amp;` 로 이중 이스케이프하지 않음) |

- **자동화:** 가능 ✅ | **테스트 수:** 4개 (2026-09-15 실측, 테스트 4개 전체 기재)
- **비고:** 0.3.1 (`977be3f`) 에서 추가된 describe 이다. 2·3단계처럼 이스케이프되지 않은 입력이 들어오면 링크 텍스트에 원문 따옴표가 남지만 텍스트 노드이므로 속성을 만들지 않는다 (TC-S-003 1~3단계가 DOM 파싱으로 확인). 따옴표로 감싼 URL 은 테스트가 없다: `nl2br('링크 "https://example.com" 참조')` 는 `h()` 가 만든 `&quot;` 까지 정규식에 일치해 href 파싱 값이 `https://example.com"` 이 된다. 0.3.0 에서는 같은 입력의 href 파싱 값이 `https://example.com` 이었다 (속성이 끊겨 `"` 이름의 속성이 함께 생성됨). 닫는 괄호 `(https://example.com/a)` 는 두 버전 모두 href 에 `)` 가 포함된다. 세 결과는 2026-09-15 0.3.0·0.3.1 소스를 각각 번들링해 실행하고 jsdom 으로 파싱하여 확인했다. 우선순위 갭 6순위에 해당한다.

---

## 2. Integration Tests (통합 테스트)

**목적:** 모듈 간 상호작용을 검증한다. 실제 의존성을 사용하되 외부 API 는 호스트가 주입하는 mock 으로 대체한다.

**실행 명령:** `npm run test:integration`

---

### TC-I-001: 블록 렌더러 ↔ HTML 출력 통합

| 항목 | 내용 |
|------|------|
| **시나리오** | SC-I-001 |
| **파일** | `__tests__/integration/block-editor-integration.test.ts` (INT-001) |
| **대상** | `createHtmlRenderer('integration-test').renderBlocks()` + `BlockData` 타입 연동 |
| **우선순위** | Critical |

| # | 단계 | 예상 결과 |
|---|------|---------|
| 1 | paragraph `Hello world` 렌더링 | `/<p[^>]*>Hello world<\/p>/` 일치 |
| 2 | paragraph 3개 렌더링 | `First` < `Second` < `Third` 인덱스 |
| 3 | 빈 블록 배열 렌더링 | 문자열 타입 반환 (길이 0 이상) |
| 4 | `<script>alert("xss")</script>` 포함 텍스트 렌더링 | `<script>` 미포함, `&lt;script&gt;` 포함 |
| 5 | `한글 テスト 🚀 café` 렌더링 | 네 문자열 모두 포함 |

- **자동화:** 가능 ✅ | **테스트 수:** 5개 (2026-09-15 실측)
- **비고:** 3단계 단언은 빈 문자열 여부를 구분하지 않는다. 빈 배열이 `''` 를 반환한다는 사실은 TC-E-002 가 검증한다.

---

### TC-I-002: 이미지 처리 파이프라인 통합

| 항목 | 내용 |
|------|------|
| **시나리오** | SC-I-002 |
| **파일** | `__tests__/integration/block-editor-integration.test.ts` (INT-002) |
| **대상** | `img-full`, `img-inline`, `img-text` 블록 → HTML |
| **우선순위** | High |

| # | 단계 | 예상 결과 |
|---|------|---------|
| 1 | img-full `/safe-image.jpg` + cap 렌더링 | src·cap 텍스트 포함 |
| 2 | img-full `javascript:alert("xss")` 렌더링 | `javascript:`·`alert` 미포함 |
| 3 | img-full 3개 연속 렌더링 | `/image1.jpg`~`/image3.jpg` 모두 포함 |
| 4 | img-inline `/inline-image.jpg` 렌더링 | 경로 포함 |
| 5 | img-text src·name·role·bio 렌더링 | `/image.jpg`, `Person Name` 포함 |

- **자동화:** 가능 ✅ | **테스트 수:** 5개 (2026-09-15 실측)
- **비고:** 2026-03-04 문서가 이 TC 에 적었던 `data:image/svg+xml` 차단과 `onload` 속성 주입 차단은 INT-005 에 있으며 TC-I-004 로 옮겼다.

---

### TC-I-003: 복합 블록 워크플로우 통합

| 항목 | 내용 |
|------|------|
| **시나리오** | SC-I-003 |
| **파일** | `__tests__/integration/block-editor-integration.test.ts` (INT-003, INT-004) |
| **대상** | quote·video·cta·gallery·press-list 변환과 혼합 블록 렌더링 |
| **우선순위** | High |

| # | 단계 | 예상 결과 |
|---|------|---------|
| 1 | quote + attr `- John Lennon` 렌더링 | 본문과 `John Lennon` 포함 |
| 2 | video url `https://youtube.com/watch?v=dQw4w9WgXcQ` 렌더링 | 길이 > 0, `youtube.com` 포함 |
| 3 | press-list 2개 아이템 렌더링 | `Press Outlet 1`, `Article Title`, `Press Outlet 2` 포함 |
| 4 | paragraph·img-full·paragraph·quote·paragraph·cta 6개 블록 렌더링 | 6개 콘텐츠 모두 포함 |
| 5 | paragraph 2개 렌더링 | `/<\/p>\s*<p/` 일치 |
| 6 | 블로그 구조 4개 블록 렌더링 | 4개 문자열 모두 포함 |

- **자동화:** 가능 ✅ | **테스트 수:** 8개 (2026-09-15 실측: INT-003 5, INT-004 3)
- **비고:** 6단계 테스트 주석은 순서 보존을 언급하지만 단언은 포함 여부만 확인한다.

---

### TC-I-004: XSS 방어 통합

| 항목 | 내용 |
|------|------|
| **시나리오** | SC-I-004 |
| **파일** | `__tests__/integration/block-editor-integration.test.ts` (INT-005) |
| **대상** | `renderBlocks()` 경유 텍스트 이스케이프·`sanitizeImageSrc`·`sanitizeUrl` 연동 |
| **우선순위** | Critical |

| # | 단계 | 예상 결과 |
|---|------|---------|
| 1 | paragraph `<img src=x onerror=alert("xss")>` | `&lt;img`, `&gt;` 포함 |
| 2 | img-full src `data:text/html,<script>...` | `data:` 미포함 |
| 3 | cta url `javascript:alert("xss")` | `javascript:` 미포함 |
| 4 | img-full src `/image.jpg" onload="alert(1)` | `onload` 미포함 |
| 5 | img-full src `data:image/svg+xml,<svg onload="alert(1)">` | `svg`, `onload` 미포함 |
| 6 | img-full cap `Caption with "quotes"` | `Caption with`, `quotes` 포함 |

- **자동화:** 가능 ✅ | **테스트 수:** 6개 (2026-09-15 실측)
- **비고:** 2026-03-04 문서는 SC-I-004 를 완료로 표기했지만 TC 가 없었다. 6단계 테스트 이름 `should escape quotes in attributes` 와 달리 단언은 `alt` 속성 이스케이프(`&quot;`)를 확인하지 않는다.

---

### TC-I-005: 경계값·누락 필드 렌더링

| 항목 | 내용 |
|------|------|
| **시나리오** | SC-I-005 |
| **파일** | `__tests__/integration/block-editor-integration.test.ts` (INT-006) |
| **대상** | `renderBlocks()` 선택 필드 누락, 긴 텍스트, URL 특수문자 |
| **우선순위** | Medium |

| # | 단계 | 예상 결과 |
|---|------|---------|
| 1 | cap 이 없는 img-full 렌더링 | 결과 truthy |
| 2 | 10,000자 paragraph 렌더링 | 원문 전체 포함 |
| 3 | img-full src `/images/photo-2024-03-01.jpg?size=large&format=webp` | `photo-2024-03-01.jpg`, `size=large` 포함 |
| 4 | img-full cap `He said "Hello" to me` | `Hello` 포함 |

- **자동화:** 가능 ✅ | **테스트 수:** 4개 (2026-09-15 실측)

---

### TC-I-006: ArtistEditor 사용자 흐름

| 항목 | 내용 |
|------|------|
| **시나리오** | SC-I-006 |
| **파일** | `__tests__/integration/artist-editor.test.tsx` |
| **대상** | `src/components/ArtistEditor.tsx` + `BlockEditorProvider` + `createSerializer('abe-blocks:')` |
| **우선순위** | High |
| **전제조건** | `HTMLInputElement.prototype.click` 을 패치해 컴포넌트가 동적으로 생성한 file input 을 캡처하고 `onchange` 를 직접 실행한다 |

| # | 단계 | 예상 결과 |
|---|------|---------|
| 1 | `content=""` 로 마운트 | `.abe-wrapper`·`.abe-textarea` 존재, 미리보기에 `약력을 입력하면` 표시, upload·onChange 미호출 |
| 2 | text·mainImage·gallery 2장을 담은 마커 payload 로 마운트 | textarea 값 복원, 대표 이미지 영역 `has-image`, `.abe-gallery-item` 2개, `2/5` 표시 |
| 3 | 대표 이미지 영역 클릭 → 파일 1개 제출 | upload 1회, `onImageUploaded('k-main')`, 마지막 onChange 역직렬화 결과 `mainImage` 가 업로드 URL |
| 4 | 갤러리 추가 버튼 → 파일 3개 제출 → 두 번째 × 클릭 | gallery 가 업로드 순서대로 3개 → `[urls[0], urls[2]]`, 마지막 onChange 도 동일 |
| 5 | `maxGallery=2` 로 2장을 채운 상태 | `이미지 추가` 버튼 없음, upload·onError 미호출 |
| 6 | upload 가 `Error('network down')` throw | `onError('이미지 업로드 중 오류 발생')`, 대표 이미지 영역 `has-image` 없음, onChange payload 의 `mainImage` 는 빈 값 |

- **자동화:** 가능 ✅ | **테스트 수:** 6개 (2026-09-15 실측)
- **비고:** ArtistEditor 는 첫 커밋부터 있었지만 2026-03-04 문서에는 빠져 있었고, 이 테스트는 2026-05-25 (`cec4b9e`) 에 추가되었다. 5단계 테스트 이름은 onError 경고를 언급하지만 단언은 onError 미호출을 확인한다. 미리보기·onChange HTML 의 이미지 속성 주입 차단은 TC-S-004 가 검증하고, 업로드 파일 검증은 TC-S-005 계획에서 다룬다.

---

### TC-I-007: BlockEditor 편집 흐름 🔲 계획

| 항목 | 내용 |
|------|------|
| **시나리오** | SC-I-007 |
| **파일** | `__tests__/integration/block-editor-component.test.tsx` (신규) |
| **대상** | `src/components/BlockEditor.tsx` (376줄, 테스트에서 import 하는 파일 0개) + `BlockRenderer` + `createSerializer` + `createHtmlRenderer` |
| **우선순위** | High |
| **전제조건** | `BlockEditorProvider` 로 감싼다 (이미지 블록이 `ImageUploadField` 를 렌더링한다). `window.confirm` spy |
| **테스트 데이터** | `config = { blocks: BUILT_IN_BLOCKS, marker: 'nbe-blocks:', cssPrefix: 'nbe-pvb' }`, `templates`·`samples`·`catClasses` 가 있는 config |

| # | 단계 | 예상 결과 |
|---|------|---------|
| 1 | serialized 모드: 마커가 포함된 `content` 로 마운트 | 역직렬화된 블록 수만큼 `.be-block` 렌더링, 최초 마운트에서 onChange 미호출 |
| 2 | `일반 단락` 추가 버튼(`.be-add-btn`) 클릭 | onChange 인자가 `renderBlocksWrapped(blocks) + serialize(blocks)` 이며 `nbe-pvb-body` 와 `<!-- nbe-blocks:` 포함 |
| 3 | 블록 헤더 `↑` / `↓` / `×` 클릭 | 인접 블록과 순서 교환 (첫·마지막 경계에서는 변화 없음) / 해당 블록 제거 |
| 4 | raw 모드(`blocks`, `onBlocksChange`)에서 블록 추가 | `onBlocksChange` 에 갱신된 블록 배열 전달 |
| 5 | `content` 에 마커가 없고 `templates[category]` 가 있을 때 마운트 | 템플릿 블록이 id 0 부터 로드 |
| 6 | 내용이 있는 상태에서 `빈 템플릿` 클릭 | `confirm()` 호출, 취소 시 변경 없음, 승인 시 `onModeChange('template')` |
| 7 | `enableCategoryFilter: true` 이고 `cats` 가 일치하는 블록이 없는 category | 추가 버튼 0개, `console.warn` 호출 |
| 8 | `<form>` 안에서 `↑`·`×`·추가 버튼 클릭 | 현재 소스: `be-block-btn`·`be-add-btn`·`be-mode-btn` 에 `type` 속성이 없어 기본값 submit 으로 해석된다. 기대: form 이 제출되지 않아야 한다 |
| 9 | 블록 A dragStart → 블록 C dragOver(clientY 가 중앙보다 아래) → drop | A 가 C 뒤로 이동, `be-dragging`·`be-drag-over` 클래스 해제 |

- **자동화:** 가능 ✅
- **비고:** jsdom 의 `getBoundingClientRect()` 는 0 을 반환하므로 9단계 방향 판정은 `clientY > 0` 으로 제어한다. 우선순위 갭 2순위에 해당한다.

---

## 3. API Tests (이미지 업로드 API 연동 테스트)

**목적:** 라이브러리의 핵심 통합 지점인 **이미지 업로드 계약**을 검증한다.
이 라이브러리는 HTTP 요청이나 JWT 를 직접 다루지 않는다. 호스트가 `BlockEditorProvider` 에 주입하는 `UploadFn = (file: File) => Promise<UploadResult>` 가 실제 API 를 호출하므로, 라이브러리 쪽 API 테스트는 이 함수의 resolve·reject 결과를 hook 이 어떻게 처리하는지 검증한다.

```
업로드 흐름 (src/hooks/useImageDropZone.ts processFiles 기준)
사용자 이미지 선택 (drop 은 ALLOWED_IMAGE_TYPES 로 1차 필터)
  → multiple=false 이면 첫 파일만, maxFiles 초과분은 절단 + 안내 메시지
  → validateImageFile(file)             ← 10MB 고정 상한, 실패 시 setError 후 종료 (onError 미호출)
  → autoResize && size > maxSizeMB 이면 resizeImageIfNeeded(file)
  → uploadImage(file)                   ← UploadFn 호출 (호스트 구현)
      예: POST /api/upload, Authorization: Bearer <JWT>
  → onUpload(result) → result.key 가 있으면 onKeyTracked(key)
  → 실패 시 setError(message) + onError(message), finally 에서 isUploading=false

ImageUploadField 경유: onUpload → onUploadComplete(blockId, field, result.url) → BlockRenderer updateBlock
ArtistEditor 경유: 검증 없이 uploadImage(file) 직접 호출 (TC-S-005)
```

**실행 명령:** `npm run test:api`

**테스트 전략:** 실제 파일은 `vi.mock` 으로 `useBlockEditorContext` 반환값을 고정하고(`autoResize: false`, `maxSizeMB: 10`), `image-resize` 모듈의 `validateImageFile`·`resizeImageIfNeeded` 를 mock 으로 대체한다. MSW 나 fetch 가로채기는 사용하지 않는다.

**파일 describe 명칭 ↔ 문서 ID 대응표**

`__tests__/api/upload-single.test.ts` 는 describe 이름에 자체 TC 번호를 사용하며, 이 번호는 2026-03-04 문서 ID 와 일치하지 않는다. 이 문서는 기존 SC/TC ID 를 유지하고 아래 대응표로 연결한다.

| 파일 describe | 테스트 수 | 이 문서 ID |
|--------------|---------|-----------|
| `TC-A-001: 단일 업로드 성공 (유효 이미지)` (1·2번째 it) | 2 | TC-A-001 |
| `TC-A-001: 단일 업로드 성공 (유효 이미지)` (3·4번째 it, key 유무) | 2 | TC-A-005 |
| `TC-A-002: 인증 실패 — JWT 만료 (401 Unauthorized)` | 2 | TC-A-002 |
| `TC-A-003: 네트워크 오류 처리` | 2 | TC-A-006 |
| `TC-A-004: 비허용 MIME 타입 — 서버 요청 전 차단` | 2 | TC-A-004 |
| `TC-A-005: disabled 상태 — 업로드 불가` | 1 | TC-A-007 |

---

### TC-A-001: JWT 인증 성공 업로드

| 항목 | 내용 |
|------|------|
| **시나리오** | SC-A-001 |
| **파일** | `__tests__/api/upload-single.test.ts` |
| **대상** | `UploadFn` resolve 결과 처리 (`useImageDropZone.handleFileInput`) |
| **우선순위** | Critical |
| **전제조건** | `useBlockEditorContext` mock (`autoResize: false`), `validateImageFile` 이 `null` 반환 |
| **테스트 데이터** | 1KB JPEG `photo.jpg`, 결과 `{ url: 'https://cdn.example.com/images/abc123.jpg', key: 'abc123' }` |

| # | 단계 | 예상 결과 |
|---|------|---------|
| 1 | `uploadImage` resolve 설정 후 `handleFileInput([file])` | `uploadImage` 1회, 인자는 선택한 File |
| 2 | 1단계 결과 확인 | `onUpload(결과 객체)`, `error === null`, `onError` 미호출 |
| 3 | `uploadImage` 를 pending 으로 유지한 채 호출 → resolve | `isUploading` 이 true → false |

- **자동화:** 가능 ✅ | **테스트 수:** 2개 (2026-09-15 실측)
- **비고:** 2026-03-04 문서 단계에 있던 HTTP 200 응답, CDN URL 형태, `block.src` 반영은 이 라이브러리 테스트 범위 밖이다. `block.src` 반영은 TC-U-018 5단계와 TC-U-009 에서 다룬다.

---

### TC-A-002: JWT 인증 실패 (401 Unauthorized)

| 항목 | 내용 |
|------|------|
| **시나리오** | SC-A-002 |
| **파일** | `__tests__/api/upload-single.test.ts` |
| **대상** | `UploadFn` reject 전파 계약 |
| **우선순위** | Critical |
| **테스트 데이터** | `mockRejectedValue(new Error('401 Unauthorized'))` |

| # | 단계 | 예상 결과 |
|---|------|---------|
| 1 | reject 설정 후 업로드 시도 | `error === '401 Unauthorized'` |
| 2 | 1단계 콜백 확인 | `onError('401 Unauthorized')` 호출, `onUpload` 미호출 |
| 3 | 실패 후 상태 확인 | `isUploading === false` |

- **자동화:** 가능 ✅ | **테스트 수:** 2개 (2026-09-15 실측)
- **비고:** 2026-03-04 문서 5단계 "Authorization 헤더 없는 요청" 은 라이브러리가 헤더를 다루지 않으므로 삭제했다.

---

### TC-A-003: 파일 크기 초과 → 클라이언트 사전 차단 🔲 계획

| 항목 | 내용 |
|------|------|
| **시나리오** | SC-A-003 |
| **파일** | `__tests__/api/upload-size-limit.test.tsx` (신규) |
| **대상** | `useImageDropZone` 크기 검증·자동 리사이즈 분기 (`validateImageFile` → `needsResize` → `resizeImageIfNeeded`) |
| **우선순위** | High |
| **전제조건** | 실제 `BlockEditorProvider` 사용, `validateImageFile` 은 mock 하지 않는다. 3·4단계만 `resizeImageIfNeeded` 를 mock 한다 |
| **테스트 데이터** | `size` 를 15MB·7MB 로 재정의한 JPEG |

| # | 단계 | 예상 결과 |
|---|------|---------|
| 1 | 기본 Provider(`autoResize=true`, `maxSizeMB=10`)에서 15MB JPEG 입력 | error `파일 크기가 10MB를 초과합니다: 15.0MB`, `uploadImage` 0회, `isResizing` 이 true 가 되지 않음 |
| 2 | `maxSizeMB={5}` 에서 7MB JPEG 입력 (실제 `resizeImageIfNeeded`) | error `이미지 크기를 줄였지만 여전히 5MB를 초과합니다. (7.0MB) 더 작은 이미지를 사용해 주세요.`, `uploadImage` 0회 |
| 3 | `maxSizeMB={5}`, `resizeImageIfNeeded` mock 이 3MB 파일 반환 | 처리 중 `isResizing` true → false, `uploadImage` 에 축소된 파일 전달 |
| 4 | `maxSizeMB={5}`, `resizeImageIfNeeded` mock 이 `Error('디코딩 실패')` / 문자열로 reject | error `디코딩 실패` / `이미지 최적화 중 오류 발생`, `isResizing=false`, `uploadImage` 0회 |
| 5 | 1·2·4단계 콜백 확인 | Provider `onError` 미호출 (검증·리사이즈 오류는 `setError` 만 호출한다) |
| 6 | `autoResize={false}`, `maxSizeMB={5}` 에서 7MB JPEG 입력 | 리사이즈 없이 `uploadImage` 1회 |

- **자동화:** 가능 ✅
- **비고:** 1·2단계 결과는 2026-09-13 워크트리 밖 임시 테스트로 확인했다. 소스 구조상 `validateImageFile` 이 10MB 초과 파일을 먼저 거부하고 `resizeImageIfNeeded` 는 10MB 이하 파일을 원본 그대로 반환하므로, `useImageDropZone` 경유로는 실제 축소가 일어나지 않는다. 2단계 메시지 "줄였지만" 도 실제 동작과 다르다. 2026-03-04 문서가 적은 "리사이즈 후 10MB 초과 → 업로드 전 차단" 은 이 구조를 반영하지 않았다. 우선순위 갭 3순위에 해당한다.

---

### TC-A-004: 지원하지 않는 파일 형식 (415 Unsupported Media Type)

| 항목 | 내용 |
|------|------|
| **시나리오** | SC-A-004 |
| **파일** | `__tests__/api/upload-single.test.ts` |
| **대상** | 검증 실패 시 업로드 미호출 계약 |
| **우선순위** | High |
| **테스트 데이터** | `icon.svg` (`image/svg+xml`), `image.bmp` (`image/bmp`) |

| # | 단계 | 예상 결과 |
|---|------|---------|
| 1 | `validateImageFile` mock 이 SVG 에 거부 메시지를 반환하도록 설정 후 SVG 입력 | `uploadImage` 미호출 |
| 2 | 1단계 상태 확인 | `error !== null` |
| 3 | BMP 에 거부 메시지를 반환하도록 설정 후 BMP 입력 | `uploadImage` 미호출 |

- **자동화:** 가능 ✅ | **테스트 수:** 2개 (2026-09-15 실측)
- **비고:** 이 파일은 검증 로직을 테스트 안의 mock 구현으로 대체하므로 실제 validator 연동을 확인하지 않는다. 실제 validator 경유 거부는 TC-U-010 4·5단계가 확인한다. 2026-03-04 문서 3단계 "onError 호출됨" 은 소스와 다르다: 검증 실패 시 `setError` 만 호출하고 `onError` 는 호출하지 않는다.

---

### TC-A-005: UploadResult 계약 (key 필드)

| 항목 | 내용 |
|------|------|
| **시나리오** | SC-A-005 |
| **파일** | `__tests__/api/upload-single.test.ts` |
| **대상** | `UploadResult = { url: string; key?: string }` 중 `key` 처리 |
| **우선순위** | High |

| # | 단계 | 예상 결과 |
|---|------|---------|
| 1 | `{ url, key: 'track-key-99' }` resolve | `onKeyTracked('track-key-99')` 호출 |
| 2 | `{ url }` resolve (key 없음) | `onKeyTracked` 미호출 |

- **자동화:** 가능 ✅ | **테스트 수:** 2개 (2026-09-15 실측, 테스트 2개 전체 기재)
- **비고:** 시나리오명을 "UploadResult url/key 필드 계약 검증" 에서 key 로 좁혔다. `url` 누락·빈 문자열 처리는 SC-A-008 로 분리했다.

---

### TC-A-006: 네트워크 오류 처리

| 항목 | 내용 |
|------|------|
| **시나리오** | SC-A-006 |
| **파일** | `__tests__/api/upload-single.test.ts` |
| **대상** | `useImageDropZone` 업로드 catch·finally 블록 |
| **우선순위** | Medium |

| # | 단계 | 예상 결과 |
|---|------|---------|
| 1 | `uploadImage` 가 `Error('Network Error')` reject | `error === 'Network Error'` |
| 2 | `uploadImage` 가 문자열 `'알 수 없는 오류'` reject | `error === '업로드 중 오류 발생'` (기본 메시지) |

- **자동화:** 가능 ✅ | **테스트 수:** 2개 (2026-09-15 실측, 테스트 2개 전체 기재)
- **비고:** 두 테스트는 error 만 단언한다. `isUploading=false` 복원은 TC-A-002 와 TC-U-010 6단계가 확인한다.

---

### TC-A-007: disabled 상태 업로드 차단

| 항목 | 내용 |
|------|------|
| **시나리오** | SC-A-007 |
| **파일** | `__tests__/api/upload-single.test.ts` |
| **대상** | `useImageDropZone({ disabled: true })` |
| **우선순위** | Medium |

| # | 단계 | 예상 결과 |
|---|------|---------|
| 1 | `disabled: true` 로 hook 생성 후 `handleFileInput([JPEG])` 호출 | `uploadImage` 미호출 |

- **자동화:** 가능 ✅ | **테스트 수:** 1개 (2026-09-15 실측, 테스트 1개 전체 기재)
- **비고:** 이 파일은 drop 경로를 검증하지 않는다. disabled 상태에서 drop 을 무시하는 동작은 TC-U-010 이 확인한다.

---

### TC-A-008: UploadResult url 누락·빈 문자열 🔲 계획

| 항목 | 내용 |
|------|------|
| **시나리오** | SC-A-008 |
| **파일** | `__tests__/api/upload-single.test.ts` (추가 예정) |
| **대상** | `useImageDropZone`, `ImageUploadField`, `ArtistEditor` 의 `result.url` 처리 |
| **우선순위** | Medium |

| # | 단계 | 예상 결과 |
|---|------|---------|
| 1 | `useImageDropZone` 에서 `{ url: '', key: 'k' }` resolve | `onUpload({ url: '', key: 'k' })`, `onKeyTracked('k')` 호출, error `null` (url 을 검사하지 않는다) |
| 2 | `ImageUploadField` 에서 `{ key: 'k' }` (url 없음) resolve | `onUploadComplete(blockId, field, undefined)` 호출 |
| 3 | `ArtistEditor` 대표 이미지 업로드에서 `{ url: '', key: 'k' }` resolve | `mainImage` 변경 없음, `onImageUploaded` 미호출, `onError` 미호출 (`if (result.url)` 분기) |
| 4 | 기준 결정 | 빈 url 을 오류로 안내할지 여부가 소스에 정의되어 있지 않다. 경로마다 결과가 다르므로 기준을 정한 뒤 단언을 확정한다 |

- **자동화:** 가능 ✅

---

### API 테스트 구현 전략

```typescript
// __tests__/api/upload-single.test.ts 실제 구조 요약
vi.mock('../../src/context/BlockEditorProvider', () => ({
  useBlockEditorContext: vi.fn(),
}));
vi.mock('../../src/core/image-resize', async () => {
  const actual = await vi.importActual('../../src/core/image-resize');
  return {
    ...actual,
    validateImageFile: vi.fn(() => null),
    resizeImageIfNeeded: vi.fn(async (file: File) => ({
      file, wasResized: false, originalSize: file.size, newSize: file.size,
    })),
  };
});

beforeEach(() => {
  vi.clearAllMocks();
  (useBlockEditorContext as ReturnType<typeof vi.fn>).mockReturnValue({
    uploadImage: mockUploadImage, onError: mockOnError, autoResize: false, maxSizeMB: 10,
  });
});

// 성공: mockUploadImage.mockResolvedValue({ url, key })
// 401:  mockUploadImage.mockRejectedValue(new Error('401 Unauthorized'))
```

- 실행 스크립트 `test:api` (`vitest run __tests__/api`) 는 `package.json` 에 이미 있다.
- 2026-03-04 문서에 있던 MSW 예시와 JWT 토큰 테스트 데이터는 실제 테스트에서 사용하지 않으므로 삭제했다.
- 신규 계획 TC(TC-A-003, TC-A-008)는 validator mock 없이 실제 Provider 를 사용해야 소스 동작을 검증할 수 있다.

---

## 4. E2E Tests (엔드-투-엔드 테스트)

**목적:** 여러 모듈을 연결한 사용자 흐름을 처음부터 끝까지 검증한다.
브라우저 없이 jsdom 에서 실행하므로 실제 브라우저 기능(`execCommand`, Canvas, 레이아웃)은 mock 이나 DOM 조작으로 모사한다.

**실행 명령:** `npm run test:e2e`

---

### TC-E-001: 직렬화 라운드트립 풀 사이클

| 항목 | 내용 |
|------|------|
| **시나리오** | SC-E-001 |
| **파일** | `__tests__/e2e/serializer-roundtrip.test.ts` |
| **대상** | `createSerializer('BK_DATA_V1')` + `createHtmlRenderer('test').renderBlock()` 연동 |
| **우선순위** | Critical |

| # | 단계 | 예상 결과 |
|---|------|---------|
| 1 | paragraph 1개 `serialize` | `<!-- BK_DATA_V1` 포함 |
| 2 | `deserialize` 후 각 블록 `renderBlock` | 원본과 `toEqual`, 원본 블록 HTML 과 동일 문자열 |
| 3 | `<script>alert("xss")</script>` 텍스트 라운드트립 | 데이터 보존, HTML 에 `&lt;`·`&gt;` 포함, `<script>` 미포함 |
| 4 | 한글·이모지·줄바꿈 텍스트 라운드트립 | 데이터 보존, 줄바꿈은 `<br>` 로 렌더링 |
| 5 | paragraph 50개 / 5종 타입 혼합 25개 라운드트립 | 길이 50 / 25, 각 블록 렌더링 결과 truthy |
| 6 | 마커 없는 HTML / `INVALID_BASE64!!!` 역직렬화 | 모두 `null` |

- **자동화:** 가능 ✅ | **테스트 수:** 20개 (2026-09-15 실측)
- **비고:** 사용하는 블록 타입은 paragraph, lead, img-full, divider, quote, stats, cta, timeline, spacer, subheading 10종이다. 2026-03-04 문서에 적힌 "22개 블록 타입 전체 라운드트립" 과 `renderBlocks(deserialized)` 호출은 실제 테스트에 없다. `BUILT_IN_BLOCKS`·`createEmptyBlock` 은 import 만 하고 사용하지 않는다.

---

### TC-E-002: 렌더러 HTML 출력 DOM 마운트

| 항목 | 내용 |
|------|------|
| **시나리오** | SC-E-002 |
| **파일** | `__tests__/e2e/block-editor-render.test.tsx` |
| **대상** | `createHtmlRenderer()` 출력 → `dangerouslySetInnerHTML` 로 DOM 마운트 |
| **우선순위** | High |
| **전제조건** | jsdom + React 19, 테스트 파일 안의 `HtmlRenderer` 헬퍼 컴포넌트 |

| # | 단계 | 예상 결과 |
|---|------|---------|
| 1 | paragraph `안녕하세요` 마운트 | `p.test-p` 의 textContent 일치 |
| 2 | paragraph 3개 마운트 | `p` 3개, 순서 `First`·`Second`·`Third` |
| 3 | paragraph `1 < 2 & 3 > 2` 마운트 | DOM textContent 가 원문과 일치 |
| 4 | img-full src `data:text/html,<script>alert(1)</script>` | HTML 에 `data:` 미포함 |
| 5 | press-list link `https://example.com` | `target="_blank"`, `rel="noopener noreferrer"` 포함 |
| 6 | `renderBlocksWrapped([paragraph, divider])` 마운트 | `.test-body` 안에 `p` 와 `.test-hr` 존재 |

- **자동화:** 가능 ✅ | **테스트 수:** 31개 (2026-09-15 실측)
- **비고:** describe 이름은 `BlockRenderer E2E` 이지만 `src/components/BlockRenderer.tsx` 컴포넌트를 렌더링하지 않는다. 시나리오명을 실제 검증 내용에 맞게 정정했다. 사용 타입은 paragraph, lead, img-full, divider, quote, cta, press-list, img-pair, gallery, stats, callout, infobox 12종이며, 2026-03-04 문서의 "22개 블록 타입" 과 `nbe-pvb-p` vs `rm-bk-p` prefix 비교는 실제 테스트에 없다 (prefix 는 `custom` 을 사용한다).

---

### TC-E-003: MiniEditor 사용자 편집 여정

| 항목 | 내용 |
|------|------|
| **시나리오** | SC-E-003 |
| **파일** | `__tests__/e2e/mini-editor-journey.test.tsx` |
| **대상** | `src/mini-editor/MiniEditor.tsx` controlled value + onChange + DOM 상태 동기화 |
| **우선순위** | High |
| **전제조건** | `execCommand`·`queryCommand*` stub. 브라우저가 만드는 DOM 변경은 innerHTML 지정 후 input 이벤트로 모사한다 |

| # | 단계 | 예상 결과 |
|---|------|---------|
| 1 | 입력 → `굵게` mouseDown → 추가 입력 2회 | `execCommand('bold', false, undefined)`, onChange 페이로드 3단계가 순서대로 기록, 최종 innerHTML 일치 |
| 2 | 부모가 같은 html 을 value 로 재전달 | DOM 변경 없음 (caret 보호), 이후 입력 시 onChange 정상 |
| 3 | 부모가 다른 value(`<p>second</p>`) 전달 | innerHTML 이 `<p>second</p>` 로 교체 |
| 4 | `제목 2` mouseDown → 본문 입력 | `execCommand('formatBlock', false, 'h2')`, 마지막 onChange `<h2>제목 후보</h2><p>본문 시작</p>` |
| 5 | `sanitize` 와 적대적 value(`onerror`, `javascript:`) → `<p onclick="steal()">` 입력 | img `onerror` 없음, a href 에 `javascript:` 없음, 출력 `<p>click me</p>` |
| 6 | 빈 마운트 → 입력 → `<p><br></p>` → 재입력 | `data-empty` 가 `true` → 제거 → `true` → 제거 |

- **자동화:** 가능 ✅ | **테스트 수:** 6개 (2026-09-15 실측)

---

## 5. Security Tests (보안 테스트)

**목적:** XSS, 파일 업로드 보안 취약점을 검증한다. OWASP Top 10 기준을 따른다.

**실행 명령:** `npm run test:security`

---

### TC-S-001: XSS 방어 (Cross-Site Scripting Prevention)

| 항목 | 내용 |
|------|------|
| **시나리오** | SC-S-001 |
| **파일** | `__tests__/security/xss-prevention.test.ts` |
| **대상** | `createHtmlRenderer('test').renderBlock()` 경유 `h()`·`sanitizeUrl()`·`sanitizeImageSrc()` |
| **우선순위** | Critical |
| **테스트 데이터** | OWASP XSS 치트시트 계열 페이로드 (script, 이벤트 핸들러, 프로토콜, 속성 주입, SVG) |

| # | 단계 | 예상 결과 |
|---|------|---------|
| 1 | paragraph `Hello <script>alert("xss")</script> World` | `<script>` 미포함, `&lt;script&gt;` 포함 |
| 2 | img-full src `javascript:alert("xss")` | `javascript:` 미포함 |
| 3 | cta url `vbscript:msgbox("xss")` | `vbscript:` 미포함 |
| 4 | img-full src `image.jpg" onerror="alert(1)` | `onerror`, `alert` 미포함 |
| 5 | cta url `#" onclick="alert(1)" data-foo="` | `onclick`, `alert` 미포함 |
| 6 | cta url `https://example.com`, `/page/article`, `#section` | 각 URL 이 출력에 유지 |

- **자동화:** 가능 ✅ | **테스트 수:** 14개 (2026-09-15 실측)
- **관련 요구사항:** OWASP A03:2021 Injection
- **비고:** 이 파일은 본문 텍스트에 http(s) URL 이 포함된 경우(`linkify` 경로)를 검증하지 않는다. 이 경로의 속성 주입은 TC-S-003 (`attribute-injection.test.tsx`) 이 검증한다. 2026-03-04 문서 7단계 `file:///etc/passwd` 는 이 파일이 아니라 TC-U-002 에 있다.

---

### TC-S-002: 파일 업로드 보안 검증

| 항목 | 내용 |
|------|------|
| **시나리오** | SC-S-002 |
| **파일** | `__tests__/security/file-upload-validation.test.ts` |
| **대상** | `src/core/image-resize.ts`: `validateImageFileDetailed()`, `validateImageFileAsync()` |
| **우선순위** | Critical |

| # | 단계 | 예상 결과 |
|---|------|---------|
| 1 | JPEG·PNG·WebP·GIF MIME 파일 검증 | `valid: true` |
| 2 | `malware.jpg` + `application/exe` | `valid: false`, error 에 `지원` 포함 |
| 3 | onload·script 가 포함된 SVG | `valid: false`, error 에 `보안` 포함 |
| 4 | 11MB JPEG / 0 bytes JPEG | `valid: false`, error 에 `MB` / `비어` 포함 |
| 5 | `../../../etc/passwd.jpg`, `photo.jpg\0.exe`, `photo.jpg.exe` | 모두 `valid: false` |
| 6 | PDF 시그니처 `25 50 44 46` + `image/jpeg` (`validateImageFileAsync`) | `valid: false`, error 에 `올바르지` 포함 |

- **자동화:** 가능 ✅ | **테스트 수:** 21개 (2026-09-15 실측)
- **관련 요구사항:** OWASP A04:2021 Insecure Design
- **비고:** 업로드 크기 상한은 `MAX_UPLOAD_SIZE` 10MB 이다. 2026-03-04 문서 5단계 "50MB 초과 파일 거부" 는 실제 테스트와 다르다. `ABSOLUTE_MAX_SIZE`(50MB) 상수는 선언만 되어 있고 사용되지 않는다. `hasMetadata` 는 MIME 이 JPEG·PNG 이면 true 를 반환하는 휴리스틱이며 EXIF 를 파싱하지 않는다 (`checkPotentialMetadata`).

---

### TC-S-003: 본문 URL 자동 링크 변환 속성 주입 차단

| 항목 | 내용 |
|------|------|
| **시나리오** | SC-S-003 |
| **파일** | `__tests__/security/attribute-injection.test.tsx` (SEC-007, SEC-008) |
| **대상** | `src/core/html-renderer.ts`: `nl2br()` → `linkify()`, 그리고 `renderBlock()` 에서 `nl2br()` 를 사용하는 필드 7곳 (`lead`·`paragraph` text, `img-text` bio, `quote`·`quote-large`·`callout` text, `qa` a) |
| **우선순위** | Critical |
| **전제조건** | 출력 HTML 을 jsdom `<template>` 으로 파싱해 실제 생성된 요소의 속성 이름 목록을 검사한다 (`template.content` 는 비활성 문서라 스크립트 실행·이미지 요청이 일어나지 않는다) |
| **테스트 데이터** | `LINK_PAYLOAD_DQ = 'see https://x.com/"onmouseover="alert(1) now'`, `LINK_PAYLOAD_SQ = "see https://x.com/'onmouseover='alert(1) now"` |

| # | 단계 | 예상 결과 |
|---|------|---------|
| 1 | `nl2br(LINK_PAYLOAD_DQ)` 출력 파싱 | `a` 1개, 속성 이름 `['href', 'target', 'rel']`, 모든 요소에 `on*` 속성 없음, href 파싱 값 `https://x.com/"onmouseover="alert(1)` |
| 2 | `linkify(LINK_PAYLOAD_DQ)` 단독 호출 (이스케이프되지 않은 큰따옴표 입력) 출력 파싱 | 1단계와 같은 속성 목록·href 파싱 값, `on*` 속성 없음 |
| 3 | `linkify(LINK_PAYLOAD_SQ)` 단독 호출 | 출력 문자열에 `href="https://x.com/&#39;onmouseover=&#39;alert(1)"` 포함, `a` 1개, 속성 `['href', 'target', 'rel']`, `on*` 속성 없음 |
| 4 | `createHtmlRenderer('test').renderBlock()` 에 `LINK_PAYLOAD_DQ` 를 7개 필드(`it.each`: lead, paragraph, img-text.bio, quote, quote-large, callout, qa.a)에 각각 지정 | 블록마다 `a` 1개, 속성 `['href', 'target', 'rel']`, `on*` 속성 없음 |

- **자동화:** 가능 ✅ | **테스트 수:** 10개 (2026-09-15 실측: SEC-007 3, SEC-008 7)
- **관련 요구사항:** OWASP A03:2021 Injection
- **비고:** 0.3.0 에서는 1단계와 같은 입력이 `a` 요소에 `onmouseover` 속성을 만들었다 (2026-09-13 워크트리 밖 확인, 당시 우선순위 갭 1순위). 0.3.1 (`977be3f`) 에서 `h()` 따옴표 이스케이프와 `linkify()` href 따옴표 이스케이프 두 겹으로 수정되었고 이 파일이 함께 추가되었다. 계획 당시에는 `xss-prevention.test.ts` 에 추가할 예정이었으나 새 파일로 구현되었다. 계획 4단계(`&` 가 포함된 정상 URL 회귀 방지)는 이 파일에 없고 `linkify('https://x.com/?a=1&amp;b=2')` 단위 테스트(TC-U-020 4단계)가 가깝다. 계획 5단계 ArtistEditor 약력 텍스트는 `generateHtml()` 이 같은 `nl2br()` 를 사용하므로 같은 방어가 적용되지만 링크 페이로드로 검증하는 테스트는 없다 (SEC-009 는 약력에 링크가 없는 문자열만 지정한다). 따옴표로 감싼 URL 의 링크 대상 변화는 TC-U-020 비고를 참조한다.

---

### TC-S-004: ArtistEditor 이미지 src 속성 주입 차단

| 항목 | 내용 |
|------|------|
| **시나리오** | SC-S-004 |
| **파일** | `__tests__/security/attribute-injection.test.tsx` (SEC-009) |
| **대상** | `src/components/ArtistEditor.tsx`: `generateHtml()` (미리보기 `dangerouslySetInnerHTML` 과 onChange 출력에 모두 사용). 대표 이미지·갤러리 src 를 `sanitizeImageSrc()` 로 거른 뒤 `hAttr()` 로 출력하고, 빈 문자열이 된 주소는 img 를 출력하지 않는다 |
| **우선순위** | Critical |
| **전제조건** | `BlockEditorProvider`(`uploadImage` 는 `vi.fn()`) 로 감싸고 `createSerializer('abe-blocks:')` payload 로 마운트한다. onChange 출력은 `.abe-textarea` 값을 바꿔 발생시킨 마지막 호출 인자를 `<template>` 으로 파싱한다 |
| **테스트 데이터** | `IMG_PAYLOAD = 'x.png" onerror="alert(1)'`, `"y.png' onerror='alert(2)"`, `'javascript:alert(1)'`, `'javascript:alert(3)'`, 허용 주소 `https://cdn.example.com/main.png?w=1&h=2`·`https://cdn.example.com/ok.png` |

| # | 단계 | 예상 결과 |
|---|------|---------|
| 1 | `{ text: '약력', mainImage: IMG_PAYLOAD, gallery: [] }` 로 마운트 후 textarea 를 `약력 수정` 으로 변경 | 미리보기 `.abe-pv-article` 에 `img` 0개·`on*` 속성 없음, onChange HTML 에도 `img` 0개·`on*` 속성 없음 |
| 2 | `{ text: '', mainImage: IMG_PAYLOAD, gallery: [] }` (대표 이미지만) 로 마운트 | `.abe-pv-main-img` 없음, `img` 0개, `on*` 속성 없음 |
| 3 | `mainImage: 'javascript:alert(1)'` 로 마운트 | `.abe-pv-main-img` 없음, `img` 0개 |
| 4 | `mainImage: 'https://cdn.example.com/main.png?w=1&h=2'` 로 마운트 | `.abe-pv-main-img img` 1개, 속성 `['src', 'alt']`, src 파싱 값이 원래 주소와 같음 |
| 5 | `gallery: [ok, IMG_PAYLOAD, "y.png' onerror='alert(2)", 'javascript:alert(3)']` 로 마운트 후 textarea 변경 | 미리보기와 onChange HTML 모두 `.abe-pv-gallery-grid img` 1개 (속성 `['src', 'alt', 'class']`, src 가 `ok`), 그리드 클래스 `layout-1` (허용된 항목 수 기준), `on*` 속성 없음 |

- **자동화:** 가능 ✅ | **테스트 수:** 5개 (2026-09-15 실측)
- **관련 요구사항:** OWASP A03:2021 Injection
- **비고:** 0.3.0 에서는 mainImage 를 이스케이프 없이, gallery 를 당시 따옴표를 처리하지 않던 `h()` 만 거쳐 삽입해 `onerror`·`onload` 속성이 생성되었다 (2026-09-13 워크트리 밖 확인, 당시 우선순위 갭 2순위). 0.3.1 (`977be3f`) 에서 수정되었다. 계획 당시 파일명은 `artist-editor-output.test.tsx` 였다. 계획 4단계 기대값은 "렌더러와 같은 정책으로 `src=""`" 였으나 구현은 허용되지 않는 주소일 때 img 요소 자체를 출력하지 않는다. 렌더러 `img-full` 은 같은 입력에 `<img src="" alt="">` 를 출력하므로(TC-U-011 4단계) 두 출력 정책이 다르다. 편집 영역 썸네일 `<img src={data.mainImage}>`·`<img src={src}>` 는 JSX 이므로 React 가 속성값으로 설정해 속성 주입 대상이 아니며 `sanitizeImageSrc()` 를 적용하지 않는다. 따라서 허용되지 않는 mainImage 도 편집 영역에는 `has-image` 로 표시되고 미리보기에는 나타나지 않는다 (소스 확인, 테스트 없음).

---

### TC-S-005: ArtistEditor 업로드 파일 클라이언트 검증 🔲 계획

| 항목 | 내용 |
|------|------|
| **시나리오** | SC-S-005 |
| **파일** | `__tests__/integration/artist-editor.test.tsx` (추가 예정) |
| **대상** | `src/components/ArtistEditor.tsx`: `handleImageUpload()`, `handleGalleryMultiUpload()` |
| **우선순위** | High |
| **전제조건** | TC-I-006 의 file input 캡처 헬퍼 재사용 |

| # | 단계 | 예상 결과 |
|---|------|---------|
| 1 | 대표 이미지에 `image/svg+xml` 파일 제출 | 현재 소스: `validateImageFile` 없이 `uploadImage` 호출. 기대: 업로드 전 거부, `onError` 로 사유 전달 |
| 2 | 대표 이미지에 `size` 15MB JPEG 제출 | 현재 소스: 크기 확인 없이 업로드. 기대: `useImageDropZone` 과 같은 10MB 기준 적용 |
| 3 | 갤러리에 `application/pdf` 파일 제출 | 현재 소스: `accept="image/*"` 는 선택 창 힌트일 뿐이므로 업로드된다. 기대: 거부 |
| 4 | 업로드 실패 시 onError 메시지 | 현재 소스: 원래 오류 메시지를 버리고 `이미지 업로드 중 오류 발생` 으로 고정한다 (TC-I-006 6단계에서 확인) |

- **자동화:** 가능 ✅
- **비고:** 1~3단계 현재 동작은 소스 코드 확인에 근거한다. 우선순위 갭 5순위에 해당한다.

---

### TC-S-006: MiniEditor sanitize 미지정 시 HTML 주입 계약 🔲 계획

| 항목 | 내용 |
|------|------|
| **시나리오** | SC-S-006 |
| **파일** | `__tests__/unit/mini-editor/MiniEditor.regressions.test.tsx` (추가 예정) |
| **대상** | `src/mini-editor/useRichText.ts`: value 주입 effect (`el.innerHTML = fn ? fn(value) : value`) |
| **우선순위** | Medium |

| # | 단계 | 예상 결과 |
|---|------|---------|
| 1 | `sanitize` 없이 `value='<img src="x" onerror="alert(1)">'` 렌더링 | 편집 영역 img 에 `onerror` 속성이 그대로 남는다 (라이브러리는 기본 새니타이저를 제공하지 않는다) |
| 2 | `sanitize` 없이 입력 후 onChange | innerHTML 원문이 그대로 전달된다 |
| 3 | 계약 명시 | 호스트가 `sanitize` 를 지정해야 한다는 사실을 테스트 이름과 문서에 고정한다 |

- **자동화:** 가능 ✅
- **비고:** `MiniEditorProps.sanitize` TSDoc 은 호스트 앱에서 DOMPurify 래퍼 사용을 권장하지만 `README.md` 에는 `sanitize` 언급이 없다.

---

## 6. Performance Tests (성능 테스트)

**목적:** 렌더링·직렬화 처리 시간과 출력 크기를 측정해 성능 저하를 방지한다.

**실행 명령:** `npm run test:performance`

---

### TC-P-001: 대량 블록 렌더링 성능

| 항목 | 내용 |
|------|------|
| **시나리오** | SC-P-001 |
| **파일** | `__tests__/performance/rendering-performance.test.ts` (Large Block Rendering, Complex Block Types Rendering, Memory Efficiency) |
| **대상** | `createHtmlRenderer('perf-test').renderBlocks()` |
| **우선순위** | High |

| # | 단계 | 예상 결과 |
|---|------|---------|
| 1 | paragraph 100개 렌더링, `performance.now()` 로 측정 | 결과 truthy, 100ms 미만 |
| 2 | paragraph 500개 / 1000개 렌더링 | 결과 truthy, 300ms / 500ms 미만 |
| 3 | paragraph·img-full·quote 각 50개 렌더링 | 결과 truthy, 150ms 미만 |
| 4 | paragraph 50개를 10회 반복 렌더링 | 결과 10개, 첫 결과 truthy. `performance.memory` 가 없으면 메모리 증가 단언은 실행되지 않는다 |

- **자동화:** 가능 ✅ | **테스트 수:** 5개 (2026-09-15 실측)
- **비고:** `__tests__/setup.ts` 가 `vi.useFakeTimers({ shouldAdvanceTime: true })` 를 전역 적용하며, Vitest 4.1.7 기본 설정은 `performance` 도 가짜로 대체한다. 워크트리 밖 임시 테스트에서 같은 설정으로 60ms 동기 작업을 측정한 결과 `performance.now()` 차이가 0 이었다. 따라서 이 TC 의 시간 단언은 현재 실패할 수 없다 (허위 양성). 교정은 SC-P-004 에서 다룬다. 2026-03-04 문서 4·5단계 "직렬화·역직렬화 100개 블록" 은 이 파일에 없고 TC-P-003 에 있다.

---

### TC-P-002: 출력 크기 최적화

| 항목 | 내용 |
|------|------|
| **시나리오** | SC-P-002 |
| **파일** | `__tests__/performance/rendering-performance.test.ts` (Output Size Validation) |
| **대상** | 불필요한 공백·과도한 출력이 없는지 확인 |
| **우선순위** | Low |

| # | 단계 | 예상 결과 |
|---|------|---------|
| 1 | paragraph 100개(`Block ${i}`) 렌더링 | HTML 길이 20,000자 미만 |
| 2 | paragraph 10개 렌더링 | `\n\n+` 연속 줄바꿈 발생 수 10 미만 |

- **자동화:** 가능 ✅ | **테스트 수:** 2개 (2026-09-15 실측, 테스트 2개 전체 기재)
- **비고:** 2026-03-04 문서는 이 TC 를 "(예정)" 으로 두고 단일 paragraph 50~200 bytes, divider 최소 크기를 적었지만 해당 단언은 없다. 실제 존재하는 크기 테스트 2개로 단계를 맞추고 완료로 변경했다.

---

### TC-P-003: serializer·renderer 마이크로 벤치마크

| 항목 | 내용 |
|------|------|
| **시나리오** | SC-P-003 |
| **파일** | `__tests__/performance/serializer-renderer-perf.test.ts` (PERF-002) |
| **대상** | `createSerializer('nbe-perf:')`, `createHtmlRenderer('perf-pvb')` |
| **우선순위** | High |
| **전제조건** | 파일 안에서 `vi.useRealTimers()` 로 전환하고 `process.hrtime.bigint()` 로 측정한다 |
| **테스트 데이터** | `makeMixedBlocks(n)`: 22개 타입을 순환하며 모든 필드를 더미 값으로 채운 블록 |

| # | 단계 | 예상 결과 |
|---|------|---------|
| 1 | 100블록 `serialize` 100회 | 출력 길이 > 100, p95 < 2ms, p99 < 5ms |
| 2 | 100블록 `serialize` → `deserialize` | 결과가 원본과 `toEqual` |
| 3 | 100블록 라운드트립 100회 | 마지막 결과 동치, p95 < 5ms, p99 < 10ms |
| 4 | 500블록 `renderBlocks` 30회 | 출력 길이 > 5000, p95 < 5ms, p99 < 15ms |
| 5 | 50블록 `renderBlocks` 를 `Promise.resolve().then` 으로 100건 동시 실행 | 결과 100개 각 길이 > 100, 전체 < 50ms |

- **자동화:** 가능 ✅ | **테스트 수:** 5개 (2026-09-15 실측)
- **실측값 (2026-09-15 전체 실행 로그, `--silent=false`):** SER p95 0.038ms, RT p95 0.182ms, REN500 p95 1.484ms, CONC100 total 2.701ms
- **비고:** 2026-09-15 `npm ci` 직후 첫 전체 실행(JSON 리포터)에서 4단계 `500블록 호출 x30회 — p95 < 5ms` 가 p95 8.457ms 로 실패했다. 이 파일 단독 재실행과 전체 재실행 2회에서는 통과했으므로 워커 병렬 실행 부하에 따른 측정 편차로 판단했다. 0.3.1 에서 `h()` 의 문자열 치환이 3회에서 5회로 늘었지만 재실행 REN500 p95(1.484ms)는 임계값 5ms 의 약 30% 이다. 2026-09-13 로그값(0.934ms)과의 차이가 코드 변경 때문인지는 반복 측정하지 않아 확인하지 않았다.

---

### TC-P-004: PERF-001 시간 측정 교정 🔲 계획

| 항목 | 내용 |
|------|------|
| **시나리오** | SC-P-004 |
| **파일** | `__tests__/performance/rendering-performance.test.ts` (수정 예정) |
| **대상** | PERF-001 시간 측정 방식 |
| **우선순위** | High |

| # | 단계 | 예상 결과 |
|---|------|---------|
| 1 | PERF-001 describe 의 `beforeAll` 에서 `vi.useRealTimers()` 로 전환하고 `afterAll` 에서 복원 (PERF-002 와 같은 방식) | 측정값이 0 이 아닌 실제 경과 시간이 된다 |
| 2 | 교정 후 동일 입력(100/500/1000개) 측정 | 기존 임계값(100/300/500ms) 통과 여부를 실측으로 확인한다 |
| 3 | 측정 구간에 인위적 지연(임계값보다 긴 busy loop)을 넣은 검증용 실행 | 시간 단언이 실패한다 (단언 유효성 확인) |
| 4 | `performance.memory` 미지원 환경(jsdom) | 메모리 단언이 실행되지 않는다는 사실을 테스트에 명시하거나 대체 측정으로 교체한다 |

- **자동화:** 가능 ✅

---

## 7. Accessibility Tests (접근성 테스트)

**목적:** WCAG 2.1 Level AA 준수를 검증한다. 스크린 리더, 키보드 탐색 호환성을 확인한다.

**실행 명령:** `npm run test:accessibility`

**파일 구성:** `__tests__/accessibility/accessibility.test.ts` 는 테스트 46개(통과 20, `it.todo` 26)로 구성된다. 렌더러 출력만 다루며, 컴포넌트 계층 항목은 `it.todo` 에 "Layer Owner" 를 기재해 위임한다. MiniEditor ARIA·단축키는 TC-U-017 이 검증한다.

---

### TC-AC-001: 시맨틱 HTML 구조

| 항목 | 내용 |
|------|------|
| **시나리오** | SC-AC-001 |
| **파일** | `__tests__/accessibility/accessibility.test.ts` (A11Y-001, A11Y-006) |
| **대상** | `createHtmlRenderer()` HTML 출력 |
| **우선순위** | High |
| **기준** | WCAG 2.1 SC 1.3.1 (Info and Relationships) |

| # | 단계 | 예상 결과 |
|---|------|---------|
| 1 | paragraph 블록 HTML | `/<p[\s>]/` 일치 (div 아님) |
| 2 | subheading / en 이 있는 subheading-label | `<h2>` / `<h2...>제목</h2>` |
| 3 | cap 이 있는 img-full / video | `<figure`·`<figcaption` 포함 / `test-vid` figure 와 `<figcaption>영상 설명</figcaption>` |
| 4 | quote + quote-large | `<blockquote ... test-q>`, `<blockquote ... test-ql>` |
| 5 | subheading → subheading-label 연속 렌더링 / subheading 단독 렌더링 | 연속 제목 레벨 차이 1 이하 / 빈 제목 요소 없음 |
| 6 | RTL 텍스트 `عربي محتوى` | 원문 유지 |

- **자동화:** 가능 ✅ | **테스트 수:** 12개 (2026-09-15 실측: 통과 10, todo 2)
- **비고:** todo 2건은 툴바 아이콘 버튼 aria-label (TC-U-017 이 담당) 과 페이지당 h1 1개 (호스트 계층) 이다. 2026-03-04 문서 4단계 "video iframe title 속성 필요" 는 현재 렌더러가 title 을 출력하지 않으므로 SC-AC-009 계획으로 옮겼다.

---

### TC-AC-002: 이미지 대체 텍스트 요구사항

| 항목 | 내용 |
|------|------|
| **시나리오** | SC-AC-002 |
| **파일** | `__tests__/accessibility/accessibility.test.ts` (A11Y-004) |
| **대상** | 이미지 블록 `alt` 출력 |
| **우선순위** | High |
| **기준** | WCAG 2.1 SC 1.1.1 (Non-text Content) |

| # | 단계 | 예상 결과 |
|---|------|---------|
| 1 | img-full cap `Q3 revenue chart` | `alt="Q3 revenue chart"`, `<figcaption>` 에 같은 텍스트 |
| 2 | img-text name `홍길동` | `alt="홍길동"` |
| 3 | img-full cap `Bar chart` | `alt` 값이 image/photo/picture/img 가 아님 |
| 4 | cap 이 없는 img-full | 모든 `<img>` 태그에 `alt=` 속성 존재 |
| 5 | todo 2건 확인 | 장식 이미지 `alt=""`, 복잡한 이미지 긴 설명: 향후 블록 타입 계층 |

- **자동화:** 가능 ✅ | **테스트 수:** 7개 (2026-09-15 실측: 통과 5, todo 2)
- **비고:** 2026-03-04 문서는 이 TC 에 파일과 상태를 적지 않았다. img-pair·gallery 의 alt 반영은 이 파일이 아니라 TC-U-011 이 검증한다.

---

### TC-AC-003: 링크 텍스트 명확성

| 항목 | 내용 |
|------|------|
| **시나리오** | SC-AC-003 |
| **파일** | `__tests__/accessibility/accessibility.test.ts` (A11Y-007) |
| **대상** | 렌더러 앵커 출력 |
| **우선순위** | Medium |
| **기준** | WCAG 2.1 SC 2.4.4 (Link Purpose) |

| # | 단계 | 예상 결과 |
|---|------|---------|
| 1 | paragraph `See our documentation for details.` | `click here`·`more`·`link`·`read more` 앵커 없음 |
| 2 | press-list 외부 링크 (TC-E-002 교차 확인) | `target="_blank" rel="noopener noreferrer"` 포함 |
| 3 | label 이 없는 cta (TC-U-011 교차 확인) | `<a class="test-cta-btn"` 미출력, 빈 텍스트 링크가 생성되지 않는다 |
| 4 | todo 3건 확인 | 링크 목적, 방문 표시, 동일 텍스트 구분: 콘텐츠 작성자·디자인 토큰 계층 |

- **자동화:** 가능 ✅ | **테스트 수:** 4개 (2026-09-15 실측: 통과 1, todo 3)
- **비고:** 1단계 입력에는 링크가 없으므로 단언이 실패할 수 없다. 2026-03-04 문서는 이 TC 에 파일과 상태를 적지 않았다.

---

### TC-AC-004: 렌더러 출력 스타일 가드

| 항목 | 내용 |
|------|------|
| **시나리오** | SC-AC-004 |
| **파일** | `__tests__/accessibility/accessibility.test.ts` (A11Y-003, A11Y-008) |
| **대상** | 렌더러 inline style 출력 |
| **우선순위** | Medium |
| **기준** | WCAG 2.1 SC 1.4.3 (Contrast), SC 2.4.7 (Focus Visible) |

| # | 단계 | 예상 결과 |
|---|------|---------|
| 1 | paragraph 렌더링 | inline `color: white` 와 `background: white` 조합 없음 |
| 2 | paragraph 렌더링 | `font-size: 6~11px` 없음 |
| 3 | paragraph 렌더링 | `outline: 0` 또는 `outline: none` 없음 |
| 4 | todo 10건 확인 | 대비율 2건, 색상 단독 정보, 200% 확대, line-height, 줄 길이, 포커스 표시·초기 포커스·포커스 유지·모달 포커스 트랩: 디자인 토큰·호스트 계층 |

- **자동화:** 가능 ✅ | **테스트 수:** 13개 (2026-09-15 실측: 통과 3, todo 10)
- **비고:** 입력이 paragraph 1종이고 렌더러는 paragraph 에 style 속성을 출력하지 않는다 (inline style 은 spacer `height`, img-inline `width` 뿐이다). 단언은 향후 회귀를 막는 수준이다.

---

### TC-AC-005: 키보드 탐색·폼 접근성 위임 항목 🔲 계획

| 항목 | 내용 |
|------|------|
| **시나리오** | SC-AC-005 |
| **파일** | `__tests__/accessibility/accessibility.test.ts` (A11Y-002, A11Y-005) |
| **대상** | 컴포넌트·호스트 계층으로 위임한 항목 |
| **우선순위** | Medium |

| # | 단계 | 예상 결과 |
|---|------|---------|
| 1 | A11Y-002 `standard formatting shortcuts` | `expect(true).toBe(true)` sentinel 로 항상 통과한다. 실제 검증은 TC-U-017 5·6단계에 있다 |
| 2 | A11Y-002 todo 4건 | 툴바 tab 순서, skip link, 비모달 영역 focus trap, 단축키 안내 |
| 3 | A11Y-005 todo 5건 | label-for-id, 오류 aria-describedby, aria-required, 안내 문구 연결, placeholder 전용 레이블 금지 (Layer Owner 가 "host app forms" 로 기재됨) |
| 4 | A11Y-005 를 라이브러리 컴포넌트 테스트로 전환 | TC-AC-006~008, TC-AC-010 구현으로 대체한다 |

- **자동화:** 가능 ✅ | **테스트 수:** 10개 (2026-09-15 실측: 통과 1(sentinel), todo 9)
- **비고:** 실제 단언이 없으므로 계획으로 분류한다. 이 파일 머리 주석 "this library ships no form components" 는 사실과 달라 2026-09-13 에 정정했다. describe 이름 `A11Y-005: Form Accessibility — N/A (no form components shipped)` 는 테스트 식별자이므로 변경하지 않았다.

---

### TC-AC-006: ImageUploadField 파일 입력 레이블 연결 🔲 계획

| 항목 | 내용 |
|------|------|
| **시나리오** | SC-AC-006 |
| **파일** | `__tests__/accessibility/image-upload-field.a11y.test.tsx` (신규) |
| **대상** | `src/components/ImageUploadField.tsx`: `<input type="file">`, 업로드 영역 `<div>`, × 버튼 |
| **우선순위** | High |
| **기준** | WCAG 2.1 SC 1.3.1, SC 3.3.2 (Labels or Instructions), SC 4.1.2 (Name, Role, Value) |
| **전제조건** | `BlockEditorProvider` 로 감싼다 |

| # | 단계 | 예상 결과 |
|---|------|---------|
| 1 | `getByLabelText(/이미지 업로드/)` 로 파일 입력 조회 | 현재 소스: input 에 `id`·`aria-label`·연결된 `<label>` 이 없어 조회 실패. 기대: 접근 가능한 이름으로 조회된다 |
| 2 | 업로드 영역 역할 확인 (`getByRole('button', { name: /이미지 업로드/ })`) | 현재 소스: `<div>` 에 `role` 없음. 기대: 버튼 역할과 이름을 가진 조작 요소 |
| 3 | `src` 가 있을 때 × 버튼 이름 확인 | 현재 소스: `aria-label` 없음, 이름이 `×`. 기대: `이미지 삭제` 등 의미 있는 이름 |
| 4 | 파일 형식·크기 안내 연결 | 현재 소스: 안내 `<span>` 이 입력과 연결되지 않음. 기대: `aria-describedby` 등으로 연결 |

- **자동화:** 가능 ✅
- **비고:** 1~3단계 현재 상태는 2026-09-13 워크트리 밖 임시 테스트로 확인했다 (`inputLabelled: false`, `zoneRole: null`, `btnAria: null`, `btnText: '×'`).

---

### TC-AC-007: ImageUploadField 키보드 조작 🔲 계획

| 항목 | 내용 |
|------|------|
| **시나리오** | SC-AC-007 |
| **파일** | `__tests__/accessibility/image-upload-field.a11y.test.tsx` (신규) |
| **대상** | `src/components/ImageUploadField.tsx` 업로드 영역 onClick |
| **우선순위** | High |
| **기준** | WCAG 2.1 SC 2.1.1 (Keyboard), SC 2.4.7 (Focus Visible) |

| # | 단계 | 예상 결과 |
|---|------|---------|
| 1 | Tab 으로 업로드 조작 요소에 도달 (`userEvent.tab()`) | 현재 소스: 영역 `<div>` 에 `tabIndex` 가 없고 input 은 `display:none` 이라 포커스 대상이 없다. 기대: 포커스 가능 |
| 2 | 포커스 상태에서 Enter / Space | 현재 소스: `onKeyDown` 없음, 파일 선택 창을 열 수 없다. 기대: 숨겨진 input `click()` 호출 |
| 3 | `src` 가 있을 때 × 버튼에 포커스 후 Enter | 네이티브 `<button>` 이므로 `onClear` 가 호출되어야 한다 (jsdom 에서는 `userEvent.keyboard` 로 확인) |
| 4 | 업로드 중(`isUploading`) 키보드 조작 | 클릭과 같이 파일 선택 창을 열지 않아야 한다 |

- **자동화:** 가능 ✅
- **비고:** `@testing-library/user-event` 는 현재 devDependencies 에 없다. 도입하지 않으면 `fireEvent.keyDown` 과 포커스 가능 여부(`tabIndex`) 단언으로 대체한다.

---

### TC-AC-008: ImageUploadField 오류·진행 상태 안내 🔲 계획

| 항목 | 내용 |
|------|------|
| **시나리오** | SC-AC-008 |
| **파일** | `__tests__/accessibility/image-upload-field.a11y.test.tsx` (신규) |
| **대상** | `src/components/ImageUploadField.tsx`: `.be-error`, `.be-upload-spinner` |
| **우선순위** | Medium |
| **기준** | WCAG 2.1 SC 3.3.1 (Error Identification), SC 4.1.3 (Status Messages) |

| # | 단계 | 예상 결과 |
|---|------|---------|
| 1 | SVG 선택으로 검증 오류 발생 | 현재 소스: `<div class="be-error">` 에 `role="alert"`·`aria-live` 없음. 기대: 스크린 리더에 오류가 안내된다 |
| 2 | 오류와 입력 연결 | 현재 소스: `aria-describedby`·`aria-invalid` 없음. 기대: 오류 메시지가 입력과 연결된다 |
| 3 | 업로드 pending 상태 | 현재 소스: `업로드 중...` / `이미지 최적화 중...` 텍스트만 교체한다. 기대: `role="status"` 또는 `aria-busy` 로 진행 상태 안내 |
| 4 | maxFiles 안내(`최대 N개까지 업로드할 수 있습니다.`) | `useImageDropZone` 을 `multiple` 로 사용하는 호스트 컴포넌트에서도 같은 기준을 적용한다 |

- **자동화:** 가능 ✅

---

### TC-AC-009: video 블록 iframe title 🔲 계획

| 항목 | 내용 |
|------|------|
| **시나리오** | SC-AC-009 |
| **파일** | `__tests__/accessibility/accessibility.test.ts` (추가 예정) |
| **대상** | `src/core/html-renderer.ts`: `video` 분기 |
| **우선순위** | Medium |
| **기준** | WCAG 2.1 SC 4.1.2 (Name, Role, Value) |

| # | 단계 | 예상 결과 |
|---|------|---------|
| 1 | url·cap 이 있는 video 렌더링 | 현재 소스: `<iframe src="..." allowfullscreen>` 에 `title` 없음. 기대: `title` 속성 존재 |
| 2 | cap 이 없는 video 렌더링 | 기대: 기본 title (예: `영상`) 을 출력한다. 값은 결정이 필요하다 |
| 3 | cap 에 큰따옴표 포함 | title 값이 `hAttr()` 로 이스케이프된다 |

- **자동화:** 가능 ✅

---

### TC-AC-010: 편집 컨트롤 접근 가능한 이름 🔲 계획

| 항목 | 내용 |
|------|------|
| **시나리오** | SC-AC-010 |
| **파일** | `__tests__/accessibility/editor-controls.a11y.test.tsx` (신규) |
| **대상** | `src/components/BlockEditor.tsx`, `src/components/BlockRenderer.tsx`, `src/components/ArtistEditor.tsx` |
| **우선순위** | Medium |
| **기준** | WCAG 2.1 SC 3.3.2, SC 4.1.2 |

| # | 단계 | 예상 결과 |
|---|------|---------|
| 1 | BlockRenderer 입력·textarea 이름 확인 | 현재 소스: `placeholder` 만 있고 `<label>`·`aria-label` 없음. 기대: placeholder 외 접근 가능한 이름 |
| 2 | BlockEditor 블록 헤더 `↑` `↓` `×` 버튼 이름 확인 | 현재 소스: 이름이 기호 문자뿐. 기대: `위로 이동`·`아래로 이동`·`블록 삭제` 등 |
| 3 | ArtistEditor textarea 와 `약력 텍스트` 표시 연결 | 현재 소스: 표시 `<div>` 가 textarea 와 연결되지 않음. 기대: 레이블로 연결 |
| 4 | ArtistEditor 대표 이미지 영역 키보드 조작 | 현재 소스: `<div onClick>` 이며 `tabIndex`·`role` 없음. 기대: TC-AC-007 과 같은 기준 |

- **자동화:** 가능 ✅

---

## 8. Smoke Tests (스모크 테스트)

**목적:** 빌드 산출물이 `package.json` exports 계약대로 해석·로드되는지 확인한다. 사전 조사 문서의 공통 갭("block-editor 는 exports 서브패스가 18개인데 스모크가 없다")을 반영해 추가한 도메인이다.

**실행 명령:** 없음 (`package.json` 에 smoke 스크립트가 없어 신규 추가가 필요하다)

---

### TC-SM-001: exports 서브패스 해석·로드 🔲 계획

| 항목 | 내용 |
|------|------|
| **시나리오** | SC-SM-001 |
| **파일** | `__tests__/smoke/exports.test.ts` (신규) |
| **대상** | `package.json` `exports` 18개, `files`, `typesVersions`, `tsup.config.ts` |
| **우선순위** | High |
| **전제조건** | `npm run build` (`tsup && tsc --emitDeclarationOnly --skipLibCheck`) 로 `dist/` 생성. 현재 워크트리에는 `dist/` 가 없으며 이 문서 작성 중 빌드는 실행하지 않았다 |
| **테스트 데이터** | JS 14개: `.`, `./blocks/built-in`, `./components/ArtistEditor`, `./components/BlockEditor`, `./components/BlockPreviewTheme`, `./components/BlockRenderer`, `./components/ImageUploadField`, `./context/BlockEditorProvider`, `./core/html-renderer`, `./core/image-resize`, `./core/serializer`, `./hooks/useImageDropZone`, `./mini-editor/MiniEditor`, `./types` / CSS 4개: `./styles/artist.css`, `./styles/editor.css`, `./styles/mini-editor.css`, `./styles/preview.css` |

| # | 단계 | 예상 결과 |
|---|------|---------|
| 1 | `package.json` exports 키 수 확인 | 18 (JS 14, CSS 4) |
| 2 | JS 서브패스 대상 파일 존재 확인 | `dist/**/*.js` 14개 존재 |
| 3 | 패키지 이름으로 각 JS 서브패스 동적 import | 오류 없이 로드, 대표 export 존재 (`createSerializer`, `createHtmlRenderer`, `MiniEditor`, `BlockPreviewTheme`, `useImageDropZone` 등). `./types` 는 인터페이스·타입 별칭만 선언하므로 런타임 export 가 없어야 정상이다 |
| 4 | CSS 서브패스 4개 확인 | `styles/*.css` 존재, 크기 > 0 (소스 기준 artist 7,531 / editor 9,931 / mini-editor 2,696 / preview 11,381 bytes) |
| 5 | `dist/components/BlockPreviewTheme.js` 내용 확인 | tsup `.css` text 로더 설정에 따라 `styles/preview.css` 본문이 문자열로 포함된다 |
| 6 | 각 JS 서브패스 `.d.ts` 존재 확인 | `typesVersions` 가 `./dist/*` 를 가리키므로 `tsc` 출력(`outDir: ./dist`)에 선언 파일이 있어야 한다 |
| 7 | `npm pack --dry-run` 목록 확인 | `files` 필드에 따라 `dist/`·`styles/` 와 기본 포함 파일만 들어간다 |

- **자동화:** 가능 ✅
- **비고:** `src/mini-editor/useRichText.ts`·`toolbar-config.ts` 는 tsup 빌드 대상이지만 exports 에 없어 외부에서 import 할 수 없다. 사전 조사 판정표는 이 도메인을 "미적용" 으로 기재했다.

---

### TC-SM-002: 루트 엔트리 런타임 export 목록 🔲 계획

| 항목 | 내용 |
|------|------|
| **시나리오** | SC-SM-002 |
| **파일** | `__tests__/smoke/exports.test.ts` (신규) |
| **대상** | `src/index.ts` → `dist/index.js` |
| **우선순위** | Medium |

| # | 단계 | 예상 결과 |
|---|------|---------|
| 1 | `import * as m from '@withwiz/block-editor'` 의 키 목록 | 런타임 export 19개: `createSerializer`, `createHtmlRenderer`, `h`, `nl2br`, `resizeImageIfNeeded`, `validateImageFile`, `validateImageFileDetailed`, `ALLOWED_IMAGE_TYPES`, `BUILT_IN_BLOCKS`, `createEmptyBlock`, `getBlockDef`, `BlockEditorProvider`, `useBlockEditorContext`, `BlockEditor`, `BlockRenderer`, `ImageUploadField`, `ArtistEditor`, `BlockPreviewTheme`, `useImageDropZone` |
| 2 | 루트에 없는 공개 기능 확인 | `MiniEditor`, `validateImageFileAsync`, `hAttr`, `sanitizeUrl`, `sanitizeImageSrc`, `linkify` 는 서브패스로만 제공된다 |
| 3 | `m.ALLOWED_IMAGE_TYPES` | `['image/jpeg', 'image/png', 'image/webp', 'image/gif']` |
| 4 | `m.BUILT_IN_BLOCKS.length` | 22 |

- **자동화:** 가능 ✅

---

## 분류 요약

| 유형 | 파일 수 | 테스트 수 (통과 / todo) | SC 수 (완료 / 계획) | TC 수 (완료 / 계획) |
|------|--------|----------------------|-------------------|-------------------|
| **Unit** | 11개 | 315개 (315 / 0) | 19개 (15 / 4) | 20개 (16 / 4) |
| **Integration** | 2개 | 34개 (34 / 0) | 7개 (6 / 1) | 7개 (6 / 1) |
| **API** | 1개 | 11개 (11 / 0) | 8개 (6 / 2) | 8개 (6 / 2) |
| **E2E** | 3개 | 57개 (57 / 0) | 3개 (3 / 0) | 3개 (3 / 0) |
| **Security** | 3개 | 50개 (50 / 0) | 6개 (4 / 2) | 6개 (4 / 2) |
| **Performance** | 2개 | 12개 (12 / 0) | 4개 (3 / 1) | 4개 (3 / 1) |
| **Accessibility** | 1개 | 46개 (20 / 26) | 10개 (4 / 6) | 10개 (4 / 6) |
| **Smoke (SM)** | 0개 | 0개 | 2개 (0 / 2) | 2개 (0 / 2) |
| **합계** | **23개** | **525개 (499 / 26)** | **59개 (41 / 18)** | **60개 (42 / 18)** |

- 실패 0개, 스킵 0개이다 (첫 실행의 PERF-002 측정 편차 1건은 TC-P-003 비고 참조). todo 26개는 모두 `accessibility.test.ts` 에 있다.
- 2026-09-13 (0.3.0, 파일 22개·테스트 501개) 대비 0.3.1 에서 파일 1개(`attribute-injection.test.tsx` 15건: TC-S-003 10, TC-S-004 5)와 `html-renderer.test.ts` 9건(TC-U-001 5, TC-U-020 4)이 늘었다. 기존 테스트 중 기대값이 바뀐 것은 TC-U-001 3단계 1건이다.
- 2026-03-04 문서는 파일 11개, 테스트 381개를 집계했다. 이번에 새로 집계한 파일 11개는 API 1 (`upload-single.test.ts`: 2026-03-04 `8a99864` 로 이미 존재했으나 집계에서 빠짐), Unit 7 (Provider, image-resize, useImageDropZone, MiniEditor 4종), Integration 1 (ArtistEditor), E2E 1 (MiniEditor 여정), Performance 1 (PERF-002) 이다.
- TC-AC-005 는 계획 상태이지만 파일에 테스트 10개(sentinel 1, todo 9)가 있으므로 테스트 수에는 포함한다.

### 테스트 파일 대조

| 파일 | 도메인 | 테스트 수 | 통과 | todo | 관련 TC |
|------|--------|---------|------|------|--------|
| `__tests__/unit/core/html-renderer.test.ts` | Unit | 58 | 58 | 0 | TC-U-001, TC-U-002, TC-U-020 |
| `__tests__/unit/core/serializer.test.ts` | Unit | 38 | 38 | 0 | TC-U-003 |
| `__tests__/unit/blocks/built-in.test.ts` | Unit | 47 | 47 | 0 | TC-U-004 |
| `__tests__/unit/core/image-resize.test.ts` | Unit | 16 | 16 | 0 | TC-U-005, TC-U-006, TC-U-012 |
| `__tests__/unit/context/BlockEditorProvider.test.tsx` | Unit | 7 | 7 | 0 | TC-U-008 |
| `__tests__/unit/hooks/useImageDropZone.test.tsx` | Unit | 20 | 20 | 0 | TC-U-010 |
| `__tests__/unit/core/html-renderer-blocks.test.ts` | Unit | 85 | 85 | 0 | TC-U-011 |
| `__tests__/unit/mini-editor/toolbar-config.test.ts` | Unit | 5 | 5 | 0 | TC-U-013 |
| `__tests__/unit/mini-editor/useRichText.test.ts` | Unit | 6 | 6 | 0 | TC-U-014 |
| `__tests__/unit/mini-editor/MiniEditor.test.tsx` | Unit | 8 | 8 | 0 | TC-U-015 |
| `__tests__/unit/mini-editor/MiniEditor.regressions.test.tsx` | Unit | 25 | 25 | 0 | TC-U-016, TC-U-017 |
| `__tests__/integration/block-editor-integration.test.ts` | Integration | 28 | 28 | 0 | TC-I-001~005 |
| `__tests__/integration/artist-editor.test.tsx` | Integration | 6 | 6 | 0 | TC-I-006 |
| `__tests__/api/upload-single.test.ts` | API | 11 | 11 | 0 | TC-A-001, 002, 004, 005, 006, 007 |
| `__tests__/e2e/serializer-roundtrip.test.ts` | E2E | 20 | 20 | 0 | TC-E-001 |
| `__tests__/e2e/block-editor-render.test.tsx` | E2E | 31 | 31 | 0 | TC-E-002 |
| `__tests__/e2e/mini-editor-journey.test.tsx` | E2E | 6 | 6 | 0 | TC-E-003 |
| `__tests__/security/xss-prevention.test.ts` | Security | 14 | 14 | 0 | TC-S-001 |
| `__tests__/security/file-upload-validation.test.ts` | Security | 21 | 21 | 0 | TC-S-002 |
| `__tests__/security/attribute-injection.test.tsx` | Security | 15 | 15 | 0 | TC-S-003, TC-S-004 |
| `__tests__/performance/rendering-performance.test.ts` | Performance | 7 | 7 | 0 | TC-P-001, TC-P-002 |
| `__tests__/performance/serializer-renderer-perf.test.ts` | Performance | 5 | 5 | 0 | TC-P-003 |
| `__tests__/accessibility/accessibility.test.ts` | Accessibility | 46 | 20 | 26 | TC-AC-001~005 |
| **합계 23개** | | **525** | **499** | **26** | 누락 파일 0개 |

### 소스 모듈 대조

| 소스 파일 | 추가 시점 | 테스트에서 import 하는 파일 | 관련 SC |
|----------|---------|------------------------|--------|
| `src/core/html-renderer.ts` | 0.1.0 | 10개 | SC-U-001, SC-U-004, SC-U-019, SC-I-001~005, SC-E-001~002, SC-S-001, SC-S-003, SC-P-001~003, SC-AC-001~004, SC-AC-009 |
| `src/core/serializer.ts` | 0.1.0 | 5개 | SC-U-002, SC-E-001, SC-P-003, SC-I-006, SC-S-004 |
| `src/core/image-resize.ts` | 0.1.0 | 3개 (api 파일은 mock 대상으로만 참조) | SC-U-005~007, SC-U-011, SC-S-002, SC-A-003 |
| `src/blocks/built-in.ts` | 0.1.0 | 3개 | SC-U-003, SC-E-001, SC-P-003 |
| `src/context/BlockEditorProvider.tsx` | 0.1.0 | 5개 (api 파일은 mock 대상으로만 참조) | SC-U-008, SC-U-010, SC-I-006, SC-S-004 |
| `src/hooks/useImageDropZone.ts` | 0.1.0 | 2개 | SC-U-010, SC-A-001~008 |
| `src/components/ArtistEditor.tsx` | 0.1.0 | 2개 | SC-I-006, SC-S-004, SC-S-005, SC-AC-010 |
| `src/components/BlockEditor.tsx` | 0.1.0 | 0개 | SC-I-007, SC-AC-010 |
| `src/components/BlockRenderer.tsx` | 0.1.0 | 0개 | SC-U-009, SC-AC-010 |
| `src/components/ImageUploadField.tsx` | 0.1.0 | 0개 | SC-U-017, SC-AC-006~008 |
| `src/mini-editor/toolbar-config.ts` | 0.2.0 | 1개 | SC-U-012 |
| `src/mini-editor/useRichText.ts` | 0.2.0 | 2개 | SC-U-013, SC-U-015 |
| `src/mini-editor/MiniEditor.tsx` | 0.2.0 | 3개 | SC-U-014~016, SC-E-003, SC-S-006 |
| `src/components/BlockPreviewTheme.tsx` | 0.3.0 | 0개 | SC-U-018, SC-SM-001 |
| `src/index.ts`, `src/types.ts`, `src/css.d.ts` | 0.1.0 / 0.3.0 | 타입 import 만 존재 | SC-SM-001, SC-SM-002 |

---

## 도메인 적용성 판정

사전 조사 문서(`WITHWIZ_PACKAGES_TEST_AUDIT.md`, 2026-09-13) 판정표에서 block-editor 열을 옮기고, 코드에서 확인한 근거를 기재한다.

| 도메인 | 사전 조사 판정 | 근거 (코드 확인) | 이 문서 반영 |
|--------|--------------|----------------|------------|
| Unit | 적용 | 순수 함수(core/, blocks/)와 hook·컴포넌트 단위 테스트 파일 11개가 있다 | SC-U-001~019 |
| API | 적용(재정의) | HTTP 서버가 없다. 호스트가 주입하는 `UploadFn` 과 `useImageDropZone` 사이 계약을 API 로 정의한다 | SC-A-001~008 |
| Integration | 적용 | 렌더러 다중 블록 조합, ArtistEditor + Provider + serializer 연동이 있다 | SC-I-001~007 |
| E2E | 적용(명칭 유의) | 브라우저 없이 jsdom 에서 실행한다. `block-editor-render.test.tsx` 는 이름과 달리 `BlockRenderer` 컴포넌트가 아니라 렌더러 출력 HTML 을 DOM 에 마운트한다 | SC-E-001~003 |
| Security | 적용 | 렌더러가 HTML 문자열을 만들고 호스트가 이를 삽입하므로 XSS 방어가 핵심 책임이다. 업로드 파일 검증 로직도 보유한다 | SC-S-001~006 |
| Accessibility | 적용(구현됨) | 렌더러 출력(시맨틱·alt)과 MiniEditor ARIA 는 구현·검증되어 있다. 폼 컴포넌트(ImageUploadField) 접근성 검증은 0건이다 | SC-AC-001~010 |
| Performance | 적용 | 처리 시간 측정 파일 2개가 있다. PERF-001 은 가짜 타이머 때문에 측정값이 0 이다 | SC-P-001~004 |
| Load/Stress (L) | 부분 | 서버 자원이 없다. 동시 호출 결과 일관성은 PERF-002 "htmlRenderer 동시 100건" 1건이 담당하며 Performance(TC-P-003)로 집계한다 | 별도 SC 없음 |
| Smoke (SM) | 미적용 | exports 서브패스 18개(JS 14, CSS 4)를 검증하는 테스트와 스크립트가 없다. 사전 조사 공통 갭 절에 따라 계획 SC 를 추가한다 | SC-SM-001~002 |
| Chaos (C) | 미적용 | 네트워크·저장소 의존은 호스트 `UploadFn` 뒤에 있다. 업로드 reject(TC-A-002, TC-A-006)와 파일 읽기 실패(TC-U-006 6단계) 주입이 장애 경로를 담당한다 | 별도 SC 없음 |

---

## 우선순위 갭

| 순위 | 항목 | 근거 | 관련 SC |
|------|------|------|--------|
| 1 | `ImageUploadField`·`BlockPreviewTheme` 테스트 0건 (사전 조사 6순위) | 두 컴포넌트를 import 하는 테스트 파일이 없다. ImageUploadField 는 레이블·키보드 조작·오류 안내가 없고, × 버튼은 `type` 이 지정되지 않았다 | SC-U-017, SC-U-018, SC-AC-006~008 |
| 2 | `BlockEditor.tsx`(376줄)·`BlockRenderer.tsx`(314줄) 테스트 0건 | 두 컴포넌트를 import 하는 테스트 파일이 없다. 편집 버튼에 `type` 이 지정되지 않았다 | SC-I-007, SC-U-009, SC-AC-010 |
| 3 | 자동 리사이즈가 `useImageDropZone` 경유로 실행되지 않음 | 10MB 고정 검증이 리사이즈보다 먼저 실행되고 `resizeImageIfNeeded` 는 10MB 이하 파일을 축소하지 않는다. ImageUploadField 안내 "10MB 초과시 자동 최적화" 와 실제 동작이 다르다 | SC-A-003, SC-U-007 |
| 4 | PERF-001 시간 단언 허위 양성 | 전역 가짜 타이머 때문에 `performance.now()` 차이가 0 이다 | SC-P-004 |
| 5 | ArtistEditor 업로드 파일 검증 부재 | 업로드 핸들러 2개가 `validateImageFile` 없이 `uploadImage` 를 호출한다 | SC-S-005 |
| 6 | 따옴표로 감싼 URL 의 링크 대상에 닫는 따옴표가 포함됨 (0.3.1 동작 변화) | `h()` 가 만든 `&quot;` 까지 `linkify()` 정규식 `[^\s<]+` 에 일치해 `"https://example.com"` 의 href 파싱 값이 `https://example.com"` 이 된다. 0.3.0 에서는 속성이 끊기면서 href 파싱 값이 `https://example.com` 이었다. 속성 주입은 아니지만 링크 대상이 달라지며 검증 테스트와 기준(URL 끝 문장부호 제외 여부)이 없다 | SC-U-019 (TC-U-020 비고) |
| 7 | exports 18개 Smoke 부재 | dist 산출물을 검증하는 테스트·스크립트가 없다 | SC-SM-001~002 |
| 8 | 커버리지 측정 불가·임계값 미적용 | coverage provider 미설치, 임계값 키 위치가 Vitest 4 설정 형식과 다르다 | "테스트 커버리지 목표" 절 |

### 해소된 갭 (0.3.1)

| 2026-09-13 순위 | 항목 | 해소 내용 | 관련 SC |
|---------------|------|---------|--------|
| 1 | 본문 URL 자동 링크 변환에서 속성 주입 발생 | `977be3f`: `h()` 가 `"`·`'` 를 이스케이프하고 `linkify()` 가 href 값의 따옴표를 이스케이프한다. `attribute-injection.test.tsx` SEC-007·SEC-008 과 `html-renderer.test.ts` 의 `h()`·`nl2br()`·`linkify()` 테스트가 회귀를 막는다 | SC-S-003, SC-U-001, SC-U-019 |
| 2 | ArtistEditor 미리보기·onChange HTML 이미지 속성 미이스케이핑 | `977be3f`: `generateHtml()` 이 대표 이미지·갤러리 src 에 `sanitizeImageSrc()` + `hAttr()` 를 적용하고, 허용되지 않는 주소는 img 를 출력하지 않는다. `attribute-injection.test.tsx` SEC-009 가 회귀를 막는다 | SC-S-004 |

### 문서·명칭 불일치

| 대상 | 내용 |
|------|------|
| `docs/04-report/CHANGELOG.md` | `[0.1.0] - 2026-03-03` 항목까지만 있다. 0.2.0 (MiniEditor, 렌더러 시맨틱 HTML 개선)·0.3.0 (BlockPreviewTheme)·0.3.1 (속성 주입 수정) 기록이 없다. 저장소 루트에는 `CHANGELOG.md` 가 없다 |
| `__tests__/docs/TEST-GUIDE.md` | 테스트 수 불일치는 해소: 2026-09-15 에 0.3.1 실측값(파일 23개·테스트 525개, 통과 499·todo 26, Unit 315, Security 50, `html-renderer.test.ts` 58개, 함수별 h 9·nl2br 6·linkify 4·hAttr 6)으로 정정하고 `attribute-injection.test.tsx` (15개) 를 목록에 추가했다. 예시 코드 시그니처(`h(tag, attrs?, content?)`, `hAttr(attrs)`, `sanitizeUrl` 이 throw), 커버리지 `97%+` 표기, `__mocks__/factories/`·`docs/PDCA-TEST-PHASE-SUMMARY.md` 참조는 실제와 다르며 수정하지 않았다 |
| `__tests__/docs/TEST-SCRIPTS.md`, `docs/04-report/*.md` | `381` 테스트 표기가 남아 있다 (수정하지 않음) |
| `__tests__/accessibility/accessibility.test.ts` | 머리 주석 A11Y-005 설명은 2026-09-13 에 정정했다. describe 이름 `N/A (no form components shipped)` 와 SCOPE NOTE 의 "BlockEditor UI a11y → `__tests__/e2e/block-editor-render.test.tsx`" 는 사실과 다르며 수정하지 않았다 |
| `__tests__/api/upload-single.test.ts` | describe 내부 TC 번호가 이 문서 ID 와 다르다. 3절 대응표를 참조한다 |
| `__tests__/integration/artist-editor.test.tsx` | maxGallery 테스트 이름은 onError 경고를 언급하지만 단언은 onError 미호출을 확인한다 |
| `__tests__/unit/mini-editor/MiniEditor.test.tsx` | `calls onChange when toolbar button is clicked` 단언은 `execCommand` 호출만 확인한다 |
| `__tests__/integration/block-editor-integration.test.ts` | `should escape quotes in attributes` 는 속성 이스케이프를 단언하지 않는다 |
| `__tests__/__mocks__/README.md` | `factories/`·`services/`·`helpers/` 구조를 설명하지만 디렉터리에는 README.md 만 있다 |
| `package.json` `peerDependencies.react` | `>=18.0.0` 이지만 `CLAUDE.md` 는 BlockPreviewTheme 가 React 19 이상을 요구한다고 기재한다 |

---

## 테스트 커버리지 목표

```
vitest.config.ts 기재값        2026-03-04 기록값 (재측정 안 됨)
─────────────────────────      ─────────────────────────
Stmts:    85%                  76.84%
Lines:    85%                  72.04%
Funcs:    85%                  83.92%
Branches: 80%                  81.67%
```

- **2026-09-13·2026-09-15 측정 불가:** `@vitest/coverage-v8` 가 devDependencies 에 없고 `package-lock.json` 에는 vitest 의 선택적 peer 로만 기재되어 설치되지 않으므로, lockfile 고정 설치(`npm ci`) 환경에서 `npm run test:coverage` 를 실행할 수 없다. 위 기록값과 `TEST-GUIDE.md` 의 `97%+` 표기는 서로 다르며 둘 다 현재 코드 기준으로 확인되지 않았다.
- **임계값 설정 형식:** `vitest.config.ts` 는 `coverage.lines`, `coverage.functions` 등을 `coverage` 바로 아래에 지정한다. Vitest 4.1.7 타입 정의에서 이 키는 `CoverageOptions` 에 없으며 (`tsc` 결과 TS2769: `'lines' does not exist in type 'CoverageOptions'`), 임계값은 `coverage.thresholds` 아래에 지정해야 한다.

**개선 우선순위 (테스트 0건 모듈 기준):**
1. `ImageUploadField.tsx`: TC-U-018, TC-AC-006~008
2. `BlockEditor.tsx`: TC-I-007
3. `BlockRenderer.tsx`: TC-U-009
4. `image-resize.ts` Canvas 단계: TC-U-007
5. `BlockPreviewTheme.tsx`: TC-U-019, TC-SM-001

---

## 리뷰 체크리스트

- [x] 사전 조사 판정표에서 적용으로 판정된 7개 도메인(Unit, API, Integration, E2E, Security, Accessibility, Performance) 모두 포함
- [x] Smoke 계획 SC 추가 (exports 18개), Load/Stress·Chaos 는 판정 근거와 함께 별도 SC 를 두지 않음
- [x] 테스트 파일 23개가 모두 TC 에 연결됨 (누락 0개)
- [x] TC 별 테스트 수 합계가 2026-09-15 실측 525개 (통과 499, todo 26) 와 일치
- [x] 완료 TC 단계 표를 실제 테스트 이름·단언 기준으로 작성
- [x] 계획 TC 단계 표를 소스 동작 기준으로 작성 (현재 동작 일부는 워크트리 밖 임시 테스트로 확인)
- [x] 보안·접근성 기준 명시 (OWASP, WCAG)
- [x] 확인된 결함 수정과 테스트 구현: SC-S-003, SC-S-004 (0.3.1, `977be3f`)
- [ ] 따옴표로 감싼 URL 링크 대상 기준 결정과 테스트 추가 (우선순위 갭 6순위)
- [ ] 테스트 0건 컴포넌트 테스트 구현: ImageUploadField, BlockPreviewTheme, BlockEditor, BlockRenderer
- [ ] 자동 리사이즈 경로 기준 결정과 SC-A-003 구현
- [ ] PERF-001 허위 양성 교정 (SC-P-004)
- [ ] exports Smoke 구현과 실행 스크립트 추가
- [ ] 커버리지 측정 환경 구성 (coverage provider 설치, `coverage.thresholds` 형식)
- [x] `TEST-GUIDE.md` 테스트 수를 0.3.1 실측값으로 정정 (2026-09-15)
- [ ] 문서·명칭 불일치 정리 (CHANGELOG, TEST-GUIDE.md 예시 코드·커버리지 표기, TEST-SCRIPTS.md, docs/04-report, 테스트 describe 이름)
