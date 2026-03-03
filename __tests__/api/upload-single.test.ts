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
    // validateImageFile: null 반환 → 유효한 파일로 처리
    validateImageFile: vi.fn(() => null),
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
describe('TC-A-001: 단일 업로드 성공 (유효 이미지)', () => {
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

    expect(mockUploadImage).toHaveBeenCalledOnce();
    expect(mockUploadImage).toHaveBeenCalledWith(file);
    expect(onUpload).toHaveBeenCalledWith(expectedResult);
    expect(result.current.error).toBeNull();
    expect(mockOnError).not.toHaveBeenCalled();
  });

  it('업로드 중 isUploading=true, 완료 후 false', async () => {
    vi.useRealTimers();

    try {
      let resolveUpload!: (v: any) => void;
      mockUploadImage.mockImplementation(
        () => new Promise((resolve) => { resolveUpload = resolve; })
      );

      const onUpload = vi.fn();
      const { result } = renderHook(() => useImageDropZone({ onUpload }));

      // handleFileInput 호출을 act로 감싸되, 내부 Promise는 외부에서 참조
      let fileInputPromise!: Promise<void>;
      await act(async () => {
        fileInputPromise = result.current.handleFileInput(makeFileList([makeJpeg()]));
        // microtask를 flush하여 setIsUploading(true) 상태 변경이 적용되도록 함
        // (uploadImage Promise가 pending 상태이므로 isUploading은 true 유지)
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(result.current.isUploading).toBe(true);

      // 업로드 완료
      await act(async () => {
        resolveUpload({ url: 'https://cdn.example.com/img.jpg', key: 'k1' });
        await fileInputPromise;
      });

      expect(result.current.isUploading).toBe(false);
    } finally {
      vi.useFakeTimers({ shouldAdvanceTime: true }); // 복원
    }
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
    mockUploadImage.mockResolvedValue({ url: 'https://cdn.example.com/img.jpg' });

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
    mockUploadImage.mockRejectedValue('알 수 없는 오류');

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
    // SVG는 validateImageFile 실제 구현이 에러를 반환하도록 원래 구현으로 복원
    const { validateImageFile } = await import('../../src/core/image-resize');
    (validateImageFile as ReturnType<typeof vi.fn>).mockImplementation((file: File) => {
      if (file.type === 'image/svg+xml') {
        return 'SVG 파일은 보안상의 이유로 업로드가 제한됩니다.';
      }
      return null;
    });

    const svgFile = new File(['<svg/>'], 'icon.svg', { type: 'image/svg+xml' });

    const { result } = renderHook(() => useImageDropZone({ onUpload: vi.fn() }));

    await act(async () => {
      await result.current.handleFileInput(makeFileList([svgFile]));
    });

    expect(mockUploadImage).not.toHaveBeenCalled();
    expect(result.current.error).not.toBeNull();
  });

  it('BMP 파일도 uploadImage 호출 없이 거부', async () => {
    // BMP는 허용되지 않는 MIME 타입이므로 에러 반환
    const { validateImageFile } = await import('../../src/core/image-resize');
    (validateImageFile as ReturnType<typeof vi.fn>).mockImplementation((file: File) => {
      if (file.type === 'image/bmp') {
        return `지원하지 않는 파일 형식입니다: ${file.type}. 허용된 형식: jpeg, png, webp, gif`;
      }
      return null;
    });

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
