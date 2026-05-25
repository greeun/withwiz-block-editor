/**
 * Unit tests for src/hooks/useImageDropZone.ts
 *
 * Spec (derived from source — NOT from running the hook and rubber-stamping
 * outputs):
 *
 *   Options: { multiple=false, maxFiles?, onUpload, onKeyTracked?, disabled=false }
 *   Returns: { isDragOver, isUploading, isResizing, error,
 *              dragHandlers: { onDragEnter, onDragOver, onDragLeave, onDrop },
 *              handleFileInput }
 *
 *   Drag state machine (counter-based, see dragCounterRef):
 *     - dragEnter with dataTransfer.types containing "Files" → isDragOver=true
 *     - dragEnter without "Files" in types → isDragOver stays false
 *     - dragLeave decrements; only when counter hits 0 does isDragOver flip
 *     - drop always resets counter to 0 and isDragOver to false
 *
 *   Drop / file pipeline:
 *     - drop filters dataTransfer.files by ALLOWED_IMAGE_TYPES; zero files
 *       after filter → error "이미지 파일만 업로드할 수 있습니다."
 *     - disabled=true short-circuits drop (no error, no upload)
 *     - multiple=false processes only first file even if many dropped
 *     - maxFiles caps the slice AND sets a "최대 N개까지" error
 *     - per-file validation failure (e.g. SVG) sets error and aborts the batch
 *     - successful uploads call onUpload per file and onKeyTracked when key present
 *     - upload throw → error set + onError called with the message
 *
 *   NOTE: We DO NOT exercise the resize stage. It depends on a real canvas
 *   which jsdom only stubs; any assertion there would be testing the stub.
 *   Tests that need resize disable autoResize via the provider.
 *
 *   Layer ownership: validation message wording is the responsibility of the
 *   security/image-resize suites. Here we only assert that the hook propagates
 *   *some* error string into state — not the exact text.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useImageDropZone } from '../../../src/hooks/useImageDropZone';
import { BlockEditorProvider } from '../../../src/context/BlockEditorProvider';
import type { UploadFn, UploadResult } from '../../../src/types';

// --- helpers ---------------------------------------------------------------

function makeWrapper(opts: {
  uploadImage?: UploadFn;
  onError?: (m: string) => void;
  autoResize?: boolean;
  maxSizeMB?: number;
} = {}) {
  const uploadImage =
    opts.uploadImage ??
    (vi.fn(async (f: File) => ({ url: `https://cdn/${f.name}`, key: `k-${f.name}` })) as UploadFn);
  const onError = opts.onError ?? vi.fn();
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <BlockEditorProvider
      uploadImage={uploadImage}
      onError={onError}
      autoResize={opts.autoResize ?? false}
      maxSizeMB={opts.maxSizeMB ?? 10}
    >
      {children}
    </BlockEditorProvider>
  );
  return { Wrapper, uploadImage, onError };
}

function imageFile(name = 'a.jpg', type = 'image/jpeg', body = 'x'): File {
  return new File([body], name, { type });
}

function makeDragEvent(files: File[], includeFilesType = true): any {
  const dataTransfer = {
    files,
    types: includeFilesType ? ['Files'] : ['text/plain'],
  };
  return {
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    dataTransfer,
  };
}

// --- drag state machine ----------------------------------------------------

describe('useImageDropZone — drag state machine', () => {
  it('flips isDragOver=true on dragEnter when dataTransfer.types includes "Files"', () => {
    const { Wrapper } = makeWrapper();
    const onUpload = vi.fn();
    const { result } = renderHook(() => useImageDropZone({ onUpload }), { wrapper: Wrapper });

    expect(result.current.isDragOver).toBe(false);
    act(() => {
      result.current.dragHandlers.onDragEnter(makeDragEvent([], true));
    });
    expect(result.current.isDragOver).toBe(true);
  });

  it('leaves isDragOver=false on dragEnter when "Files" is not in types', () => {
    const { Wrapper } = makeWrapper();
    const onUpload = vi.fn();
    const { result } = renderHook(() => useImageDropZone({ onUpload }), { wrapper: Wrapper });
    act(() => {
      result.current.dragHandlers.onDragEnter(makeDragEvent([], false));
    });
    expect(result.current.isDragOver).toBe(false);
  });

  it('keeps isDragOver=true through nested dragEnter pairs and only clears when counter hits zero', () => {
    const { Wrapper } = makeWrapper();
    const onUpload = vi.fn();
    const { result } = renderHook(() => useImageDropZone({ onUpload }), { wrapper: Wrapper });

    act(() => {
      result.current.dragHandlers.onDragEnter(makeDragEvent([], true));
      result.current.dragHandlers.onDragEnter(makeDragEvent([], true)); // child element
    });
    expect(result.current.isDragOver).toBe(true);

    act(() => {
      result.current.dragHandlers.onDragLeave(makeDragEvent([], true));
    });
    // counter == 1 → still over
    expect(result.current.isDragOver).toBe(true);

    act(() => {
      result.current.dragHandlers.onDragLeave(makeDragEvent([], true));
    });
    // counter == 0 → cleared
    expect(result.current.isDragOver).toBe(false);
  });

  it('drop always resets isDragOver to false even when entered first', () => {
    const { Wrapper } = makeWrapper();
    const onUpload = vi.fn();
    const { result } = renderHook(() => useImageDropZone({ onUpload }), { wrapper: Wrapper });

    act(() => {
      result.current.dragHandlers.onDragEnter(makeDragEvent([], true));
    });
    expect(result.current.isDragOver).toBe(true);

    act(() => {
      result.current.dragHandlers.onDrop(makeDragEvent([imageFile()]));
    });
    expect(result.current.isDragOver).toBe(false);
  });

  it('onDragOver calls preventDefault/stopPropagation (required for drop to fire) without state changes', () => {
    const { Wrapper } = makeWrapper();
    const onUpload = vi.fn();
    const { result } = renderHook(() => useImageDropZone({ onUpload }), { wrapper: Wrapper });

    const ev = makeDragEvent([], true);
    act(() => {
      result.current.dragHandlers.onDragOver(ev);
    });
    expect(ev.preventDefault).toHaveBeenCalled();
    expect(ev.stopPropagation).toHaveBeenCalled();
    expect(result.current.isDragOver).toBe(false);
  });
});

// --- drop pipeline ---------------------------------------------------------

describe('useImageDropZone — drop pipeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uploads exactly one file when multiple=false and several images are dropped', async () => {
    const { Wrapper, uploadImage } = makeWrapper();
    const onUpload = vi.fn();
    const { result } = renderHook(() => useImageDropZone({ onUpload }), { wrapper: Wrapper });

    await act(async () => {
      result.current.dragHandlers.onDrop(
        makeDragEvent([imageFile('a.jpg'), imageFile('b.jpg'), imageFile('c.jpg')]),
      );
      // drop schedules processFiles via React batching; flush microtasks.
      await Promise.resolve();
    });

    expect(uploadImage).toHaveBeenCalledTimes(1);
    expect((uploadImage as any).mock.calls[0][0].name).toBe('a.jpg');
    expect(onUpload).toHaveBeenCalledTimes(1);
  });

  it('uploads every file when multiple=true and no maxFiles is set', async () => {
    const { Wrapper, uploadImage } = makeWrapper();
    const onUpload = vi.fn();
    const { result } = renderHook(
      () => useImageDropZone({ multiple: true, onUpload }),
      { wrapper: Wrapper },
    );

    await act(async () => {
      result.current.dragHandlers.onDrop(
        makeDragEvent([imageFile('a.jpg'), imageFile('b.jpg')]),
      );
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(uploadImage).toHaveBeenCalledTimes(2);
    expect(onUpload).toHaveBeenCalledTimes(2);
  });

  it('caps the upload batch at maxFiles AND surfaces a transient notice (auto-dismiss)', async () => {
    const { Wrapper, uploadImage } = makeWrapper();
    const onUpload = vi.fn();
    const { result } = renderHook(
      () => useImageDropZone({ multiple: true, maxFiles: 2, onUpload }),
      { wrapper: Wrapper },
    );

    await act(async () => {
      result.current.dragHandlers.onDrop(
        makeDragEvent([imageFile('a.jpg'), imageFile('b.jpg'), imageFile('c.jpg')]),
      );
      await Promise.resolve();
      await Promise.resolve();
    });

    // Spec: only the first `maxFiles` are forwarded to uploadImage.
    expect(uploadImage).toHaveBeenCalledTimes(2);
    expect(onUpload).toHaveBeenCalledTimes(2);
    // Cap notice is now persisted (not overwritten by the post-validation
    // setError(null)) so the user can see why the batch was clipped.
    expect(result.current.error).toBe('최대 2개까지 업로드할 수 있습니다.');
  });

  it('auto-dismisses the maxFiles cap notice after the timeout', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      const { Wrapper } = makeWrapper();
      const onUpload = vi.fn();
      const { result } = renderHook(
        () => useImageDropZone({ multiple: true, maxFiles: 1, onUpload }),
        { wrapper: Wrapper },
      );

      await act(async () => {
        result.current.dragHandlers.onDrop(
          makeDragEvent([imageFile('a.jpg'), imageFile('b.jpg')]),
        );
        await Promise.resolve();
        await Promise.resolve();
      });
      expect(result.current.error).toBe('최대 1개까지 업로드할 수 있습니다.');

      await act(async () => {
        vi.advanceTimersByTime(4000);
      });
      expect(result.current.error).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('a fresh validation error replaces the cap notice and is NOT auto-dismissed', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      const { Wrapper } = makeWrapper();
      const onUpload = vi.fn();
      const { result } = renderHook(
        () => useImageDropZone({ multiple: true, maxFiles: 1, onUpload }),
        { wrapper: Wrapper },
      );

      // First drop: cap notice appears.
      await act(async () => {
        result.current.dragHandlers.onDrop(
          makeDragEvent([imageFile('a.jpg'), imageFile('b.jpg')]),
        );
        await Promise.resolve();
        await Promise.resolve();
      });
      expect(result.current.error).toBe('최대 1개까지 업로드할 수 있습니다.');

      // Second batch via file input: includes a banned SVG.
      const list = {
        length: 1,
        0: new File(['<svg/>'], 'x.svg', { type: 'image/svg+xml' }),
        item: (i: number) => (i === 0 ? new File(['<svg/>'], 'x.svg', { type: 'image/svg+xml' }) : null),
      } as unknown as FileList;
      await act(async () => {
        await result.current.handleFileInput(list);
      });

      // Validation error replaces the cap notice.
      expect(result.current.error).not.toBe('최대 1개까지 업로드할 수 있습니다.');
      expect(result.current.error).toMatch(/SVG/);

      // And the pending auto-dismiss timer must not wipe out the validation error.
      await act(async () => {
        vi.advanceTimersByTime(5000);
      });
      expect(result.current.error).toMatch(/SVG/);
    } finally {
      vi.useRealTimers();
    }
  });

  it('rejects the entire batch with a single error when one file fails validation', async () => {
    const { Wrapper, uploadImage } = makeWrapper();
    const onUpload = vi.fn();
    const { result } = renderHook(
      () => useImageDropZone({ multiple: true, onUpload }),
      { wrapper: Wrapper },
    );

    // SVG passes the drop-time ALLOWED_IMAGE_TYPES filter? No — SVG is NOT
    // in ALLOWED_IMAGE_TYPES, so it's filtered out at drop. To hit
    // processFiles validation, route via handleFileInput which skips the
    // drop-time filter.
    const list = {
      length: 2,
      0: imageFile('ok.jpg'),
      1: new File(['<svg/>'], 'evil.svg', { type: 'image/svg+xml' }),
      item: (i: number) => (i === 0 ? imageFile('ok.jpg') : null),
    } as unknown as FileList;

    await act(async () => {
      await result.current.handleFileInput(list);
    });

    // Validation runs sequentially; SVG (second) triggers early return.
    // First file is NOT uploaded because validation iterates the WHOLE
    // batch before any upload.
    expect(uploadImage).not.toHaveBeenCalled();
    expect(result.current.error).not.toBeNull();
    expect(onUpload).not.toHaveBeenCalled();
  });

  it('filters non-image MIME types at drop time and reports "이미지 파일만" when nothing remains', async () => {
    const { Wrapper, uploadImage } = makeWrapper();
    const onUpload = vi.fn();
    const { result } = renderHook(() => useImageDropZone({ onUpload }), { wrapper: Wrapper });

    const pdf = new File(['%PDF'], 'doc.pdf', { type: 'application/pdf' });
    await act(async () => {
      result.current.dragHandlers.onDrop(makeDragEvent([pdf]));
      await Promise.resolve();
    });

    expect(uploadImage).not.toHaveBeenCalled();
    expect(result.current.error).toContain('이미지');
  });

  it('does nothing when disabled=true (no upload, no error, no state change)', async () => {
    const { Wrapper, uploadImage } = makeWrapper();
    const onUpload = vi.fn();
    const { result } = renderHook(
      () => useImageDropZone({ onUpload, disabled: true }),
      { wrapper: Wrapper },
    );

    await act(async () => {
      result.current.dragHandlers.onDrop(makeDragEvent([imageFile()]));
      await Promise.resolve();
    });

    expect(uploadImage).not.toHaveBeenCalled();
    expect(onUpload).not.toHaveBeenCalled();
    expect(result.current.error).toBeNull();
  });

  it('forwards onKeyTracked for every successful upload that returns a key', async () => {
    const upload: UploadFn = vi.fn(async (f: File): Promise<UploadResult> => ({
      url: `https://cdn/${f.name}`,
      key: `k-${f.name}`,
    }));
    const { Wrapper } = makeWrapper({ uploadImage: upload });
    const onUpload = vi.fn();
    const onKeyTracked = vi.fn();
    const { result } = renderHook(
      () => useImageDropZone({ multiple: true, onUpload, onKeyTracked }),
      { wrapper: Wrapper },
    );

    await act(async () => {
      result.current.dragHandlers.onDrop(
        makeDragEvent([imageFile('a.jpg'), imageFile('b.jpg')]),
      );
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(onKeyTracked).toHaveBeenCalledTimes(2);
    expect(onKeyTracked).toHaveBeenCalledWith('k-a.jpg');
    expect(onKeyTracked).toHaveBeenCalledWith('k-b.jpg');
  });

  it('skips onKeyTracked when the upload result has no key', async () => {
    const upload: UploadFn = vi.fn(async (f: File): Promise<UploadResult> => ({
      url: `https://cdn/${f.name}`,
    }));
    const { Wrapper } = makeWrapper({ uploadImage: upload });
    const onUpload = vi.fn();
    const onKeyTracked = vi.fn();
    const { result } = renderHook(
      () => useImageDropZone({ onUpload, onKeyTracked }),
      { wrapper: Wrapper },
    );

    await act(async () => {
      result.current.dragHandlers.onDrop(makeDragEvent([imageFile()]));
      await Promise.resolve();
    });

    expect(onUpload).toHaveBeenCalledTimes(1);
    expect(onKeyTracked).not.toHaveBeenCalled();
  });

  it('routes upload exceptions to both state.error and the provider onError callback', async () => {
    const upload: UploadFn = vi.fn(async () => {
      throw new Error('서버가 거부함');
    });
    const onError = vi.fn();
    const { Wrapper } = makeWrapper({ uploadImage: upload, onError });
    const onUpload = vi.fn();
    const { result } = renderHook(() => useImageDropZone({ onUpload }), { wrapper: Wrapper });

    await act(async () => {
      result.current.dragHandlers.onDrop(makeDragEvent([imageFile()]));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(onUpload).not.toHaveBeenCalled();
    expect(result.current.error).toBe('서버가 거부함');
    expect(onError).toHaveBeenCalledWith('서버가 거부함');
    expect(result.current.isUploading).toBe(false); // finally{} clears it
  });

  it('uses fallback message "업로드 중 오류 발생" when the thrown value is not an Error', async () => {
    const upload: UploadFn = vi.fn(async () => {
      throw 'plain string'; // eslint-disable-line @typescript-eslint/no-throw-literal
    });
    const onError = vi.fn();
    const { Wrapper } = makeWrapper({ uploadImage: upload, onError });
    const onUpload = vi.fn();
    const { result } = renderHook(() => useImageDropZone({ onUpload }), { wrapper: Wrapper });

    await act(async () => {
      result.current.dragHandlers.onDrop(makeDragEvent([imageFile()]));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(result.current.error).toBe('업로드 중 오류 발생');
    expect(onError).toHaveBeenCalledWith('업로드 중 오류 발생');
  });
});

// --- handleFileInput -------------------------------------------------------

describe('useImageDropZone — handleFileInput', () => {
  it('does nothing when FileList is null', async () => {
    const { Wrapper, uploadImage } = makeWrapper();
    const onUpload = vi.fn();
    const { result } = renderHook(() => useImageDropZone({ onUpload }), { wrapper: Wrapper });

    await act(async () => {
      await result.current.handleFileInput(null);
    });

    expect(uploadImage).not.toHaveBeenCalled();
    expect(result.current.error).toBeNull();
  });

  it('does nothing when FileList is empty', async () => {
    const { Wrapper, uploadImage } = makeWrapper();
    const onUpload = vi.fn();
    const { result } = renderHook(() => useImageDropZone({ onUpload }), { wrapper: Wrapper });

    const empty = { length: 0, item: () => null } as unknown as FileList;
    await act(async () => {
      await result.current.handleFileInput(empty);
    });

    expect(uploadImage).not.toHaveBeenCalled();
  });

  it('processes a single file via handleFileInput end-to-end (input fallback path)', async () => {
    const { Wrapper, uploadImage } = makeWrapper();
    const onUpload = vi.fn();
    const { result } = renderHook(() => useImageDropZone({ onUpload }), { wrapper: Wrapper });

    const file = imageFile('picked.jpg');
    const list = { length: 1, 0: file, item: (i: number) => (i === 0 ? file : null) } as unknown as FileList;

    await act(async () => {
      await result.current.handleFileInput(list);
    });

    expect(uploadImage).toHaveBeenCalledTimes(1);
    expect(onUpload).toHaveBeenCalledTimes(1);
    expect(onUpload.mock.calls[0][0].url).toBe('https://cdn/picked.jpg');
  });
});
