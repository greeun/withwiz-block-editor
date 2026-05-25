/**
 * Unit tests for src/context/BlockEditorProvider.tsx
 *
 * Spec (derived from source + types.ts):
 *   - Provider props: uploadImage (required), onError (default console.error),
 *     autoResize (default true), maxSizeMB (default 10).
 *   - useBlockEditorContext throws when no provider is mounted above it
 *     (error message contains "BlockEditorProvider").
 *   - Provider value identity: uploadImage / onError pass through unchanged;
 *     defaults applied when props omitted.
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import {
  BlockEditorProvider,
  useBlockEditorContext,
} from '../../../src/context/BlockEditorProvider';
import type { UploadFn } from '../../../src/types';

const makeUpload = (): UploadFn =>
  vi.fn(async (_file: File) => ({ url: 'https://cdn.example/x.jpg', key: 'x' }));

describe('useBlockEditorContext (no provider)', () => {
  it('throws an error mentioning BlockEditorProvider when used outside a provider', () => {
    // renderHook surfaces the throw via result.error in v16; we use a
    // try/catch wrapper renderer for forward-compat.
    let caught: unknown;
    try {
      renderHook(() => useBlockEditorContext());
    } catch (e) {
      caught = e;
    }
    // React 19 surfaces the error via console + result; renderHook with no
    // provider may either throw synchronously OR return a hook that throws
    // when accessed. Cover both shapes.
    if (caught === undefined) {
      const { result } = renderHook(() => {
        try {
          return useBlockEditorContext();
        } catch (e) {
          return e;
        }
      });
      expect(result.current).toBeInstanceOf(Error);
      expect((result.current as Error).message).toContain('BlockEditorProvider');
    } else {
      expect(caught).toBeInstanceOf(Error);
      expect((caught as Error).message).toContain('BlockEditorProvider');
    }
  });
});

describe('BlockEditorProvider defaults', () => {
  it('applies autoResize=true and maxSizeMB=10 when those props are omitted', () => {
    const uploadImage = makeUpload();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <BlockEditorProvider uploadImage={uploadImage}>{children}</BlockEditorProvider>
    );
    const { result } = renderHook(() => useBlockEditorContext(), { wrapper });
    expect(result.current.autoResize).toBe(true);
    expect(result.current.maxSizeMB).toBe(10);
  });

  it('uses console.error as the default onError when none is provided', () => {
    const uploadImage = makeUpload();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <BlockEditorProvider uploadImage={uploadImage}>{children}</BlockEditorProvider>
    );
    const { result } = renderHook(() => useBlockEditorContext(), { wrapper });
    expect(result.current.onError).toBe(console.error);
  });
});

describe('BlockEditorProvider value pass-through', () => {
  it('exposes the exact uploadImage reference to consumers (no wrapping)', () => {
    const uploadImage = makeUpload();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <BlockEditorProvider uploadImage={uploadImage}>{children}</BlockEditorProvider>
    );
    const { result } = renderHook(() => useBlockEditorContext(), { wrapper });
    expect(result.current.uploadImage).toBe(uploadImage);
  });

  it('invokes the consumer-supplied uploadImage with the dropped File when called', async () => {
    const uploadImage = makeUpload();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <BlockEditorProvider uploadImage={uploadImage}>{children}</BlockEditorProvider>
    );
    const { result } = renderHook(() => useBlockEditorContext(), { wrapper });

    const file = new File(['x'], 'a.jpg', { type: 'image/jpeg' });
    const upload = await result.current.uploadImage(file);

    expect(uploadImage).toHaveBeenCalledTimes(1);
    expect(uploadImage).toHaveBeenCalledWith(file);
    expect(upload.url).toBe('https://cdn.example/x.jpg');
  });

  it('routes error messages to the consumer-supplied onError callback', () => {
    const uploadImage = makeUpload();
    const onError = vi.fn();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <BlockEditorProvider uploadImage={uploadImage} onError={onError}>
        {children}
      </BlockEditorProvider>
    );
    const { result } = renderHook(() => useBlockEditorContext(), { wrapper });

    result.current.onError('업로드 실패');
    expect(onError).toHaveBeenCalledWith('업로드 실패');
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('honors explicit autoResize=false and custom maxSizeMB', () => {
    const uploadImage = makeUpload();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <BlockEditorProvider uploadImage={uploadImage} autoResize={false} maxSizeMB={5}>
        {children}
      </BlockEditorProvider>
    );
    const { result } = renderHook(() => useBlockEditorContext(), { wrapper });
    expect(result.current.autoResize).toBe(false);
    expect(result.current.maxSizeMB).toBe(5);
  });
});
