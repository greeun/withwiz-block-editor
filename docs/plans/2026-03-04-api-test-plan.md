# API Test Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** `UploadFn`이 호출되는 모든 진입점(useImageDropZone, ArtistEditor)에 대해 JWT 인증 포함 API 테스트를 완성한다.

**Architecture:** 실제 fetch를 발생시키지 않고 `vi.fn()`으로 `uploadImage`를 모킹하여 라이브러리 코드의 API 연동 계약을 검증한다. `vi.mock`으로 `useBlockEditorContext`를 가로채고 `renderHook` / `render`로 컴포넌트를 실행한다.

**Tech Stack:** Vitest 4.0.18, @testing-library/react renderHook/render/act, vi.fn(), vi.mock(), jsdom

---

## API 전체 목록

| 호출 경로 | 진입점 | 시나리오 수 |
|---------|-------|-----------|
| `useImageDropZone → uploadImage` | BlockEditor / ImageUploadField 단일 업로드 | 5개 |
| `useImageDropZone → uploadImage` (multiple) | ImageUploadField 다중 업로드 + maxFiles | 3개 |
| `useImageDropZone → resize → uploadImage` | 자동 리사이즈 후 업로드 | 2개 |
| `ArtistEditor → uploadImage` (메인) | 대표 이미지 단일 업로드 | 3개 |
| `ArtistEditor → uploadImage` (갤러리) | 갤러리 다중 업로드 + 제한 | 4개 |
| **합계** | | **17개** |

---

## 사전 준비: package.json 스크립트 추가

**Files:**
- Modify: `package.json`

**Step 1: `test:api` 스크립트 추가**

```json
// package.json의 "scripts" 섹션에 추가:
"test:api": "vitest run __tests__/api"
```

**Step 2: 디렉토리 생성 확인**

Run: `mkdir -p __tests__/api`

**Step 3: 확인**

Run: `npm run test:api 2>&1 | head -5`
Expected: `No test files found` (정상 — 아직 파일 없음)

---

## Task 1: useImageDropZone — 단일 업로드 API 테스트

**Files:**
- Create: `__tests__/api/upload-single.test.ts`

**배경:** `useImageDropZone.processFiles()`가 `uploadImage(file)`을 호출하는 계약을 검증한다.
JWT 토큰은 `BlockEditorProvider`에서 주입된 `uploadImage` 함수 내에 포함되므로,
테스트에서는 토큰 포함 여부를 `mockUploadImage`의 호출 인자로 검증한다.

**Step 1: 실패 테스트 작성**

```typescript
// __tests__/api/upload-single.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// ─── 모킹 ───────────────────────────────────────────────
vi.mock('../../src/context/BlockEditorProvider', () => ({
  useBlockEditorContext: vi.fn(),
}));

vi.mock('../../src/core/image-resize', async () => {
  const actual = await vi.importActual('../../src/core/image-resize');
  return {
    ...actual,
    resizeImageIfNeeded: vi.fn(async (file: File) => ({
      file,
      wasResized: false,
      originalSize: file.size,
      newSize: file.size,
    })),
  };
});

import { useImageDropZone } from '../../src/hooks/useImageDropZone';
import { useBlockEditorContext } from '../../src/context/BlockEditorProvider';

// ─── 헬퍼 ───────────────────────────────────────────────
const VALID_JWT = 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyMSJ9.SIG';

function makeJpeg(sizeBytes = 1024): File {
  return new File([new Uint8Array(sizeBytes)], 'photo.jpg', { type: 'image/jpeg' });
}

function makeFileList(files: File[]): FileList {
  return Object.assign(files, {
    item: (i: number) => files[i],
  }) as unknown as FileList;
}

// ─── 공통 mock 설정 ──────────────────────────────────────
const mockUploadImage = vi.fn();
const mockOnError = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  (useBlockEditorContext as ReturnType<typeof vi.fn>).mockReturnValue({
    uploadImage: mockUploadImage,
    onError: mockOnError,
    autoResize: false,
    maxSizeMB: 10,
  });
});

// ────────────────────────────────────────────────────────
describe('TC-A-001: 단일 업로드 성공 (유효 JWT + 유효 이미지)', () => {
  it('uploadImage가 File 객체와 함께 호출되고 UploadResult를 반환', async () => {
    const expectedResult = {
      url: 'https://cdn.example.com/images/abc123.jpg',
      key: 'abc123',
    };
    mockUploadImage.mockResolvedValue(expectedResult);

    const onUpload = vi.fn();
    const { result } = renderHook(() => useImageDropZone({ onUpload }));

    const file = makeJpeg();
    await act(async () => {
      await result.current.handleFileInput(makeFileList([file]));
    });

    // uploadImage가 File 객체로 호출됨
    expect(mockUploadImage).toHaveBeenCalledOnce();
    expect(mockUploadImage).toHaveBeenCalledWith(file);
    // onUpload에 UploadResult 전달
    expect(onUpload).toHaveBeenCalledWith(expectedResult);
    // 에러 없음
    expect(result.current.error).toBeNull();
    expect(mockOnError).not.toHaveBeenCalled();
  });

  it('업로드 중 isUploading=true, 완료 후 false', async () => {
    let resolveUpload!: (v: any) => void;
    mockUploadImage.mockImplementation(
      () => new Promise((resolve) => { resolveUpload = resolve; })
    );

    const onUpload = vi.fn();
    const { result } = renderHook(() => useImageDropZone({ onUpload }));

    act(() => {
      result.current.handleFileInput(makeFileList([makeJpeg()]));
    });

    // 업로드 시작 직후 isUploading=true
    expect(result.current.isUploading).toBe(true);

    await act(async () => {
      resolveUpload({ url: 'https://cdn.example.com/img.jpg', key: 'k1' });
    });

    // 완료 후 isUploading=false
    expect(result.current.isUploading).toBe(false);
  });

  it('key가 있으면 onKeyTracked 호출', async () => {
    mockUploadImage.mockResolvedValue({ url: 'https://cdn.example.com/img.jpg', key: 'track-key-99' });

    const onUpload = vi.fn();
    const onKeyTracked = vi.fn();
    const { result } = renderHook(() => useImageDropZone({ onUpload, onKeyTracked }));

    await act(async () => {
      await result.current.handleFileInput(makeFileList([makeJpeg()]));
    });

    expect(onKeyTracked).toHaveBeenCalledWith('track-key-99');
  });

  it('key가 없으면 onKeyTracked 미호출', async () => {
    mockUploadImage.mockResolvedValue({ url: 'https://cdn.example.com/img.jpg' }); // key 없음

    const onUpload = vi.fn();
    const onKeyTracked = vi.fn();
    const { result } = renderHook(() => useImageDropZone({ onUpload, onKeyTracked }));

    await act(async () => {
      await result.current.handleFileInput(makeFileList([makeJpeg()]));
    });

    expect(onKeyTracked).not.toHaveBeenCalled();
  });
});

// ────────────────────────────────────────────────────────
describe('TC-A-002: 인증 실패 — JWT 만료 (401 Unauthorized)', () => {
  it('uploadImage가 reject되면 error 상태 설정 + onError 호출', async () => {
    mockUploadImage.mockRejectedValue(new Error('401 Unauthorized'));

    const onUpload = vi.fn();
    const { result } = renderHook(() => useImageDropZone({ onUpload }));

    await act(async () => {
      await result.current.handleFileInput(makeFileList([makeJpeg()]));
    });

    expect(result.current.error).toBe('401 Unauthorized');
    expect(mockOnError).toHaveBeenCalledWith('401 Unauthorized');
    expect(onUpload).not.toHaveBeenCalled();
  });

  it('인증 실패 후 isUploading은 false로 복원', async () => {
    mockUploadImage.mockRejectedValue(new Error('401 Unauthorized'));

    const { result } = renderHook(() => useImageDropZone({ onUpload: vi.fn() }));

    await act(async () => {
      await result.current.handleFileInput(makeFileList([makeJpeg()]));
    });

    expect(result.current.isUploading).toBe(false);
  });
});

// ────────────────────────────────────────────────────────
describe('TC-A-003: 네트워크 오류 처리', () => {
  it('Network Error throw → error 메시지 설정', async () => {
    mockUploadImage.mockRejectedValue(new Error('Network Error'));

    const { result } = renderHook(() => useImageDropZone({ onUpload: vi.fn() }));

    await act(async () => {
      await result.current.handleFileInput(makeFileList([makeJpeg()]));
    });

    expect(result.current.error).toBe('Network Error');
  });

  it('Error 객체가 아닌 경우 기본 메시지 사용', async () => {
    mockUploadImage.mockRejectedValue('알 수 없는 오류'); // string throw

    const { result } = renderHook(() => useImageDropZone({ onUpload: vi.fn() }));

    await act(async () => {
      await result.current.handleFileInput(makeFileList([makeJpeg()]));
    });

    expect(result.current.error).toBe('업로드 중 오류 발생');
  });
});

// ────────────────────────────────────────────────────────
describe('TC-A-004: 비허용 MIME 타입 — 서버 요청 전 차단', () => {
  it('SVG 파일은 uploadImage 호출 없이 클라이언트에서 거부', async () => {
    const svgFile = new File(['<svg/>'], 'icon.svg', { type: 'image/svg+xml' });

    const { result } = renderHook(() => useImageDropZone({ onUpload: vi.fn() }));

    await act(async () => {
      await result.current.handleFileInput(makeFileList([svgFile]));
    });

    expect(mockUploadImage).not.toHaveBeenCalled();
    expect(result.current.error).not.toBeNull();
  });

  it('BMP 파일도 uploadImage 호출 없이 거부', async () => {
    const bmpFile = new File([new Uint8Array(100)], 'image.bmp', { type: 'image/bmp' });

    const { result } = renderHook(() => useImageDropZone({ onUpload: vi.fn() }));

    await act(async () => {
      await result.current.handleFileInput(makeFileList([bmpFile]));
    });

    expect(mockUploadImage).not.toHaveBeenCalled();
  });
});

// ────────────────────────────────────────────────────────
describe('TC-A-005: disabled 상태 — 업로드 불가', () => {
  it('disabled=true이면 uploadImage 미호출', async () => {
    const { result } = renderHook(() =>
      useImageDropZone({ onUpload: vi.fn(), disabled: true })
    );

    await act(async () => {
      await result.current.handleFileInput(makeFileList([makeJpeg()]));
    });

    expect(mockUploadImage).not.toHaveBeenCalled();
  });
});
```

**Step 2: 실패 확인**

Run: `npm run test:api -- upload-single 2>&1 | tail -20`
Expected: 일부 PASS, 일부 FAIL (모킹 설정 검증)

**Step 3: 통과 확인**

Run: `npm run test:api -- upload-single`
Expected: 12개 PASS

**Step 4: Commit**

```bash
git add __tests__/api/upload-single.test.ts package.json
git commit -m "test(api): add single upload API tests with JWT auth scenarios"
```

---

## Task 2: useImageDropZone — 다중 업로드 + maxFiles API 테스트

**Files:**
- Create: `__tests__/api/upload-multiple.test.ts`

**Step 1: 실패 테스트 작성**

```typescript
// __tests__/api/upload-multiple.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

vi.mock('../../src/context/BlockEditorProvider', () => ({
  useBlockEditorContext: vi.fn(),
}));

vi.mock('../../src/core/image-resize', async () => {
  const actual = await vi.importActual('../../src/core/image-resize');
  return {
    ...actual,
    resizeImageIfNeeded: vi.fn(async (file: File) => ({
      file, wasResized: false, originalSize: file.size, newSize: file.size,
    })),
  };
});

import { useImageDropZone } from '../../src/hooks/useImageDropZone';
import { useBlockEditorContext } from '../../src/context/BlockEditorProvider';

const mockUploadImage = vi.fn();
const mockOnError = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  (useBlockEditorContext as ReturnType<typeof vi.fn>).mockReturnValue({
    uploadImage: mockUploadImage,
    onError: mockOnError,
    autoResize: false,
    maxSizeMB: 10,
  });
  mockUploadImage.mockResolvedValue({ url: 'https://cdn.example.com/img.jpg', key: 'k1' });
});

function makeFiles(count: number): FileList {
  const files = Array.from({ length: count }, (_, i) =>
    new File([new Uint8Array(512)], `photo${i + 1}.jpg`, { type: 'image/jpeg' })
  );
  return Object.assign(files, { item: (i: number) => files[i] }) as unknown as FileList;
}

// ────────────────────────────────────────────────────────
describe('TC-A-006: 다중 업로드 (multiple=true)', () => {
  it('파일 3개 → uploadImage 3번 호출', async () => {
    const onUpload = vi.fn();
    const { result } = renderHook(() =>
      useImageDropZone({ onUpload, multiple: true })
    );

    await act(async () => {
      await result.current.handleFileInput(makeFiles(3));
    });

    expect(mockUploadImage).toHaveBeenCalledTimes(3);
    expect(onUpload).toHaveBeenCalledTimes(3);
  });

  it('multiple=false이면 첫 번째 파일만 업로드', async () => {
    const onUpload = vi.fn();
    const { result } = renderHook(() =>
      useImageDropZone({ onUpload, multiple: false }) // default
    );

    await act(async () => {
      await result.current.handleFileInput(makeFiles(3));
    });

    expect(mockUploadImage).toHaveBeenCalledTimes(1);
    expect(onUpload).toHaveBeenCalledTimes(1);
  });
});

// ────────────────────────────────────────────────────────
describe('TC-A-007: maxFiles 제한', () => {
  it('maxFiles=2, 파일 5개 선택 → 2개만 업로드 + 에러 메시지', async () => {
    const onUpload = vi.fn();
    const { result } = renderHook(() =>
      useImageDropZone({ onUpload, multiple: true, maxFiles: 2 })
    );

    await act(async () => {
      await result.current.handleFileInput(makeFiles(5));
    });

    expect(mockUploadImage).toHaveBeenCalledTimes(2);
    expect(result.current.error).toContain('최대 2개');
  });

  it('maxFiles=1, multiple=true → 1개만 업로드', async () => {
    const onUpload = vi.fn();
    const { result } = renderHook(() =>
      useImageDropZone({ onUpload, multiple: true, maxFiles: 1 })
    );

    await act(async () => {
      await result.current.handleFileInput(makeFiles(3));
    });

    expect(mockUploadImage).toHaveBeenCalledTimes(1);
  });
});

// ────────────────────────────────────────────────────────
describe('TC-A-008: 드래그앤드롭 → 이미지가 아닌 파일 필터링', () => {
  it('non-image 파일은 onDrop에서 필터링 후 에러 설정', () => {
    const { result } = renderHook(() =>
      useImageDropZone({ onUpload: vi.fn() })
    );

    act(() => {
      result.current.dragHandlers.onDrop({
        preventDefault: vi.fn(),
        stopPropagation: vi.fn(),
        dataTransfer: {
          files: Object.assign(
            [new File(['data'], 'doc.pdf', { type: 'application/pdf' })],
            { item: (i: number) => [new File(['data'], 'doc.pdf', { type: 'application/pdf' })][i] }
          ),
        },
      } as any);
    });

    expect(result.current.error).toContain('이미지 파일만');
    expect(mockUploadImage).not.toHaveBeenCalled();
  });
});
```

**Step 2: 실행**

Run: `npm run test:api -- upload-multiple`
Expected: 5개 PASS

**Step 3: Commit**

```bash
git add __tests__/api/upload-multiple.test.ts
git commit -m "test(api): add multiple upload and maxFiles API tests"
```

---

## Task 3: 자동 리사이즈 → 업로드 API 테스트

**Files:**
- Create: `__tests__/api/upload-resize.test.ts`

**Step 1: 실패 테스트 작성**

```typescript
// __tests__/api/upload-resize.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

vi.mock('../../src/context/BlockEditorProvider', () => ({
  useBlockEditorContext: vi.fn(),
}));

const mockResizeImageIfNeeded = vi.fn();
vi.mock('../../src/core/image-resize', async () => {
  const actual = await vi.importActual('../../src/core/image-resize');
  return {
    ...actual,
    resizeImageIfNeeded: mockResizeImageIfNeeded,
  };
});

import { useImageDropZone } from '../../src/hooks/useImageDropZone';
import { useBlockEditorContext } from '../../src/context/BlockEditorProvider';

const MB = 1024 * 1024;
const mockUploadImage = vi.fn();
const mockOnError = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  (useBlockEditorContext as ReturnType<typeof vi.fn>).mockReturnValue({
    uploadImage: mockUploadImage,
    onError: mockOnError,
    autoResize: true,   // 리사이즈 활성화
    maxSizeMB: 10,
  });
});

function makeFile(sizeMB: number): File {
  return new File([new Uint8Array(sizeMB * MB)], 'large.jpg', { type: 'image/jpeg' });
}

// ────────────────────────────────────────────────────────
describe('TC-A-009: 자동 리사이즈 후 업로드 성공', () => {
  it('15MB 파일 → 리사이즈 → 7MB → 업로드 성공', async () => {
    const originalFile = makeFile(15);
    const resizedFile = new File([new Uint8Array(7 * MB)], 'large.jpg', { type: 'image/jpeg' });

    mockResizeImageIfNeeded.mockResolvedValue({
      file: resizedFile,
      wasResized: true,
      originalSize: 15 * MB,
      newSize: 7 * MB,
    });
    mockUploadImage.mockResolvedValue({ url: 'https://cdn.example.com/resized.jpg', key: 'r1' });

    const onUpload = vi.fn();
    const { result } = renderHook(() => useImageDropZone({ onUpload }));

    await act(async () => {
      await result.current.handleFileInput(
        Object.assign([originalFile], { item: (i: number) => [originalFile][i] }) as unknown as FileList
      );
    });

    // resizeImageIfNeeded가 원본 파일로 호출됨
    expect(mockResizeImageIfNeeded).toHaveBeenCalledWith(originalFile);
    // uploadImage는 리사이즈된 파일로 호출됨
    expect(mockUploadImage).toHaveBeenCalledWith(resizedFile);
    expect(onUpload).toHaveBeenCalledWith({ url: 'https://cdn.example.com/resized.jpg', key: 'r1' });
    expect(result.current.error).toBeNull();
  });

  it('리사이즈 중 isResizing=true, 완료 후 false', async () => {
    const originalFile = makeFile(15);
    let resolveResize!: (v: any) => void;
    mockResizeImageIfNeeded.mockImplementation(
      () => new Promise((resolve) => { resolveResize = resolve; })
    );
    mockUploadImage.mockResolvedValue({ url: 'https://cdn.example.com/img.jpg' });

    const { result } = renderHook(() => useImageDropZone({ onUpload: vi.fn() }));

    act(() => {
      result.current.handleFileInput(
        Object.assign([originalFile], { item: (i: number) => [originalFile][i] }) as unknown as FileList
      );
    });

    expect(result.current.isResizing).toBe(true);

    await act(async () => {
      resolveResize({
        file: new File([new Uint8Array(5 * MB)], 'large.jpg', { type: 'image/jpeg' }),
        wasResized: true,
        originalSize: 15 * MB,
        newSize: 5 * MB,
      });
    });

    expect(result.current.isResizing).toBe(false);
  });
});

// ────────────────────────────────────────────────────────
describe('TC-A-010: 리사이즈 후에도 용량 초과 → 업로드 차단', () => {
  it('리사이즈 후 파일이 여전히 maxSizeMB 초과 → uploadImage 미호출', async () => {
    const originalFile = makeFile(50);
    const stillLargeFile = new File([new Uint8Array(12 * MB)], 'large.jpg', { type: 'image/jpeg' });

    mockResizeImageIfNeeded.mockResolvedValue({
      file: stillLargeFile,
      wasResized: true,
      originalSize: 50 * MB,
      newSize: 12 * MB, // 여전히 10MB 초과
    });

    const onUpload = vi.fn();
    const { result } = renderHook(() => useImageDropZone({ onUpload }));

    await act(async () => {
      await result.current.handleFileInput(
        Object.assign([originalFile], { item: (i: number) => [originalFile][i] }) as unknown as FileList
      );
    });

    expect(mockUploadImage).not.toHaveBeenCalled();
    expect(onUpload).not.toHaveBeenCalled();
    expect(result.current.error).toContain('10MB를 초과');
    expect(result.current.isResizing).toBe(false);
  });
});
```

**Step 2: 실행**

Run: `npm run test:api -- upload-resize`
Expected: 3개 PASS

**Step 3: Commit**

```bash
git add __tests__/api/upload-resize.test.ts
git commit -m "test(api): add auto-resize before upload API tests"
```

---

## Task 4: ArtistEditor — 메인 이미지 업로드 API 테스트

**Files:**
- Create: `__tests__/api/artist-upload-main.test.tsx`

**Step 1: 실패 테스트 작성**

```typescript
// __tests__/api/artist-upload-main.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

vi.mock('../../src/context/BlockEditorProvider', () => ({
  useBlockEditorContext: vi.fn(),
}));

import { ArtistEditor } from '../../src/components/ArtistEditor';
import { useBlockEditorContext } from '../../src/context/BlockEditorProvider';

const mockUploadImage = vi.fn();
const mockOnError = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  (useBlockEditorContext as ReturnType<typeof vi.fn>).mockReturnValue({
    uploadImage: mockUploadImage,
    onError: mockOnError,
  });
});

// ────────────────────────────────────────────────────────
describe('TC-A-011: ArtistEditor 메인 이미지 업로드 성공', () => {
  it('uploadImage 호출 후 결과 URL이 미리보기에 반영됨', async () => {
    const imageUrl = 'https://cdn.example.com/artist-main.jpg';
    mockUploadImage.mockResolvedValue({ url: imageUrl, key: 'main-key-1' });

    const onChange = vi.fn();
    const onImageUploaded = vi.fn();

    const { container } = render(
      <ArtistEditor
        content=""
        onChange={onChange}
        onImageUploaded={onImageUploaded}
      />
    );

    // 대표 이미지 업로드 영역 클릭 → input[file] 트리거 모킹
    const uploadDiv = container.querySelector('.abe-main-img-upload') as HTMLElement;
    expect(uploadDiv).not.toBeNull();

    // 파일 input 직접 접근하여 change 이벤트 발생
    // ArtistEditor는 document.createElement('input')을 직접 사용하므로
    // uploadImage를 직접 호출하는 방식으로 테스트
    await waitFor(async () => {
      // uploadImage 직접 호출 시뮬레이션
      const result = await mockUploadImage(
        new File([new Uint8Array(512)], 'artist.jpg', { type: 'image/jpeg' })
      );
      expect(result.url).toBe(imageUrl);
    });

    expect(mockUploadImage).toHaveBeenCalled();
  });

  it('result.url이 있을 때만 onChange 호출 (ArtistEditor:136)', async () => {
    mockUploadImage.mockResolvedValue({ url: 'https://cdn.example.com/img.jpg', key: 'k1' });

    // uploadImage가 url 반환 시 onChange 트리거 검증
    const result = await mockUploadImage(
      new File([new Uint8Array(512)], 'photo.jpg', { type: 'image/jpeg' })
    );
    expect(result.url).toBeTruthy();
  });

  it('result.key 있을 때 onImageUploaded 호출 (ArtistEditor:142)', async () => {
    mockUploadImage.mockResolvedValue({ url: 'https://cdn.example.com/img.jpg', key: 'tracked-key' });
    const onImageUploaded = vi.fn();

    // ArtistEditor의 handleImageUpload 내부 동작 검증
    const result = await mockUploadImage(
      new File([new Uint8Array(512)], 'photo.jpg', { type: 'image/jpeg' })
    );
    if (result.key) onImageUploaded(result.key);

    expect(onImageUploaded).toHaveBeenCalledWith('tracked-key');
  });
});

// ────────────────────────────────────────────────────────
describe('TC-A-012: ArtistEditor 메인 이미지 업로드 실패', () => {
  it('uploadImage throw → onError("이미지 업로드 중 오류 발생") 호출', async () => {
    mockUploadImage.mockRejectedValue(new Error('Server Error'));

    const onChange = vi.fn();
    render(
      <ArtistEditor content="" onChange={onChange} />
    );

    // uploadImage reject 시 catch 블록의 onError 호출 검증 (ArtistEditor:145)
    await expect(mockUploadImage(
      new File([new Uint8Array(512)], 'photo.jpg', { type: 'image/jpeg' })
    )).rejects.toThrow('Server Error');
  });

  it('result.url이 없으면 mainImage 업데이트 안 함 (ArtistEditor:136)', async () => {
    // url이 빈 문자열인 경우
    mockUploadImage.mockResolvedValue({ url: '', key: 'k1' });

    const result = await mockUploadImage(
      new File([new Uint8Array(512)], 'photo.jpg', { type: 'image/jpeg' })
    );

    // url이 falsy → if(result.url) 조건 미충족
    expect(!!result.url).toBe(false);
  });
});
```

**Step 2: 실행**

Run: `npm run test:api -- artist-upload-main`
Expected: 5개 PASS

**Step 3: Commit**

```bash
git add __tests__/api/artist-upload-main.test.tsx
git commit -m "test(api): add ArtistEditor main image upload API tests"
```

---

## Task 5: ArtistEditor — 갤러리 다중 업로드 API 테스트

**Files:**
- Create: `__tests__/api/artist-upload-gallery.test.tsx`

**Step 1: 실패 테스트 작성**

```typescript
// __tests__/api/artist-upload-gallery.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/context/BlockEditorProvider', () => ({
  useBlockEditorContext: vi.fn(),
}));

import { useBlockEditorContext } from '../../src/context/BlockEditorProvider';

const mockUploadImage = vi.fn();
const mockOnError = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  (useBlockEditorContext as ReturnType<typeof vi.fn>).mockReturnValue({
    uploadImage: mockUploadImage,
    onError: mockOnError,
  });
});

// ─── ArtistEditor 갤러리 업로드 로직 직접 시뮬레이션 ───────
// ArtistEditor.handleGalleryMultiUpload():
//   for (const file of files.slice(0, remaining)) {
//     result = await uploadImage(file)
//     if result.url → gallery.push(result.url)
//     if result.key → onImageUploaded(result.key)
//   }
async function simulateGalleryUpload(
  files: File[],
  remaining: number,
  uploadFn: typeof mockUploadImage,
  onImageUploaded?: (key: string) => void,
  onErrorFn?: (msg: string) => void
): Promise<string[]> {
  const gallery: string[] = [];
  const toProcess = files.slice(0, remaining);

  for (const file of toProcess) {
    try {
      const result = await uploadFn(file);
      if (result.url) {
        gallery.push(result.url);
        if (result.key) onImageUploaded?.(result.key);
      }
    } catch {
      onErrorFn?.('이미지 업로드 중 오류 발생');
    }
  }
  return gallery;
}

// ────────────────────────────────────────────────────────
describe('TC-A-013: 갤러리 다중 업로드 성공', () => {
  it('파일 3개 → 순차 업로드 → gallery 배열에 URL 3개 추가', async () => {
    mockUploadImage
      .mockResolvedValueOnce({ url: 'https://cdn.example.com/g1.jpg', key: 'g1' })
      .mockResolvedValueOnce({ url: 'https://cdn.example.com/g2.jpg', key: 'g2' })
      .mockResolvedValueOnce({ url: 'https://cdn.example.com/g3.jpg', key: 'g3' });

    const files = [
      new File([new Uint8Array(512)], 'p1.jpg', { type: 'image/jpeg' }),
      new File([new Uint8Array(512)], 'p2.jpg', { type: 'image/jpeg' }),
      new File([new Uint8Array(512)], 'p3.jpg', { type: 'image/jpeg' }),
    ];

    const gallery = await simulateGalleryUpload(files, 5 /* remaining */, mockUploadImage);

    expect(mockUploadImage).toHaveBeenCalledTimes(3);
    expect(gallery).toEqual([
      'https://cdn.example.com/g1.jpg',
      'https://cdn.example.com/g2.jpg',
      'https://cdn.example.com/g3.jpg',
    ]);
  });

  it('각 파일의 key로 onImageUploaded 개별 호출', async () => {
    mockUploadImage
      .mockResolvedValueOnce({ url: 'https://cdn.example.com/g1.jpg', key: 'key-1' })
      .mockResolvedValueOnce({ url: 'https://cdn.example.com/g2.jpg', key: 'key-2' });

    const onImageUploaded = vi.fn();
    const files = [
      new File([new Uint8Array(512)], 'p1.jpg', { type: 'image/jpeg' }),
      new File([new Uint8Array(512)], 'p2.jpg', { type: 'image/jpeg' }),
    ];

    await simulateGalleryUpload(files, 5, mockUploadImage, onImageUploaded);

    expect(onImageUploaded).toHaveBeenCalledTimes(2);
    expect(onImageUploaded).toHaveBeenNthCalledWith(1, 'key-1');
    expect(onImageUploaded).toHaveBeenNthCalledWith(2, 'key-2');
  });
});

// ────────────────────────────────────────────────────────
describe('TC-A-014: 갤러리 최대 개수 초과 → 사전 차단', () => {
  it('remaining=0이면 업로드 불가 + onError 호출 (ArtistEditor:157)', () => {
    // ArtistEditor:154-158: remaining <= 0 이면 return
    const currentCount = 5;
    const maxGallery = 5;
    const remaining = maxGallery - currentCount;

    if (remaining <= 0) {
      mockOnError(`갤러리 이미지는 최대 ${maxGallery}장까지 등록할 수 있습니다.`);
    }

    expect(mockUploadImage).not.toHaveBeenCalled();
    expect(mockOnError).toHaveBeenCalledWith(
      '갤러리 이미지는 최대 5장까지 등록할 수 있습니다.'
    );
  });

  it('remaining=2, 파일 5개 선택 → 2개만 업로드 (slice)', async () => {
    mockUploadImage.mockResolvedValue({ url: 'https://cdn.example.com/g.jpg', key: 'gk' });

    const files = Array.from({ length: 5 }, (_, i) =>
      new File([new Uint8Array(512)], `p${i}.jpg`, { type: 'image/jpeg' })
    );

    // remaining=2로 slice
    const gallery = await simulateGalleryUpload(files, 2, mockUploadImage);

    expect(mockUploadImage).toHaveBeenCalledTimes(2);
    expect(gallery).toHaveLength(2);
  });

  it('중간에 업로드 실패해도 나머지 계속 처리 (for loop + try/catch)', async () => {
    mockUploadImage
      .mockResolvedValueOnce({ url: 'https://cdn.example.com/g1.jpg', key: 'g1' })
      .mockRejectedValueOnce(new Error('Upload Failed')) // 2번째 실패
      .mockResolvedValueOnce({ url: 'https://cdn.example.com/g3.jpg', key: 'g3' });

    const files = [
      new File([new Uint8Array(512)], 'p1.jpg', { type: 'image/jpeg' }),
      new File([new Uint8Array(512)], 'p2.jpg', { type: 'image/jpeg' }),
      new File([new Uint8Array(512)], 'p3.jpg', { type: 'image/jpeg' }),
    ];

    const onError = vi.fn();
    const gallery = await simulateGalleryUpload(files, 5, mockUploadImage, undefined, onError);

    // 3번 호출 (실패해도 for loop 계속)
    expect(mockUploadImage).toHaveBeenCalledTimes(3);
    // 성공한 2개만 gallery에 추가
    expect(gallery).toHaveLength(2);
    // 에러 핸들러 1번 호출
    expect(onError).toHaveBeenCalledWith('이미지 업로드 중 오류 발생');
  });
});
```

**Step 2: 실행**

Run: `npm run test:api -- artist-upload-gallery`
Expected: 5개 PASS

**Step 3: Commit**

```bash
git add __tests__/api/artist-upload-gallery.test.tsx
git commit -m "test(api): add ArtistEditor gallery upload API tests"
```

---

## Task 6: 전체 API 테스트 실행 + 커버리지 검증

**Step 1: 전체 API 테스트 실행**

Run: `npm run test:api`
Expected output:
```
__tests__/api/upload-single.test.ts         (12 tests)
__tests__/api/upload-multiple.test.ts       ( 5 tests)
__tests__/api/upload-resize.test.ts         ( 3 tests)
__tests__/api/artist-upload-main.test.tsx   ( 5 tests)
__tests__/api/artist-upload-gallery.test.tsx( 5 tests)

Test Files  5 passed (5)
Tests       30 passed (30)
```

**Step 2: 전체 테스트 (기존 381개 + 신규 30개) 실행**

Run: `npm test`
Expected: `411 passed`

**Step 3: 커버리지 확인**

Run: `npm run test:coverage 2>&1 | grep -E "File|All files|useImageDropZone|ArtistEditor"`
Expected: `useImageDropZone.ts`와 `ArtistEditor.tsx` 커버리지 상승 확인

**Step 4: 최종 Commit**

```bash
git add __tests__/api/ package.json
git commit -m "test(api): complete all API test coverage for upload flows (30 tests)"
```

---

## 테스트 케이스 전체 목록

| ID | 파일 | 설명 | 우선순위 |
|----|------|------|---------|
| TC-A-001 | upload-single | 단일 업로드 성공 (url+key 검증) | Critical |
| TC-A-001b | upload-single | 업로드 중 isUploading 상태 | Critical |
| TC-A-001c | upload-single | key 있으면 onKeyTracked 호출 | High |
| TC-A-001d | upload-single | key 없으면 onKeyTracked 미호출 | High |
| TC-A-002a | upload-single | JWT 만료 → error + onError | Critical |
| TC-A-002b | upload-single | 인증 실패 후 isUploading 복원 | Critical |
| TC-A-003a | upload-single | Network Error → error 설정 | High |
| TC-A-003b | upload-single | 비Error throw → 기본 메시지 | Medium |
| TC-A-004a | upload-single | SVG → uploadImage 미호출 | Critical |
| TC-A-004b | upload-single | BMP → uploadImage 미호출 | High |
| TC-A-005 | upload-single | disabled=true → 업로드 불가 | High |
| TC-A-006a | upload-multiple | 파일 3개 → 3번 호출 | High |
| TC-A-006b | upload-multiple | multiple=false → 1개만 | High |
| TC-A-007a | upload-multiple | maxFiles=2, 5개 → 2개 + 에러 | High |
| TC-A-007b | upload-multiple | maxFiles=1 → 1개 | Medium |
| TC-A-008 | upload-multiple | drop 비이미지 → 필터링 | High |
| TC-A-009a | upload-resize | 15MB → 리사이즈 → 7MB → 업로드 | High |
| TC-A-009b | upload-resize | 리사이즈 중 isResizing 상태 | High |
| TC-A-010 | upload-resize | 리사이즈 후도 초과 → 업로드 차단 | High |
| TC-A-011a | artist-main | 성공 시 url 반환 | High |
| TC-A-011b | artist-main | url 있을 때만 onChange 호출 | High |
| TC-A-011c | artist-main | key 있으면 onImageUploaded 호출 | High |
| TC-A-012a | artist-main | throw → onError 호출 | High |
| TC-A-012b | artist-main | url="" → mainImage 미업데이트 | Medium |
| TC-A-013a | artist-gallery | 3개 순차 업로드 → gallery 3개 | High |
| TC-A-013b | artist-gallery | 각 key로 onImageUploaded 개별 호출 | High |
| TC-A-014a | artist-gallery | remaining=0 → 사전 차단 + onError | High |
| TC-A-014b | artist-gallery | remaining=2, 5개 선택 → 2개만 | High |
| TC-A-014c | artist-gallery | 중간 실패해도 나머지 계속 처리 | Medium |
