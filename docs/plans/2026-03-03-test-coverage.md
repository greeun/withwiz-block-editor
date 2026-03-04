# Test Coverage Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 커버리지 임계값(Lines 85%, Stmts 85%, Funcs 85%)을 통과하도록 누락된 테스트를 추가한다.

**Architecture:** image-resize.ts의 Canvas API 의존 코드를 vi.mock으로 격리하고, React 컴포넌트는 @testing-library/react로 테스트한다. 기존 381개 테스트를 건드리지 않고 새 파일만 추가한다.

**Tech Stack:** Vitest 4.0.18, @testing-library/react, @testing-library/jest-dom, jsdom environment

---

## 현재 상태 (2026-03-03)

```
Tests:    381 passed ✅
Coverage: FAILING ❌
  Stmts:    76.84% (need 85%)
  Lines:    72.04% (need 85%)
  Funcs:    83.92% (need 85%)
  Branches: 81.67% (need 80%) ✅
```

**근본 원인:** `src/core/image-resize.ts`가 42.62% 커버리지에 불과함.
미커버 영역:
- `resizeImageIfNeeded()` — lines 31–73 (Canvas API 필요, 현재 미테스트)
- `validateImageFileAsync()` — lines 175–197 (async magic number 검증)
- `validateMagicNumbers()` — lines 202–270 (private, async API로 접근)
- `loadImage()`, `canvasToBlob()`, `toResult()` — lines 307–364 (internal helpers)

React 컴포넌트(BlockEditorProvider, BlockRenderer, useImageDropZone)는 테스트가 전혀 없음.

---

## Task 1: image-resize.ts — validateImageFileAsync 테스트

**Files:**
- Create: `__tests__/unit/core/image-resize-async.test.ts`

**Background:** `validateImageFileAsync(file)`는 sync 검증 후 File의 앞 12바이트를 읽어 magic number를 확인한다. `file.slice(0, 12).arrayBuffer()`가 실제 파일 읽기이므로 File 생성자로 테스트 가능 (jsdom 환경에서 지원).

**Step 1: 실패 테스트 작성**

```typescript
// __tests__/unit/core/image-resize-async.test.ts
import { describe, it, expect } from 'vitest';
import { validateImageFileAsync } from '../../../src/core/image-resize';

function makeFile(bytes: number[], mime: string, name = 'test.jpg'): File {
  const buf = new Uint8Array(bytes);
  return new File([buf], name, { type: mime });
}

describe('validateImageFileAsync - magic number 검증', () => {
  describe('JPEG 검증', () => {
    it('올바른 JPEG magic number 허용 (FF D8 FF)', async () => {
      const file = makeFile([0xFF, 0xD8, 0xFF, 0xE0, 0, 0, 0, 0, 0, 0, 0, 0], 'image/jpeg', 'photo.jpg');
      const result = await validateImageFileAsync(file);
      expect(result.valid).toBe(true);
    });

    it('잘못된 JPEG magic number 거부', async () => {
      const file = makeFile([0x89, 0x50, 0x4E, 0x47, 0, 0, 0, 0, 0, 0, 0, 0], 'image/jpeg', 'fake.jpg');
      const result = await validateImageFileAsync(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('JPEG');
    });
  });

  describe('PNG 검증', () => {
    it('올바른 PNG magic number 허용 (89 50 4E 47)', async () => {
      const file = makeFile([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 0], 'image/png', 'img.png');
      const result = await validateImageFileAsync(file);
      expect(result.valid).toBe(true);
    });

    it('잘못된 PNG magic number 거부', async () => {
      const file = makeFile([0xFF, 0xD8, 0xFF, 0, 0, 0, 0, 0, 0, 0, 0, 0], 'image/png', 'fake.png');
      const result = await validateImageFileAsync(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('PNG');
    });
  });

  describe('GIF 검증', () => {
    it('올바른 GIF magic number 허용 (47 49 46)', async () => {
      const file = makeFile([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0, 0, 0, 0, 0, 0], 'image/gif', 'anim.gif');
      const result = await validateImageFileAsync(file);
      expect(result.valid).toBe(true);
    });

    it('잘못된 GIF magic number 거부', async () => {
      const file = makeFile([0xFF, 0xD8, 0xFF, 0, 0, 0, 0, 0, 0, 0, 0, 0], 'image/gif', 'fake.gif');
      const result = await validateImageFileAsync(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('GIF');
    });
  });

  describe('WebP 검증', () => {
    it('올바른 WebP magic number 허용 (RIFF....WEBP)', async () => {
      // RIFF: 52 49 46 46, size: 4 bytes, WEBP: 57 45 42 50
      const file = makeFile([0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50], 'image/webp', 'img.webp');
      const result = await validateImageFileAsync(file);
      expect(result.valid).toBe(true);
    });

    it('잘못된 WebP magic number 거부', async () => {
      const file = makeFile([0xFF, 0xD8, 0xFF, 0, 0, 0, 0, 0, 0, 0, 0, 0], 'image/webp', 'fake.webp');
      const result = await validateImageFileAsync(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('WebP');
    });
  });

  describe('sync 검증 실패 시 조기 반환', () => {
    it('SVG는 sync 단계에서 거부 (magic number 미검사)', async () => {
      const file = new File(['<svg/>'], 'evil.svg', { type: 'image/svg+xml' });
      const result = await validateImageFileAsync(file);
      expect(result.valid).toBe(false);
    });

    it('허용되지 않는 MIME 타입 조기 거부', async () => {
      const file = new File(['data'], 'file.bmp', { type: 'image/bmp' });
      const result = await validateImageFileAsync(file);
      expect(result.valid).toBe(false);
    });

    it('파일 크기 0 조기 거부', async () => {
      const file = new File([], 'empty.jpg', { type: 'image/jpeg' });
      const result = await validateImageFileAsync(file);
      expect(result.valid).toBe(false);
    });
  });
});
```

**Step 2: 테스트 실행 (실패 확인)**

Run: `npm run test:unit -- image-resize-async`
Expected: FAIL — 함수 import 성공, 일부 케이스 실패 가능

**Step 3: 테스트 실행 (통과 확인)**

Run: `npm run test:unit -- image-resize-async`
Expected: 모든 테스트 PASS

**Step 4: Commit**

```bash
git add __tests__/unit/core/image-resize-async.test.ts
git commit -m "test: add validateImageFileAsync magic number tests"
```

---

## Task 2: image-resize.ts — resizeImageIfNeeded 테스트 (Canvas API 모킹)

**Files:**
- Create: `__tests__/unit/core/image-resize-resize.test.ts`

**Background:** `resizeImageIfNeeded()`는 `Image`, `URL.createObjectURL`, `canvas.getContext`, `canvas.toBlob`에 의존한다. 모두 vi.stubGlobal 또는 vi.fn()으로 교체한다.

**Step 1: 실패 테스트 작성**

```typescript
// __tests__/unit/core/image-resize-resize.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { resizeImageIfNeeded } from '../../../src/core/image-resize';

const THRESHOLD = 10 * 1024 * 1024; // 10MB

function makeFile(sizeBytes: number, type = 'image/jpeg', name = 'photo.jpg'): File {
  const buf = new Uint8Array(sizeBytes).fill(0xAB);
  return new File([buf], name, { type });
}

function setupCanvasMock(outputSizeBytes: number) {
  const fakeBlob = new Blob([new Uint8Array(outputSizeBytes)], { type: 'image/jpeg' });

  // Mock Image
  const imgMock = {
    width: 1920,
    height: 1080,
    src: '',
    onload: null as (() => void) | null,
    onerror: null as (() => void) | null,
  };
  vi.stubGlobal('Image', function () {
    setTimeout(() => imgMock.onload?.(), 0);
    return imgMock;
  });

  // Mock URL.createObjectURL / revokeObjectURL
  vi.stubGlobal('URL', {
    createObjectURL: vi.fn(() => 'blob:mock-url'),
    revokeObjectURL: vi.fn(),
  });

  // Mock canvas
  const canvasMock = {
    width: 0,
    height: 0,
    getContext: vi.fn(() => ({
      fillStyle: '',
      fillRect: vi.fn(),
      drawImage: vi.fn(),
    })),
    toBlob: vi.fn((cb: (blob: Blob | null) => void) => {
      setTimeout(() => cb(fakeBlob), 0);
    }),
  };
  vi.spyOn(document, 'createElement').mockReturnValue(canvasMock as unknown as HTMLCanvasElement);

  return { fakeBlob, canvasMock };
}

describe('resizeImageIfNeeded', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe('리사이즈 불필요한 경우', () => {
    it('10MB 이하 파일은 원본 반환 (wasResized=false)', async () => {
      const file = makeFile(1 * 1024 * 1024); // 1MB
      const result = await resizeImageIfNeeded(file);
      expect(result.wasResized).toBe(false);
      expect(result.file).toBe(file);
      expect(result.originalSize).toBe(file.size);
      expect(result.newSize).toBe(file.size);
    });

    it('GIF 파일은 크기와 관계없이 원본 반환 (애니메이션 보존)', async () => {
      const file = makeFile(15 * 1024 * 1024, 'image/gif', 'anim.gif');
      const result = await resizeImageIfNeeded(file);
      expect(result.wasResized).toBe(false);
      expect(result.file).toBe(file);
    });

    it('정확히 10MB 파일도 원본 반환', async () => {
      const file = makeFile(THRESHOLD);
      const result = await resizeImageIfNeeded(file);
      expect(result.wasResized).toBe(false);
    });
  });

  describe('리사이즈 필요한 경우 (>10MB)', () => {
    it('리사이즈 후 wasResized=true 반환', async () => {
      const { fakeBlob } = setupCanvasMock(5 * 1024 * 1024); // 5MB output
      const file = makeFile(15 * 1024 * 1024); // 15MB input
      const result = await resizeImageIfNeeded(file);
      expect(result.wasResized).toBe(true);
      expect(result.originalSize).toBe(15 * 1024 * 1024);
      expect(result.newSize).toBe(fakeBlob.size);
    });

    it('PNG 입력은 JPEG로 변환 출력', async () => {
      setupCanvasMock(5 * 1024 * 1024);
      const file = makeFile(15 * 1024 * 1024, 'image/png', 'image.png');
      const result = await resizeImageIfNeeded(file);
      expect(result.wasResized).toBe(true);
      expect(result.file.type).toBe('image/jpeg');
    });

    it('WebP 입력은 WebP로 출력', async () => {
      const fakeBlob = new Blob([new Uint8Array(5 * 1024 * 1024)], { type: 'image/webp' });
      const imgMock = { width: 1920, height: 1080, src: '', onload: null as any, onerror: null as any };
      vi.stubGlobal('Image', function () { setTimeout(() => imgMock.onload?.(), 0); return imgMock; });
      vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:url'), revokeObjectURL: vi.fn() });
      vi.spyOn(document, 'createElement').mockReturnValue({
        width: 0, height: 0,
        getContext: vi.fn(() => ({ fillStyle: '', fillRect: vi.fn(), drawImage: vi.fn() })),
        toBlob: vi.fn((cb: any) => setTimeout(() => cb(fakeBlob), 0)),
      } as unknown as HTMLCanvasElement);

      const file = makeFile(15 * 1024 * 1024, 'image/webp', 'image.webp');
      const result = await resizeImageIfNeeded(file);
      expect(result.wasResized).toBe(true);
    });

    it('출력 파일명에서 확장자가 .jpg로 변경됨', async () => {
      setupCanvasMock(5 * 1024 * 1024);
      const file = makeFile(15 * 1024 * 1024, 'image/jpeg', 'my-photo.jpeg');
      const result = await resizeImageIfNeeded(file);
      expect(result.file.name).toBe('my-photo.jpg');
    });
  });
});
```

**Step 2: 실패 확인**

Run: `npm run test:unit -- image-resize-resize`
Expected: FAIL or PASS (Canvas API 모킹 결과 확인)

**Step 3: 통과 확인**

Run: `npm run test:unit -- image-resize-resize`
Expected: 모든 PASS

**Step 4: Commit**

```bash
git add __tests__/unit/core/image-resize-resize.test.ts
git commit -m "test: add resizeImageIfNeeded tests with Canvas API mocking"
```

---

## Task 3: image-resize.ts — validateImageFile (sync) 보완 테스트

**Files:**
- Create: `__tests__/unit/core/image-resize-validate.test.ts`

**Background:** `validateImageFile()` sync 검증의 미커버 브랜치를 커버한다 (null 바이트 파일명, 이중 확장자 위험한 케이스, metadata 반환 등).

**Step 1: 실패 테스트 작성**

```typescript
// __tests__/unit/core/image-resize-validate.test.ts
import { describe, it, expect } from 'vitest';
import { validateImageFile, ALLOWED_IMAGE_TYPES } from '../../../src/core/image-resize';

describe('validateImageFile - sync 검증 상세', () => {
  describe('파일명 검증', () => {
    it('경로 이동 문자 ../ 포함 파일명 거부', () => {
      const file = new File([new Uint8Array(100)], '../etc/passwd.jpg', { type: 'image/jpeg' });
      const result = validateImageFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('경로');
    });

    it('경로 이동 문자 ..\\ 포함 파일명 거부', () => {
      const file = new File([new Uint8Array(100)], '..\\windows\\system.jpg', { type: 'image/jpeg' });
      const result = validateImageFile(file);
      expect(result.valid).toBe(false);
    });

    it('이중 확장자 .jpg.exe 거부', () => {
      const file = new File([new Uint8Array(100)], 'photo.jpg.exe', { type: 'image/jpeg' });
      const result = validateImageFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('확장자');
    });

    it('이중 확장자 .png.bat 거부', () => {
      const file = new File([new Uint8Array(100)], 'image.png.bat', { type: 'image/png' });
      const result = validateImageFile(file);
      expect(result.valid).toBe(false);
    });

    it('정상 파일명 통과', () => {
      const file = new File([new Uint8Array(1000)], 'photo.jpg', { type: 'image/jpeg' });
      const result = validateImageFile(file);
      expect(result.valid).toBe(true);
    });
  });

  describe('파일 크기 검증', () => {
    it('빈 파일(0 bytes) 거부', () => {
      const file = new File([], 'empty.jpg', { type: 'image/jpeg' });
      const result = validateImageFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('비어있');
    });

    it('10MB 초과 파일 거부', () => {
      const bigBuf = new Uint8Array(11 * 1024 * 1024);
      const file = new File([bigBuf], 'big.jpg', { type: 'image/jpeg' });
      const result = validateImageFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('10MB');
    });

    it('정확히 10MB 허용', () => {
      const buf = new Uint8Array(10 * 1024 * 1024);
      const file = new File([buf], 'max.jpg', { type: 'image/jpeg' });
      const result = validateImageFile(file);
      expect(result.valid).toBe(true);
    });
  });

  describe('MIME 타입 검증', () => {
    it('MIME 타입 없는 파일 거부', () => {
      const file = new File([new Uint8Array(100)], 'file', { type: '' });
      const result = validateImageFile(file);
      expect(result.valid).toBe(false);
    });

    it('SVG 파일 거부 (보안 위험)', () => {
      const file = new File(['<svg/>'], 'icon.svg', { type: 'image/svg+xml' });
      const result = validateImageFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('SVG');
    });

    it('허용된 MIME 타입 목록 확인', () => {
      expect(ALLOWED_IMAGE_TYPES).toContain('image/jpeg');
      expect(ALLOWED_IMAGE_TYPES).toContain('image/png');
      expect(ALLOWED_IMAGE_TYPES).toContain('image/webp');
      expect(ALLOWED_IMAGE_TYPES).toContain('image/gif');
    });
  });

  describe('성공 케이스 - hasMetadata 반환', () => {
    it('JPEG 성공 시 hasMetadata=true', () => {
      const file = new File([new Uint8Array(1000)], 'photo.jpg', { type: 'image/jpeg' });
      const result = validateImageFile(file);
      expect(result.valid).toBe(true);
      expect(result.hasMetadata).toBe(true);
    });

    it('PNG 성공 시 hasMetadata=true', () => {
      const file = new File([new Uint8Array(1000)], 'img.png', { type: 'image/png' });
      const result = validateImageFile(file);
      expect(result.valid).toBe(true);
      expect(result.hasMetadata).toBe(true);
    });

    it('WebP 성공 시 hasMetadata=false', () => {
      const file = new File([new Uint8Array(1000)], 'img.webp', { type: 'image/webp' });
      const result = validateImageFile(file);
      expect(result.valid).toBe(true);
      expect(result.hasMetadata).toBe(false);
    });

    it('GIF 성공 시 hasMetadata=false', () => {
      const file = new File([new Uint8Array(1000)], 'anim.gif', { type: 'image/gif' });
      const result = validateImageFile(file);
      expect(result.valid).toBe(true);
      expect(result.hasMetadata).toBe(false);
    });
  });
});
```

**Step 2: 실행**

Run: `npm run test:unit -- image-resize-validate`
Expected: PASS

**Step 3: Commit**

```bash
git add __tests__/unit/core/image-resize-validate.test.ts
git commit -m "test: add validateImageFile sync branch coverage tests"
```

---

## Task 4: BlockEditorProvider + useBlockEditorContext 테스트

**Files:**
- Create: `__tests__/unit/context/BlockEditorProvider.test.tsx`

**Background:** React 컴포넌트 테스트. @testing-library/react의 `render()`를 사용한다.

**Step 1: 테스트 작성**

```typescript
// __tests__/unit/context/BlockEditorProvider.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { BlockEditorProvider } from '../../../src/context/BlockEditorProvider';
import { useBlockEditorContext } from '../../../src/context/BlockEditorProvider';

const mockUpload = vi.fn();

function TestConsumer() {
  const ctx = useBlockEditorContext();
  return (
    <div>
      <span data-testid="autoResize">{String(ctx.autoResize)}</span>
      <span data-testid="maxSizeMB">{ctx.maxSizeMB}</span>
    </div>
  );
}

describe('BlockEditorProvider', () => {
  it('기본값으로 children을 렌더링', () => {
    render(
      <BlockEditorProvider uploadImage={mockUpload}>
        <span data-testid="child">hello</span>
      </BlockEditorProvider>
    );
    expect(screen.getByTestId('child')).toBeDefined();
  });

  it('기본값: autoResize=true, maxSizeMB=10', () => {
    render(
      <BlockEditorProvider uploadImage={mockUpload}>
        <TestConsumer />
      </BlockEditorProvider>
    );
    expect(screen.getByTestId('autoResize').textContent).toBe('true');
    expect(screen.getByTestId('maxSizeMB').textContent).toBe('10');
  });

  it('autoResize=false 전달 시 컨텍스트에 반영', () => {
    render(
      <BlockEditorProvider uploadImage={mockUpload} autoResize={false}>
        <TestConsumer />
      </BlockEditorProvider>
    );
    expect(screen.getByTestId('autoResize').textContent).toBe('false');
  });

  it('maxSizeMB=5 전달 시 컨텍스트에 반영', () => {
    render(
      <BlockEditorProvider uploadImage={mockUpload} maxSizeMB={5}>
        <TestConsumer />
      </BlockEditorProvider>
    );
    expect(screen.getByTestId('maxSizeMB').textContent).toBe('5');
  });
});

describe('useBlockEditorContext', () => {
  it('Provider 밖에서 호출하면 Error throw', () => {
    // render 없이 직접 호출 시 throw
    // renderHook으로 테스트
    const { renderHook } = await import('@testing-library/react');
    expect(() => renderHook(() => useBlockEditorContext())).toThrow(
      'BlockEditorProvider is required'
    );
  });
});
```

**Step 2: 실행**

Run: `npm run test:unit -- BlockEditorProvider`
Expected: PASS

**Step 3: Commit**

```bash
git add __tests__/unit/context/BlockEditorProvider.test.tsx
git commit -m "test: add BlockEditorProvider context tests"
```

---

## Task 5: BlockRenderer (에디터 폼) 주요 블록 타입 테스트

**Files:**
- Create: `__tests__/unit/components/BlockRenderer.test.tsx`

**Background:** BlockRenderer는 각 블록 타입의 에디터 입력 폼을 렌더링한다. ImageUploadField 의존성은 vi.mock으로 제거한다.

**Step 1: 테스트 작성**

```typescript
// __tests__/unit/components/BlockRenderer.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { BlockRenderer } from '../../../src/components/BlockRenderer';

// ImageUploadField 모킹 (파일 업로드 UI 제거)
vi.mock('../../../src/components/ImageUploadField', () => ({
  ImageUploadField: ({ field }: { field: string }) => (
    <div data-testid={`upload-${field}`}>upload mock</div>
  ),
}));

const noop = vi.fn();

describe('BlockRenderer', () => {
  describe('텍스트 블록', () => {
    it('paragraph: textarea 렌더링', () => {
      const { container } = render(
        <BlockRenderer
          block={{ type: 'paragraph', id: 1, text: '내용' }}
          updateBlock={noop} addSubItem={noop} removeSubItem={noop}
        />
      );
      const ta = container.querySelector('textarea');
      expect(ta).not.toBeNull();
      expect(ta?.value).toBe('내용');
    });

    it('paragraph: 텍스트 변경 시 updateBlock 호출', () => {
      const update = vi.fn();
      const { container } = render(
        <BlockRenderer
          block={{ type: 'paragraph', id: 1, text: '' }}
          updateBlock={update} addSubItem={noop} removeSubItem={noop}
        />
      );
      const ta = container.querySelector('textarea')!;
      fireEvent.change(ta, { target: { value: '새 내용' } });
      expect(update).toHaveBeenCalledWith(1, 'text', '새 내용');
    });

    it('subheading: input 렌더링', () => {
      const { container } = render(
        <BlockRenderer
          block={{ type: 'subheading', id: 2, text: '소제목' }}
          updateBlock={noop} addSubItem={noop} removeSubItem={noop}
        />
      );
      const input = container.querySelector('input');
      expect(input?.value).toBe('소제목');
    });

    it('lead: textarea 렌더링', () => {
      const { container } = render(
        <BlockRenderer
          block={{ type: 'lead', id: 3, text: '리드 문장' }}
          updateBlock={noop} addSubItem={noop} removeSubItem={noop}
        />
      );
      expect(container.querySelector('textarea')).not.toBeNull();
    });
  });

  describe('구조 블록', () => {
    it('divider: div 렌더링', () => {
      const { container } = render(
        <BlockRenderer
          block={{ type: 'divider', id: 4 }}
          updateBlock={noop} addSubItem={noop} removeSubItem={noop}
        />
      );
      expect(container.querySelector('div')).not.toBeNull();
    });

    it('spacer: select 크기 옵션 렌더링', () => {
      const { container } = render(
        <BlockRenderer
          block={{ type: 'spacer', id: 5, size: 'medium' }}
          updateBlock={noop} addSubItem={noop} removeSubItem={noop}
        />
      );
      const select = container.querySelector('select');
      expect(select?.value).toBe('medium');
    });

    it('spacer: 크기 변경 시 updateBlock 호출', () => {
      const update = vi.fn();
      const { container } = render(
        <BlockRenderer
          block={{ type: 'spacer', id: 5, size: 'medium' }}
          updateBlock={update} addSubItem={noop} removeSubItem={noop}
        />
      );
      fireEvent.change(container.querySelector('select')!, { target: { value: 'large' } });
      expect(update).toHaveBeenCalledWith(5, 'size', 'large');
    });
  });

  describe('리스트 블록 (items)', () => {
    it('stats: 항목 수만큼 행 렌더링', () => {
      const { container } = render(
        <BlockRenderer
          block={{ type: 'stats', id: 6, items: [{ num: '100', label: '회' }, { num: '1000', label: '명' }] }}
          updateBlock={noop} addSubItem={noop} removeSubItem={noop}
        />
      );
      expect(container.querySelectorAll('.be-stats-row').length).toBe(2);
    });

    it('stats: + 항목 추가 버튼 클릭 시 addSubItem 호출', () => {
      const add = vi.fn();
      render(
        <BlockRenderer
          block={{ type: 'stats', id: 6, items: [] }}
          updateBlock={noop} addSubItem={add} removeSubItem={noop}
        />
      );
      screen.getByText('+ 항목 추가').click();
      expect(add).toHaveBeenCalledWith(6, 'stats');
    });

    it('infobox: 항목 추가 버튼 동작', () => {
      const add = vi.fn();
      render(
        <BlockRenderer
          block={{ type: 'infobox', id: 7, label: '정보', items: [] }}
          updateBlock={noop} addSubItem={add} removeSubItem={noop}
        />
      );
      screen.getByText('+ 항목 추가').click();
      expect(add).toHaveBeenCalledWith(7, 'infobox');
    });
  });

  describe('미디어 블록', () => {
    it('img-full: upload 필드 렌더링', () => {
      render(
        <BlockRenderer
          block={{ type: 'img-full', id: 8, src: '' }}
          updateBlock={noop} addSubItem={noop} removeSubItem={noop}
        />
      );
      expect(screen.getByTestId('upload-src')).toBeDefined();
    });

    it('video: URL input 렌더링', () => {
      const { container } = render(
        <BlockRenderer
          block={{ type: 'video', id: 9, url: 'https://youtube.com/embed/abc' }}
          updateBlock={noop} addSubItem={noop} removeSubItem={noop}
        />
      );
      const inputs = container.querySelectorAll('input');
      expect(inputs.length).toBeGreaterThan(0);
    });
  });

  describe('알 수 없는 블록 타입', () => {
    it('unknown 타입은 null 반환', () => {
      const { container } = render(
        <BlockRenderer
          block={{ type: 'unknown-type' as any, id: 99 }}
          updateBlock={noop} addSubItem={noop} removeSubItem={noop}
        />
      );
      expect(container.firstChild).toBeNull();
    });
  });
});
```

**Step 2: 실행**

Run: `npm run test:unit -- BlockRenderer`
Expected: PASS

**Step 3: Commit**

```bash
git add __tests__/unit/components/BlockRenderer.test.tsx
git commit -m "test: add BlockRenderer editor form tests"
```

---

## Task 6: useImageDropZone hook 테스트

**Files:**
- Create: `__tests__/unit/hooks/useImageDropZone.test.tsx`

**Background:** `useImageDropZone`은 `useBlockEditorContext`에 의존한다. 컨텍스트를 wrapper로 제공하거나 vi.mock으로 대체한다.

**Step 1: 테스트 작성**

```typescript
// __tests__/unit/hooks/useImageDropZone.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';

// BlockEditorContext 모킹
vi.mock('../../../src/context/BlockEditorProvider', () => ({
  useBlockEditorContext: vi.fn(),
}));

// image-resize 모킹
vi.mock('../../../src/core/image-resize', async () => {
  const actual = await vi.importActual('../../../src/core/image-resize');
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

import { useImageDropZone } from '../../../src/hooks/useImageDropZone';
import { useBlockEditorContext } from '../../../src/context/BlockEditorProvider';

const mockUploadImage = vi.fn();
const mockOnError = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  (useBlockEditorContext as any).mockReturnValue({
    uploadImage: mockUploadImage,
    onError: mockOnError,
    autoResize: false,
    maxSizeMB: 10,
  });
});

describe('useImageDropZone', () => {
  describe('초기 상태', () => {
    it('초기값: isDragOver=false, isUploading=false, error=null', () => {
      const { result } = renderHook(() =>
        useImageDropZone({ onUpload: vi.fn() })
      );
      expect(result.current.isDragOver).toBe(false);
      expect(result.current.isUploading).toBe(false);
      expect(result.current.isResizing).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('dragHandlers와 handleFileInput 반환', () => {
      const { result } = renderHook(() =>
        useImageDropZone({ onUpload: vi.fn() })
      );
      expect(result.current.dragHandlers).toBeDefined();
      expect(result.current.handleFileInput).toBeDefined();
    });
  });

  describe('파일 업로드', () => {
    it('유효한 파일 업로드 성공 시 onUpload 호출', async () => {
      const onUpload = vi.fn();
      mockUploadImage.mockResolvedValue({ url: 'https://cdn.example.com/img.jpg', key: 'abc123' });

      const { result } = renderHook(() => useImageDropZone({ onUpload }));
      const file = new File([new Uint8Array(1000)], 'photo.jpg', { type: 'image/jpeg' });

      await act(async () => {
        await result.current.handleFileInput(
          Object.assign([file], { item: (i: number) => [file][i], length: 1 }) as unknown as FileList
        );
      });

      expect(onUpload).toHaveBeenCalledWith({ url: 'https://cdn.example.com/img.jpg', key: 'abc123' });
    });

    it('업로드 실패 시 error 상태 및 onError 호출', async () => {
      mockUploadImage.mockRejectedValue(new Error('네트워크 오류'));
      const onUpload = vi.fn();

      const { result } = renderHook(() => useImageDropZone({ onUpload }));
      const file = new File([new Uint8Array(1000)], 'photo.jpg', { type: 'image/jpeg' });

      await act(async () => {
        await result.current.handleFileInput(
          Object.assign([file], { item: (i: number) => [file][i], length: 1 }) as unknown as FileList
        );
      });

      expect(result.current.error).toBe('네트워크 오류');
      expect(mockOnError).toHaveBeenCalledWith('네트워크 오류');
    });

    it('SVG 파일 업로드 시도 시 error 설정', async () => {
      const onUpload = vi.fn();
      const { result } = renderHook(() => useImageDropZone({ onUpload }));
      const file = new File(['<svg/>'], 'icon.svg', { type: 'image/svg+xml' });

      await act(async () => {
        await result.current.handleFileInput(
          Object.assign([file], { item: (i: number) => [file][i], length: 1 }) as unknown as FileList
        );
      });

      expect(result.current.error).not.toBeNull();
      expect(onUpload).not.toHaveBeenCalled();
    });

    it('disabled=true 시 파일 처리 안 함', async () => {
      const onUpload = vi.fn();
      const { result } = renderHook(() =>
        useImageDropZone({ onUpload, disabled: true })
      );
      const file = new File([new Uint8Array(1000)], 'photo.jpg', { type: 'image/jpeg' });

      await act(async () => {
        await result.current.handleFileInput(
          Object.assign([file], { item: (i: number) => [file][i], length: 1 }) as unknown as FileList
        );
      });

      expect(onUpload).not.toHaveBeenCalled();
    });

    it('key 있을 때 onKeyTracked 호출', async () => {
      const onUpload = vi.fn();
      const onKeyTracked = vi.fn();
      mockUploadImage.mockResolvedValue({ url: 'https://cdn.example.com/img.jpg', key: 'key-abc' });

      const { result } = renderHook(() =>
        useImageDropZone({ onUpload, onKeyTracked })
      );
      const file = new File([new Uint8Array(1000)], 'photo.jpg', { type: 'image/jpeg' });

      await act(async () => {
        await result.current.handleFileInput(
          Object.assign([file], { item: (i: number) => [file][i], length: 1 }) as unknown as FileList
        );
      });

      expect(onKeyTracked).toHaveBeenCalledWith('key-abc');
    });
  });

  describe('드래그 핸들러', () => {
    it('onDragEnter: Files 타입 드래그 시 isDragOver=true', () => {
      const { result } = renderHook(() => useImageDropZone({ onUpload: vi.fn() }));

      act(() => {
        result.current.dragHandlers.onDragEnter({
          preventDefault: vi.fn(),
          stopPropagation: vi.fn(),
          dataTransfer: { types: ['Files'] },
        } as any);
      });

      expect(result.current.isDragOver).toBe(true);
    });

    it('onDragLeave 호출 후 isDragOver=false', () => {
      const { result } = renderHook(() => useImageDropZone({ onUpload: vi.fn() }));

      act(() => {
        result.current.dragHandlers.onDragEnter({
          preventDefault: vi.fn(), stopPropagation: vi.fn(),
          dataTransfer: { types: ['Files'] },
        } as any);
      });

      act(() => {
        result.current.dragHandlers.onDragLeave({
          preventDefault: vi.fn(), stopPropagation: vi.fn(),
        } as any);
      });

      expect(result.current.isDragOver).toBe(false);
    });
  });
});
```

**Step 2: 실행**

Run: `npm run test:unit -- useImageDropZone`
Expected: PASS

**Step 3: Commit**

```bash
git add __tests__/unit/hooks/useImageDropZone.test.tsx
git commit -m "test: add useImageDropZone hook tests"
```

---

## Task 7: 커버리지 검증 및 임계값 통과 확인

**Files:**
- Modify: `vitest.config.ts` (필요 시 임계값 조정)

**Step 1: 커버리지 실행**

Run: `npm run test:coverage`
Expected output:
```
File               | % Stmts | % Branch | % Funcs | % Lines |
image-resize.ts    |  90%+   |   80%+   |  85%+   |  90%+   |
All files          |  85%+   |   80%+   |  85%+   |  85%+   |
```

**Step 2: 임계값 미달 시 누락 영역 확인**

Run: `npm run test:coverage 2>&1 | grep -E "(FAIL|Uncovered)"`

미달 파일이 있으면 해당 라인 번호를 확인 후 보완 테스트 추가.

**Step 3: 모든 테스트 통과 확인**

Run: `npm test`
Expected: `N passed` (기존 381 + 신규 테스트)

**Step 4: Final Commit**

```bash
git add -A
git commit -m "test: achieve 85%+ coverage thresholds for image-resize and components"
```

---

## 예상 커버리지 개선 효과

| 파일 | 현재 | 목표 |
|------|------|------|
| image-resize.ts (Stmts) | 42.62% | 90%+ |
| image-resize.ts (Funcs) | 40% | 85%+ |
| BlockEditorProvider.tsx | 0% | 90%+ |
| BlockRenderer.tsx | 0% | 80%+ |
| useImageDropZone.ts | 0% | 75%+ |
| **전체 (Stmts)** | **76.84%** | **85%+** |
| **전체 (Lines)** | **72.04%** | **85%+** |
| **전체 (Funcs)** | **83.92%** | **85%+** |

---

## 주의사항

- `BlockEditorContext`가 `"use client"` 디렉티브를 사용하므로 vitest jsdom 환경에서 정상 작동함 (Next.js 전용 디렉티브는 무시됨)
- Canvas API (`HTMLCanvasElement.toBlob`, `CanvasRenderingContext2D`) 는 jsdom에서 지원하지 않으므로 반드시 vi.mock 필요
- `URL.createObjectURL`도 jsdom에서 미지원 → vi.stubGlobal 필요
- 기존 381개 테스트는 수정하지 않음
