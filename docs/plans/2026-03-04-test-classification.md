# @withwiz/block-editor 테스트 분류 체계

## 개요

| 항목 | 내용 |
|------|------|
| 대상 | `@withwiz/block-editor` React 컴포넌트 라이브러리 |
| 범위 | src/ 전체 (core/, blocks/, components/, context/, hooks/) |
| 환경 | Vitest 4.0.18 + jsdom + @testing-library/react |
| 목표 커버리지 | Stmts 85%, Lines 85%, Funcs 85%, Branches 80% |

---

## 시나리오 목록

| ID | 시나리오 | 유형 | 우선순위 | 상태 |
|----|---------|------|---------|------|
| SC-U-001 | HTML 이스케이핑 함수 검증 | Unit | Critical | ✅ 완료 |
| SC-U-002 | 직렬화/역직렬화 기능 검증 | Unit | Critical | ✅ 완료 |
| SC-U-003 | 22개 내장 블록 정의 검증 | Unit | High | ✅ 완료 |
| SC-U-004 | 모든 블록 타입 HTML 렌더링 검증 | Unit | High | ✅ 완료 |
| SC-U-005 | 이미지 유효성 검사 (sync) | Unit | High | 🔲 계획 |
| SC-U-006 | 이미지 유효성 검사 (async, magic number) | Unit | High | 🔲 계획 |
| SC-U-007 | 이미지 리사이즈 로직 (Canvas API 모킹) | Unit | High | 🔲 계획 |
| SC-U-008 | BlockEditorProvider 컨텍스트 제공 | Unit | Medium | 🔲 계획 |
| SC-U-009 | BlockRenderer 에디터 폼 렌더링 | Unit | Medium | 🔲 계획 |
| SC-U-010 | useImageDropZone hook 동작 | Unit | Medium | 🔲 계획 |
| SC-I-001 | 블록 렌더러 → HTML 출력 파이프라인 | Integration | Critical | ✅ 완료 |
| SC-I-002 | 이미지 처리 파이프라인 | Integration | High | ✅ 완료 |
| SC-I-003 | 멀티 블록 타입 혼합 렌더링 | Integration | High | ✅ 완료 |
| SC-I-004 | XSS 방어 통합 시나리오 | Integration | Critical | ✅ 완료 |
| SC-A-001 | JWT 인증 성공 이미지 업로드 | API | Critical | 🔲 계획 |
| SC-A-002 | JWT 만료/미인증 → 401 에러 처리 | API | Critical | 🔲 계획 |
| SC-A-003 | 파일 크기 초과 → 클라이언트 사전 차단 | API | High | 🔲 계획 |
| SC-A-004 | 비허용 MIME 타입 → 클라이언트 거부 | API | High | 🔲 계획 |
| SC-A-005 | UploadResult url/key 필드 계약 검증 | API | High | 🔲 계획 |
| SC-A-006 | 네트워크 오류 → 에러 상태 복원 | API | Medium | 🔲 계획 |
| SC-E-001 | 블록 데이터 → 직렬화 → 역직렬화 → 렌더링 풀 사이클 | E2E | Critical | ✅ 완료 |
| SC-E-002 | React 컴포넌트 렌더링 E2E | E2E | High | ✅ 완료 |
| SC-S-001 | XSS 공격 방어 (텍스트 콘텐츠) | Security | Critical | ✅ 완료 |
| SC-S-002 | 파일 업로드 보안 검증 | Security | Critical | ✅ 완료 |
| SC-P-001 | 대량 블록 렌더링 성능 | Performance | High | ✅ 완료 |
| SC-AC-001 | WCAG 2.1 AA 준수 검증 | Accessibility | High | ✅ 완료 |

---

## 1. Unit Tests (단위 테스트)

**목적:** 개별 함수/모듈을 독립적으로 검증. 외부 의존성 없이 순수 로직만 테스트.

**실행 명령:** `npm run test:unit`

---

### TC-U-001: HTML 이스케이핑 함수 (h, nl2br, hAttr)

| 항목 | 내용 |
|------|------|
| **파일** | `__tests__/unit/core/html-renderer.test.ts` |
| **대상** | `src/core/html-renderer.ts` — `h()`, `nl2br()`, `hAttr()` |
| **우선순위** | Critical |
| **전제조건** | 없음 (순수 함수) |
| **테스트 데이터** | `'Tom & Jerry'`, `'<script>'`, `'안녕 "하세요"'` |

| # | 단계 | 예상 결과 |
|---|------|---------|
| 1 | `h('Tom & Jerry')` 호출 | `'Tom &amp; Jerry'` 반환 |
| 2 | `h('<script>')` 호출 | `'&lt;script&gt;'` 반환 |
| 3 | `nl2br('첫 줄\n둘째 줄')` 호출 | `'첫 줄<br>둘째 줄'` 반환 |
| 4 | `hAttr('제목: "Hello"')` 호출 | `'제목: &quot;Hello&quot;'` 반환 |
| 5 | `h(null)`, `h(undefined)` 호출 | `''` 반환 (크래시 없음) |

- **자동화:** 가능 ✅ | **테스트 수:** 49개 (현재)

---

### TC-U-002: URL 새니타이저 (sanitizeUrl, sanitizeImageSrc)

| 항목 | 내용 |
|------|------|
| **파일** | `__tests__/unit/core/html-renderer.test.ts` |
| **대상** | `src/core/html-renderer.ts` — `sanitizeUrl()`, `sanitizeImageSrc()` |
| **우선순위** | Critical |

| # | 단계 | 예상 결과 |
|---|------|---------|
| 1 | `sanitizeUrl('javascript:alert(1)')` | `''` 반환 |
| 2 | `sanitizeUrl('data:text/html,...')` | `''` 반환 |
| 3 | `sanitizeUrl('https://example.com')` | 원본 URL 반환 |
| 4 | `sanitizeUrl('/relative/path')` | `/relative/path` 반환 |
| 5 | `sanitizeUrl('https://a.com" onclick="x')` | `''` 반환 (속성 주입 차단) |

- **자동화:** 가능 ✅

---

### TC-U-003: 직렬화/역직렬화 (createSerializer)

| 항목 | 내용 |
|------|------|
| **파일** | `__tests__/unit/core/serializer.test.ts` |
| **대상** | `src/core/serializer.ts` — `createSerializer()` |
| **우선순위** | Critical |
| **테스트 데이터** | 13가지 블록 타입 라운드트립 케이스 |

| # | 단계 | 예상 결과 |
|---|------|---------|
| 1 | `serialize(blocks)` 호출 | `<!-- BK_DATA_V1{base64} -->` 포함 문자열 반환 |
| 2 | `deserialize(serialized)` 호출 | 원본 blocks 배열과 `toEqual` |
| 3 | 마커 없는 HTML 역직렬화 | `null` 반환 |
| 4 | 손상된 base64 역직렬화 | `null` 반환 (크래시 없음) |
| 5 | 100개 블록 라운드트립 | 모든 블록 데이터 보존 |

- **자동화:** 가능 ✅ | **테스트 수:** 38개 (현재)

---

### TC-U-004: 내장 블록 정의 (BUILT_IN_BLOCKS)

| 항목 | 내용 |
|------|------|
| **파일** | `__tests__/unit/blocks/built-in.test.ts` |
| **대상** | `src/blocks/built-in.ts` — `BUILT_IN_BLOCKS`, `createEmptyBlock()` |
| **우선순위** | High |

| # | 단계 | 예상 결과 |
|---|------|---------|
| 1 | `BUILT_IN_BLOCKS.length` 확인 | `22` |
| 2 | 각 블록 `type`, `label`, `icon`, `createEmpty` 존재 확인 | 모두 정의됨 |
| 3 | `createEmpty()` 호출 | 유효한 BlockData 반환, `id`는 숫자 |
| 4 | 모든 블록 타입이 유일한지 확인 | 중복 없음 |

- **자동화:** 가능 ✅ | **테스트 수:** 47개 (현재)

---

### TC-U-005: 이미지 유효성 검사 sync (validateImageFile) 🔲 계획

| 항목 | 내용 |
|------|------|
| **파일** | `__tests__/unit/core/image-resize-validate.test.ts` (신규) |
| **대상** | `src/core/image-resize.ts` — `validateImageFile()` |
| **우선순위** | High |

| # | 단계 | 예상 결과 |
|---|------|---------|
| 1 | SVG MIME 타입 파일 검증 | `{ valid: false, error: 'SVG...' }` |
| 2 | 빈 파일(0 bytes) 검증 | `{ valid: false, error: '비어있습니다' }` |
| 3 | 10MB 초과 파일 검증 | `{ valid: false, error: '10MB...' }` |
| 4 | `../etc/passwd.jpg` 파일명 검증 | `{ valid: false, error: '경로...' }` |
| 5 | `photo.jpg.exe` 이중 확장자 검증 | `{ valid: false, error: '확장자...' }` |
| 6 | 정상 JPEG 파일 검증 | `{ valid: true, hasMetadata: true }` |
| 7 | GIF 파일 검증 | `{ valid: true, hasMetadata: false }` |

- **자동화:** 가능 ✅

---

### TC-U-006: 이미지 유효성 검사 async + magic number (validateImageFileAsync) 🔲 계획

| 항목 | 내용 |
|------|------|
| **파일** | `__tests__/unit/core/image-resize-async.test.ts` (신규) |
| **대상** | `src/core/image-resize.ts` — `validateImageFileAsync()` |
| **우선순위** | High |
| **전제조건** | jsdom에서 `File`, `ArrayBuffer` API 지원됨 |
| **테스트 데이터** | 각 포맷별 정확한 magic bytes 배열 |

| # | 단계 | 예상 결과 |
|---|------|---------|
| 1 | `[0xFF,0xD8,0xFF,...]` + `image/jpeg` | `{ valid: true }` |
| 2 | `[0x89,0x50,0x4E,0x47,...]` + `image/jpeg` | `{ valid: false, error: 'JPEG...' }` (불일치) |
| 3 | `[0x89,0x50,0x4E,0x47,...]` + `image/png` | `{ valid: true }` |
| 4 | `[0x47,0x49,0x46,...]` + `image/gif` | `{ valid: true }` |
| 5 | WebP RIFF 헤더 + `image/webp` | `{ valid: true }` |
| 6 | sync 실패 케이스(SVG)는 magic number 미검사 | `{ valid: false }` |

- **자동화:** 가능 ✅

---

### TC-U-007: 이미지 리사이즈 (resizeImageIfNeeded) 🔲 계획

| 항목 | 내용 |
|------|------|
| **파일** | `__tests__/unit/core/image-resize-resize.test.ts` (신규) |
| **대상** | `src/core/image-resize.ts` — `resizeImageIfNeeded()` |
| **우선순위** | High |
| **전제조건** | `Image`, `URL.createObjectURL`, `canvas.toBlob` vi.mock 필요 |

| # | 단계 | 예상 결과 |
|---|------|---------|
| 1 | 1MB JPEG 파일 | `{ wasResized: false, file: 원본 }` |
| 2 | 정확히 10MB 파일 | `{ wasResized: false }` (임계값 포함) |
| 3 | 15MB JPEG 파일 + Canvas 모킹(5MB 출력) | `{ wasResized: true, newSize: 5MB }` |
| 4 | GIF 파일 (크기 무관) | `{ wasResized: false }` (애니메이션 보존) |
| 5 | PNG 입력 → 출력 파일 타입 | `image/jpeg`로 변환됨 |
| 6 | `my-photo.jpeg` → 출력 파일명 | `my-photo.jpg` |

- **자동화:** 가능 ✅ (Canvas API 전체 모킹 필요)

---

### TC-U-008: BlockEditorProvider 컨텍스트 🔲 계획

| 항목 | 내용 |
|------|------|
| **파일** | `__tests__/unit/context/BlockEditorProvider.test.tsx` (신규) |
| **대상** | `src/context/BlockEditorProvider.tsx` |
| **우선순위** | Medium |
| **전제조건** | React + @testing-library/react |

| # | 단계 | 예상 결과 |
|---|------|---------|
| 1 | Provider 없이 `useBlockEditorContext()` 호출 | `Error: BlockEditorProvider is required` throw |
| 2 | 기본 props로 Provider 렌더링 | `autoResize=true`, `maxSizeMB=10` |
| 3 | `autoResize={false}` 전달 | 컨텍스트에 `false` 반영 |
| 4 | `maxSizeMB={5}` 전달 | 컨텍스트에 `5` 반영 |

- **자동화:** 가능 ✅

---

### TC-U-009: BlockRenderer 에디터 폼 🔲 계획

| 항목 | 내용 |
|------|------|
| **파일** | `__tests__/unit/components/BlockRenderer.test.tsx` (신규) |
| **대상** | `src/components/BlockRenderer.tsx` |
| **우선순위** | Medium |
| **전제조건** | `ImageUploadField` vi.mock |

| # | 단계 | 예상 결과 |
|---|------|---------|
| 1 | `paragraph` 블록 렌더링 | `<textarea>` 포함 |
| 2 | textarea 변경 | `updateBlock(id, 'text', 새값)` 호출 |
| 3 | `spacer` 블록 렌더링 | `<select>` 사이즈 옵션 |
| 4 | `stats` 블록 items 2개 | `.be-stats-row` 2개 렌더링 |
| 5 | `+ 항목 추가` 클릭 | `addSubItem(id, 'stats')` 호출 |
| 6 | `unknown` 타입 블록 | `null` 반환 |

- **자동화:** 가능 ✅

---

### TC-U-010: useImageDropZone hook 🔲 계획

| 항목 | 내용 |
|------|------|
| **파일** | `__tests__/unit/hooks/useImageDropZone.test.tsx` (신규) |
| **대상** | `src/hooks/useImageDropZone.ts` |
| **우선순위** | Medium |
| **전제조건** | `useBlockEditorContext` vi.mock, `resizeImageIfNeeded` vi.mock |

| # | 단계 | 예상 결과 |
|---|------|---------|
| 1 | 초기 상태 | `isDragOver=false`, `isUploading=false`, `error=null` |
| 2 | 유효 파일 업로드 성공 | `onUpload(result)` 호출됨 |
| 3 | 업로드 실패 | `error` 상태 설정 + `onError` 호출 |
| 4 | SVG 파일 업로드 시도 | `error` 설정, `onUpload` 미호출 |
| 5 | `disabled=true` | 파일 처리 안 함 |
| 6 | `onDragEnter` Files 타입 | `isDragOver=true` |
| 7 | `onDragLeave` | `isDragOver=false` |

- **자동화:** 가능 ✅

---

## 2. Integration Tests (통합 테스트)

**목적:** 모듈 간 상호작용 검증. 실제 의존성을 사용하되 외부 API는 제외.

**실행 명령:** `npm run test:integration`

---

### TC-I-001: 블록 렌더러 ↔ HTML 출력 통합

| 항목 | 내용 |
|------|------|
| **파일** | `__tests__/integration/block-editor-integration.test.ts` |
| **대상** | `createHtmlRenderer()` + `BlockData` 타입 연동 |
| **우선순위** | Critical |

| # | 단계 | 예상 결과 |
|---|------|---------|
| 1 | paragraph 블록 → HTML | `<p class="prefix-p">텍스트</p>` |
| 2 | 블록 순서 유지 확인 | 첫 번째 < 두 번째 < 세 번째 인덱스 |
| 3 | XSS 문자 포함 블록 렌더링 | `&lt;script&gt;`로 이스케이핑 |
| 4 | 빈 블록 배열 렌더링 | 빈 문자열 또는 빈 wrapper |

- **자동화:** 가능 ✅ | **테스트 수:** 28개 (현재)

---

### TC-I-002: 이미지 처리 파이프라인 통합

| 항목 | 내용 |
|------|------|
| **파일** | `__tests__/integration/block-editor-integration.test.ts` |
| **대상** | `img-full`, `img-inline`, `img-text` 블록 → HTML |
| **우선순위** | High |

| # | 단계 | 예상 결과 |
|---|------|---------|
| 1 | 안전한 `/image.jpg` src → 렌더링 | img 태그 포함, src 보존 |
| 2 | `javascript:alert()` src → 렌더링 | img 태그에 javascript: 미포함 |
| 3 | `data:image/svg+xml,...` src → 렌더링 | data: URL 미포함 |
| 4 | 속성 주입 `src=".." onload=..` → 렌더링 | `onload` 속성 미포함 |

- **자동화:** 가능 ✅

---

### TC-I-003: 복합 블록 워크플로우 통합

| 항목 | 내용 |
|------|------|
| **파일** | `__tests__/integration/block-editor-integration.test.ts` |
| **대상** | 6개 혼합 블록 타입 동시 렌더링 |
| **우선순위** | High |

| # | 단계 | 예상 결과 |
|---|------|---------|
| 1 | paragraph + img-full + quote + cta 6개 블록 렌더링 | 모든 내용 포함 |
| 2 | 블록 간 구분자 확인 | `</p>\n<p` 패턴 |
| 3 | press-list 2개 아이템 렌더링 | 두 매체명 모두 포함 |

- **자동화:** 가능 ✅

---

## 3. API Tests (이미지 업로드 API 연동 테스트)

**목적:** 라이브러리의 핵심 통합 지점인 **이미지 업로드 API** 검증.
`BlockEditorProvider`에 주입되는 `UploadFn`이 JWT Bearer 토큰 인증 방식의 실제 API를 호출하므로, 해당 계약과 에러 시나리오를 테스트한다.

```
UploadFn 흐름:
사용자 이미지 선택
  → useImageDropZone.processFiles()
  → resizeImageIfNeeded() (선택적)
  → uploadImage(file)          ← UploadFn 호출
      → POST /api/upload
          Authorization: Bearer <JWT>
          Content-Type: multipart/form-data
      → { url: string, key: string }
  → onUpload(result)
  → block.src = result.url
```

**실행 명령:** `npm run test:api` (신규 스크립트 필요)

**테스트 전략:** `vi.fn()`으로 `UploadFn`을 대체하거나 MSW로 fetch를 가로채서 API 계약을 검증

---

### TC-A-001: JWT 인증 성공 업로드

| 항목 | 내용 |
|------|------|
| **파일** | `__tests__/api/image-upload.test.ts` (신규) |
| **대상** | `UploadFn = (file: File) => Promise<UploadResult>` 계약 |
| **우선순위** | Critical |
| **전제조건** | 유효한 JWT 토큰, 유효한 이미지 파일 |
| **테스트 데이터** | `Authorization: Bearer eyJhbGciOi...`, JPEG 파일 1MB |

| # | 단계 | 예상 결과 |
|---|------|---------|
| 1 | 유효 JWT + 유효 이미지 → `POST /api/upload` | HTTP 200 |
| 2 | 응답 body | `{ url: "https://cdn.../img.jpg", key: "abc123" }` |
| 3 | `url` 필드 | CDN URL 형태 (`https://` 시작) |
| 4 | `key` 필드 | 비어있지 않은 문자열 |
| 5 | `result.url`이 이후 블록 src에 삽입됨 | block.src === result.url |

- **자동화:** 가능 ✅ (vi.fn mock 또는 MSW)

---

### TC-A-002: JWT 인증 실패 — 401 Unauthorized

| 항목 | 내용 |
|------|------|
| **파일** | `__tests__/api/image-upload.test.ts` (신규) |
| **대상** | `UploadFn` 에러 전파 계약 |
| **우선순위** | Critical |
| **전제조건** | 만료되거나 유효하지 않은 JWT 토큰 |
| **테스트 데이터** | `Authorization: Bearer EXPIRED_TOKEN` |

| # | 단계 | 예상 결과 |
|---|------|---------|
| 1 | 만료 JWT + 이미지 → 업로드 시도 | `UploadFn` throw 또는 reject |
| 2 | `useImageDropZone`의 catch 블록 실행 | `error` 상태에 메시지 설정 |
| 3 | `onError(message)` 호출 | 에러 콜백 호출됨 |
| 4 | `onUpload` 미호출 | 블록 src 변경 없음 |
| 5 | Authorization 헤더 없는 요청 | 동일하게 401 처리 |

- **자동화:** 가능 ✅

---

### TC-A-003: 파일 크기 초과 — 413 Payload Too Large

| 항목 | 내용 |
|------|------|
| **파일** | `__tests__/api/image-upload.test.ts` (신규) |
| **대상** | 서버 측 파일 크기 제한 처리 |
| **우선순위** | High |
| **전제조건** | 유효 JWT, 클라이언트 리사이즈 후에도 큰 파일 |
| **테스트 데이터** | JPEG 12MB (리사이즈 후에도 10MB 초과) |

| # | 단계 | 예상 결과 |
|---|------|---------|
| 1 | autoResize=true, 리사이즈 후 10MB 초과 | 업로드 전 클라이언트 에러 (`useImageDropZone` 라인 67–71) |
| 2 | `result.file.size > maxSize` 조건 | `setError('이미지 크기를...')` 호출 |
| 3 | `onUpload` 미호출 | 서버 요청 자체가 발생하지 않음 |

- **자동화:** 가능 ✅ (Canvas 모킹으로 리사이즈 결과 제어)

---

### TC-A-004: 지원하지 않는 파일 형식 — 415 Unsupported Media Type

| 항목 | 내용 |
|------|------|
| **파일** | `__tests__/api/image-upload.test.ts` (신규) |
| **대상** | 클라이언트/서버 MIME 타입 검증 계층 |
| **우선순위** | High |
| **테스트 데이터** | `image/bmp`, `application/pdf` 등 비허용 MIME 타입 |

| # | 단계 | 예상 결과 |
|---|------|---------|
| 1 | BMP 파일 업로드 시도 | 클라이언트 `validateImageFile` 단계에서 거부 |
| 2 | 서버 요청 미발생 | `uploadImage()` 미호출 |
| 3 | `onError` 호출됨 | 에러 메시지: `'지원하지 않는 파일 형식'` 포함 |

- **자동화:** 가능 ✅

---

### TC-A-005: UploadResult 계약 — url/key 필드 보장

| 항목 | 내용 |
|------|------|
| **파일** | `__tests__/api/image-upload.test.ts` (신규) |
| **대상** | `UploadResult = { url: string; key?: string }` 타입 계약 |
| **우선순위** | High |

| # | 단계 | 예상 결과 |
|---|------|---------|
| 1 | `key` 없는 응답 `{ url: "..." }` | 업로드 성공, `onKeyTracked` 미호출 |
| 2 | `key` 있는 응답 `{ url: "...", key: "abc" }` | `onKeyTracked("abc")` 호출 |
| 3 | `url`이 빈 문자열인 응답 | block.src에 빈 문자열 삽입 (방어 코드 필요 여부 확인) |
| 4 | 응답에 `url` 없음 (`undefined`) | `block.src = undefined` — 타입 오류 감지 대상 |

- **자동화:** 가능 ✅

---

### TC-A-006: 네트워크 오류 처리

| 항목 | 내용 |
|------|------|
| **파일** | `__tests__/api/image-upload.test.ts` (신규) |
| **대상** | `useImageDropZone` 네트워크 오류 처리 (lines 94–98) |
| **우선순위** | Medium |

| # | 단계 | 예상 결과 |
|---|------|---------|
| 1 | `uploadImage` → `network error` throw | catch 블록 실행 |
| 2 | `error` 상태 | `'업로드 중 오류 발생'` 또는 Error.message |
| 3 | `onError(msg)` 호출 | 에러 핸들러 트리거 |
| 4 | `isUploading` 상태 | finally에서 `false`로 복원 |

- **자동화:** 가능 ✅

---

### API 테스트 구현 전략

```typescript
// __tests__/api/image-upload.test.ts 구조
import { vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// 전략 1: vi.fn()으로 UploadFn 직접 모킹
const mockUploadFn = vi.fn<[File], Promise<UploadResult>>();

// 성공 케이스
mockUploadFn.mockResolvedValue({
  url: 'https://cdn.example.com/images/abc.jpg',
  key: 'abc123'
});

// 401 케이스
mockUploadFn.mockRejectedValue(new Error('401 Unauthorized'));

// 전략 2: MSW(Mock Service Worker) 사용 (선택)
// import { setupServer } from 'msw/node'
// import { http, HttpResponse } from 'msw'
// server.use(
//   http.post('/api/upload', ({ request }) => {
//     const auth = request.headers.get('Authorization')
//     if (!auth?.startsWith('Bearer ')) return HttpResponse.json({}, { status: 401 })
//     return HttpResponse.json({ url: 'https://cdn.../img.jpg', key: 'abc' })
//   })
// )
```

**JWT 토큰 테스트 데이터:**
```typescript
const VALID_JWT   = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0In0.SIGNATURE';
const EXPIRED_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2MDAwMDAwMDB9.EXPIRED';
const NO_JWT      = '';
```

**package.json 스크립트 추가 필요:**
```json
"test:api": "vitest run __tests__/api"
```

---

## 4. E2E Tests (엔드-투-엔드 테스트)

**목적:** 블록 에디터의 전체 사용자 흐름을 처음부터 끝까지 검증.
직렬화 → 저장 → 역직렬화 → 렌더링의 완전한 사이클.

**실행 명령:** `npm run test:e2e`

---

### TC-E-001: 직렬화 라운드트립 풀 사이클

| 항목 | 내용 |
|------|------|
| **파일** | `__tests__/e2e/serializer-roundtrip.test.ts` |
| **대상** | `createSerializer` + `createHtmlRenderer` + `BUILT_IN_BLOCKS` 연동 |
| **우선순위** | Critical |

| # | 단계 | 예상 결과 |
|---|------|---------|
| 1 | `BlockData[]` 생성 | 유효한 배열 |
| 2 | `serialize(blocks)` | HTML 주석 포함 문자열 |
| 3 | `deserialize(serialized)` | 원본 blocks와 `toEqual` |
| 4 | `renderBlocks(deserialized)` | 원본과 동일한 HTML 출력 |
| 5 | 22개 블록 타입 전체 라운드트립 | 모든 타입 데이터 손실 없음 |
| 6 | 한글 + 이모지 + 특수문자 포함 라운드트립 | 정확히 보존 |

- **자동화:** 가능 ✅ | **테스트 수:** 20개 (현재)

---

### TC-E-002: React 컴포넌트 E2E 렌더링

| 항목 | 내용 |
|------|------|
| **파일** | `__tests__/e2e/block-editor-render.test.tsx` |
| **대상** | React 환경에서 전체 블록 렌더링 플로우 |
| **우선순위** | High |
| **전제조건** | jsdom + React 18+ |

| # | 단계 | 예상 결과 |
|---|------|---------|
| 1 | 모든 22개 블록 타입 렌더링 | 각 블록 타입별 HTML 출력 검증 |
| 2 | 빈 /null 필드 블록 렌더링 | 크래시 없음, 빈 문자열 반환 |
| 3 | XSS 페이로드 포함 블록 렌더링 | 이스케이핑된 안전한 HTML |
| 4 | prefix별 CSS 클래스 분리 | `nbe-pvb-p` vs `rm-bk-p` 독립 적용 |

- **자동화:** 가능 ✅ | **테스트 수:** 31개 (현재)

---

## 5. Security Tests (보안 테스트)

**목적:** XSS, 파일 업로드 보안 취약점 검증. OWASP Top 10 기준.

**실행 명령:** `npm run test:security`

---

### TC-S-001: XSS 방어 (Cross-Site Scripting Prevention)

| 항목 | 내용 |
|------|------|
| **파일** | `__tests__/security/xss-prevention.test.ts` |
| **대상** | `src/core/html-renderer.ts` — `sanitizeUrl()`, `h()` |
| **우선순위** | Critical |
| **테스트 데이터** | OWASP XSS 치트시트 기반 페이로드 |

| # | 단계 | 예상 결과 |
|---|------|---------|
| 1 | `javascript:alert("xss")` URL | `''` 반환 |
| 2 | `JAVASCRIPT:alert(1)` (대소문자 우회) | `''` 반환 |
| 3 | `data:text/html,<script>` | `''` 반환 |
| 4 | `vbscript:msgbox(1)` | `''` 반환 |
| 5 | `<img src=x onerror=alert(1)>` 텍스트 | `&lt;img...&gt;` 이스케이핑 |
| 6 | `href=".." onclick="steal()"` 속성 주입 | `''` 반환 |
| 7 | `file:///etc/passwd` | `''` 반환 |

- **자동화:** 가능 ✅ | **테스트 수:** 14개 (현재)
- **관련 요구사항:** OWASP A03:2021 Injection

---

### TC-S-002: 파일 업로드 보안 검증

| 항목 | 내용 |
|------|------|
| **파일** | `__tests__/security/file-upload-validation.test.ts` |
| **대상** | `src/core/image-resize.ts` — `validateImageFile()`, `validateImageFileAsync()` |
| **우선순위** | Critical |

| # | 단계 | 예상 결과 |
|---|------|---------|
| 1 | `image/svg+xml` MIME 타입 업로드 | 거부 (SVG XSS 위험) |
| 2 | `.php`, `.exe` 확장자 위장 파일 | 거부 |
| 3 | `../path/traversal.jpg` 파일명 | 거부 (경로 탐색 방지) |
| 4 | `photo.jpg.exe` 이중 확장자 | 거부 |
| 5 | 50MB 초과 파일 | 거부 (DoS 방지) |
| 6 | Magic number 불일치 (JPEG 클레임, PNG 실제) | async 검증에서 거부 |

- **자동화:** 가능 ✅ | **테스트 수:** 21개 (현재)
- **관련 요구사항:** OWASP A04:2021 Insecure Design

---

## 6. Performance Tests (성능 테스트)

**목적:** 렌더링 속도, 메모리 효율성 측정. 실제 사용 시 성능 저하 방지.

**실행 명령:** `npm run test:performance`

---

### TC-P-001: 대량 블록 렌더링 성능

| 항목 | 내용 |
|------|------|
| **파일** | `__tests__/performance/rendering-performance.test.ts` |
| **대상** | `createHtmlRenderer().renderBlocks()` |
| **우선순위** | High |

| # | 단계 | 예상 결과 |
|---|------|---------|
| 1 | 100개 paragraph 블록 렌더링 | **100ms 이내** 완료 |
| 2 | 500개 블록 렌더링 | **300ms 이내** 완료 |
| 3 | 1000개 블록 렌더링 | **500ms 이내** 완료 |
| 4 | 직렬화 100개 블록 | 적절한 시간 내 완료 |
| 5 | 역직렬화 100개 블록 | 적절한 시간 내 완료 |

- **자동화:** 가능 ✅ | **테스트 수:** 7개 (현재)
- **비고:** `performance.now()` 사용, 환경별 편차 주의

---

### TC-P-002: 출력 크기 최적화 (예정)

| 항목 | 내용 |
|------|------|
| **대상** | 불필요한 공백/태그가 없는지 확인 |
| **우선순위** | Low |

| # | 단계 | 예상 결과 |
|---|------|---------|
| 1 | 단일 paragraph 블록 HTML 크기 | 50~200 bytes 범위 |
| 2 | divider 블록 HTML 크기 | 최소 크기 |

- **자동화:** 가능 ✅

---

## 7. Accessibility Tests (접근성 테스트)

**목적:** WCAG 2.1 Level AA 준수 검증. 스크린 리더, 키보드 네비게이션 호환성.

**실행 명령:** `npm run test:accessibility`

---

### TC-AC-001: 시맨틱 HTML 구조

| 항목 | 내용 |
|------|------|
| **파일** | `__tests__/accessibility/accessibility.test.ts` |
| **대상** | `createHtmlRenderer()` HTML 출력 |
| **우선순위** | High |

| # | 단계 | 예상 결과 |
|---|------|---------|
| 1 | paragraph 블록 HTML | `<p>` 태그 사용 (div 아님) |
| 2 | 이미지 블록 HTML | `<img alt="">` alt 속성 포함 |
| 3 | 링크 블록 HTML | `<a href="...">` 텍스트 포함 |
| 4 | video 블록 | `<iframe>` title 속성 필요 |
| 5 | quote 블록 | 적절한 시맨틱 마크업 |

- **자동화:** 가능 ✅ | **테스트 수:** 41개 (현재)

---

### TC-AC-002: 이미지 대체 텍스트 요구사항

| 항목 | 내용 |
|------|------|
| **우선순위** | High |
| **기준** | WCAG 2.1 SC 1.1.1 (Non-text Content) |

| # | 단계 | 예상 결과 |
|---|------|---------|
| 1 | `img-full` 블록 → HTML | `<img alt="">` alt 속성 있음 |
| 2 | `img-pair` 블록 → HTML | 모든 img 태그에 alt 있음 |
| 3 | `gallery` 블록 → HTML | 3개 img 모두 alt 있음 |
| 4 | cap 필드 있을 때 | `<div class="...-cap">` 텍스트 포함 |

- **관련 요구사항:** WCAG 2.1 SC 1.1.1

---

### TC-AC-003: 링크 텍스트 명확성

| 항목 | 내용 |
|------|------|
| **우선순위** | Medium |
| **기준** | WCAG 2.1 SC 2.4.4 (Link Purpose) |

| # | 단계 | 예상 결과 |
|---|------|---------|
| 1 | press-list 외부 링크 | `target="_blank" rel="noopener noreferrer"` 포함 |
| 2 | cta 블록 버튼 | `<a>` 텍스트가 비어있지 않음 |

---

## 분류 요약

| 유형 | 현재 파일 수 | 현재 테스트 수 | 계획 파일 수 | 계획 추가 테스트 |
|------|------------|-------------|------------|---------------|
| **Unit** | 4개 | 219개 | +6개 | +약 50개 |
| **Integration** | 1개 | 28개 | - | - |
| **API** | 0개 (신규) | 0개 | +1개 | +6개 |
| **E2E** | 2개 | 51개 | - | - |
| **Security** | 2개 | 35개 | - | - |
| **Performance** | 1개 | 7개 | - | - |
| **Accessibility** | 1개 | 41개 | - | - |
| **합계** | **11개** | **381개** | **+7개** | **+약 60개** |

---

## 테스트 커버리지 목표

```
현재 (2026-03-04)          목표
─────────────────────────  ─────────────────────────
Stmts:    76.84% ❌         85%+ ✅
Lines:    72.04% ❌         85%+ ✅
Funcs:    83.92% ❌         85%+ ✅
Branches: 81.67% ✅         80%+ ✅
```

**개선 우선순위:**
1. `image-resize.ts` — 42% → 90%+ (TC-U-005, TC-U-006, TC-U-007)
2. `BlockEditorProvider.tsx` — 0% → 90%+ (TC-U-008)
3. `BlockRenderer.tsx` — 0% → 80%+ (TC-U-009)
4. `useImageDropZone.ts` — 0% → 75%+ (TC-U-010)

---

## 리뷰 체크리스트

- [x] 7개 테스트 유형 모두 포함
- [x] Happy Path / 예외 케이스 모두 정의
- [x] 경계값 테스트 포함 (10MB 임계값, 빈 배열, null)
- [x] 테스트 데이터 명확 (bytes 배열, 파일 크기 MB 단위)
- [x] 단계가 재현 가능 (순수 함수, 모킹 전략 명시)
- [x] 예상 결과 검증 가능 (구체적 값 또는 패턴)
- [x] 보안 기준 명시 (OWASP, WCAG)
- [ ] image-resize 계획 테스트 구현 필요
- [ ] 커버리지 임계값 달성 필요
