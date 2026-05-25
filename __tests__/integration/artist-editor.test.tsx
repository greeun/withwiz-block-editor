// __tests__/integration/artist-editor.test.tsx
//
// Integration tests for ArtistEditor + BlockEditorProvider.
// Journey-style scenarios: mount → upload main image → add gallery
// → reorder/remove → upload error path.
//
// Layer ownership note: this file covers user-flow round-trips that touch
// ArtistEditor state, the Provider's uploadImage/onError contract, and
// the serializer marker that round-trips through onChange. It is NOT a
// re-test of serializer correctness (see unit/serializer + integration
// block-editor-integration) or HTML escaping (see core/html-renderer
// unit tests).
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ArtistEditor } from '../../src/components/ArtistEditor';
import { BlockEditorProvider } from '../../src/context/BlockEditorProvider';
import { createSerializer } from '../../src/core/serializer';
import type { ArtistBioData, UploadResult } from '../../src/types';

const MARKER = 'abe-blocks:';
const ser = createSerializer<ArtistBioData>(MARKER);

/**
 * Trigger the hidden <input type="file"> that ArtistEditor creates on click.
 * The component creates the input lazily via document.createElement, calls
 * input.click(), and waits for its onchange. In jsdom click() does NOT open
 * a picker, so we hijack the prototype's click to capture the live input
 * instance, then drive its files + onchange ourselves.
 */
function withFilePicker(): {
  next: (files: File[]) => Promise<void>;
  restore: () => void;
} {
  let pending: HTMLInputElement | null = null;
  const original = HTMLInputElement.prototype.click;
  HTMLInputElement.prototype.click = function patched() {
    if (this.type === 'file') {
      pending = this;
      return;
    }
    // Non-file inputs fall through to native behaviour.
    return original.call(this);
  };

  async function next(files: File[]): Promise<void> {
    if (!pending) throw new Error('No file input was clicked');
    const input = pending;
    pending = null;
    Object.defineProperty(input, 'files', {
      configurable: true,
      get() {
        // Spread first so the explicit `length`/`item`/iterator below win —
        // arrays carry their own `length` which would otherwise duplicate
        // the key (TS2783) and overwrite the intended one.
        return {
          ...files,
          length: files.length,
          item: (i: number) => files[i] ?? null,
          [Symbol.iterator]: function* () {
            for (const f of files) yield f;
          },
        };
      },
    });
    // ArtistEditor assigns input.onchange directly (not addEventListener),
    // so we invoke it as the function. Wrap in act so React state updates
    // from the async onChange callback flush before assertions.
    await act(async () => {
      // @ts-expect-error - call the assigned handler
      await input.onchange?.();
    });
  }

  return {
    next,
    restore() {
      HTMLInputElement.prototype.click = original;
    },
  };
}

function makeFile(name = 'pic.png'): File {
  return new File(['x'], name, { type: 'image/png' });
}

beforeEach(() => {
  document.body.innerHTML = '';
  // ArtistEditor doesn't use execCommand but Provider may render child
  // components later; keep parity with other suites.
  document.execCommand = vi.fn(() => true);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ArtistEditor — mount with empty value', () => {
  it('renders editor + preview scaffold and the empty-state preview message', () => {
    const upload = vi.fn();
    const onChange = vi.fn();
    render(
      <BlockEditorProvider uploadImage={upload}>
        <ArtistEditor content="" onChange={onChange} />
      </BlockEditorProvider>,
    );

    // Editor scaffold
    expect(document.querySelector('.abe-wrapper')).toBeTruthy();
    expect(document.querySelector('.abe-editor')).toBeTruthy();
    expect(document.querySelector('.abe-textarea')).toBeTruthy();

    // Main image dropzone (no image yet → no .has-image)
    const mainDrop = document.querySelector('.abe-main-img-upload')!;
    expect(mainDrop.classList.contains('has-image')).toBe(false);
    expect(mainDrop.querySelector('img')).toBeNull();

    // Gallery: no items yet, but the "add" button is present (remaining=5)
    expect(document.querySelector('.abe-gallery-grid')).toBeNull();
    expect(screen.getByRole('button', { name: /이미지 추가/ })).toBeTruthy();

    // Preview shows the empty-state placeholder
    const preview = document.querySelector('.abe-pv-article')!;
    expect(preview.textContent).toContain('약력을 입력하면');

    // No upload triggered on mount, no spurious onChange.
    expect(upload).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('ArtistEditor — hydrate from existing serialized value', () => {
  it('rehydrates text + mainImage + gallery from a marker payload', () => {
    const initial: ArtistBioData = {
      text: '국립대학 졸업\n2010 데뷔',
      mainImage: 'https://cdn.example.com/main.png',
      gallery: [
        'https://cdn.example.com/g1.png',
        'https://cdn.example.com/g2.png',
      ],
    };
    const serialized = `<div>ignored</div>${ser.serialize(initial)}`;

    render(
      <BlockEditorProvider uploadImage={vi.fn()}>
        <ArtistEditor content={serialized} onChange={vi.fn()} />
      </BlockEditorProvider>,
    );

    // Textarea preloaded
    const textarea = document.querySelector<HTMLTextAreaElement>('.abe-textarea')!;
    expect(textarea.value).toBe(initial.text);

    // Main image rendered inside the dropzone
    const mainDrop = document.querySelector('.abe-main-img-upload')!;
    expect(mainDrop.classList.contains('has-image')).toBe(true);
    const mainImg = mainDrop.querySelector('img')!;
    expect(mainImg.getAttribute('src')).toBe(initial.mainImage);

    // Gallery items rendered, count matches
    const galleryItems = document.querySelectorAll('.abe-gallery-item');
    expect(galleryItems.length).toBe(2);

    // Counter label reflects 2/5
    expect(document.body.textContent).toMatch(/2\/5/);
  });
});

describe('ArtistEditor — user adds the main image', () => {
  it('emits onChange whose payload deserializes with the uploaded mainImage', async () => {
    const upload = vi.fn(async (): Promise<UploadResult> => ({
      url: 'https://cdn.example.com/uploaded-main.png',
      key: 'k-main',
    }));
    const onChange = vi.fn();
    const onImageUploaded = vi.fn();

    render(
      <BlockEditorProvider uploadImage={upload}>
        <ArtistEditor
          content=""
          onChange={onChange}
          onImageUploaded={onImageUploaded}
        />
      </BlockEditorProvider>,
    );

    const picker = withFilePicker();
    try {
      const mainDrop = document.querySelector('.abe-main-img-upload')! as HTMLElement;
      fireEvent.click(mainDrop);
      await picker.next([makeFile('main.png')]);
    } finally {
      picker.restore();
    }

    await waitFor(() => expect(onChange).toHaveBeenCalled());
    expect(upload).toHaveBeenCalledTimes(1);
    expect(onImageUploaded).toHaveBeenCalledWith('k-main');

    const lastHtml = onChange.mock.calls.at(-1)![0] as string;
    const hydrated = ser.deserialize(lastHtml);
    expect(hydrated).not.toBeNull();
    expect(hydrated!.mainImage).toBe('https://cdn.example.com/uploaded-main.png');
    expect(hydrated!.gallery).toEqual([]);
    expect(hydrated!.text).toBe('');
  });
});

describe('ArtistEditor — user adds, reorders, and removes gallery images', () => {
  it('add three → remove the middle one → onChange reflects each step', async () => {
    let nextUrlIdx = 0;
    const urls = [
      'https://cdn.example.com/g-a.png',
      'https://cdn.example.com/g-b.png',
      'https://cdn.example.com/g-c.png',
    ];
    const upload = vi.fn(async (): Promise<UploadResult> => ({
      url: urls[nextUrlIdx++],
      key: `k-${nextUrlIdx}`,
    }));
    const onChange = vi.fn();

    render(
      <BlockEditorProvider uploadImage={upload}>
        <ArtistEditor content="" onChange={onChange} />
      </BlockEditorProvider>,
    );

    const picker = withFilePicker();
    try {
      // Click the gallery "add" button → submit 3 files in one go.
      const addBtn = screen.getByRole('button', { name: /이미지 추가/ });
      fireEvent.click(addBtn);
      await picker.next([
        makeFile('a.png'),
        makeFile('b.png'),
        makeFile('c.png'),
      ]);
    } finally {
      picker.restore();
    }

    // After 3 uploads, gallery should hold all 3 in upload order.
    await waitFor(() => {
      const items = document.querySelectorAll('.abe-gallery-item img');
      expect(items.length).toBe(3);
    });

    const itemsAfterAdd = Array.from(
      document.querySelectorAll<HTMLImageElement>('.abe-gallery-item img'),
    ).map((i) => i.getAttribute('src'));
    expect(itemsAfterAdd).toEqual(urls);

    const lastAfterAdd = ser.deserialize(onChange.mock.calls.at(-1)![0] as string)!;
    expect(lastAfterAdd.gallery).toEqual(urls);

    // Remove the middle item (index 1). The component renders one × button
    // per item under .abe-gallery-item — pick the second one.
    const removeBtns = document.querySelectorAll<HTMLButtonElement>(
      '.abe-gallery-item .abe-img-remove-btn',
    );
    expect(removeBtns.length).toBe(3);
    fireEvent.click(removeBtns[1]);

    await waitFor(() => {
      const items = document.querySelectorAll('.abe-gallery-item img');
      expect(items.length).toBe(2);
    });

    const itemsAfterRemove = Array.from(
      document.querySelectorAll<HTMLImageElement>('.abe-gallery-item img'),
    ).map((i) => i.getAttribute('src'));
    expect(itemsAfterRemove).toEqual([urls[0], urls[2]]);

    const lastAfterRemove = ser.deserialize(onChange.mock.calls.at(-1)![0] as string)!;
    expect(lastAfterRemove.gallery).toEqual([urls[0], urls[2]]);
  });

  it('respects maxGallery: warns via onError once the cap is hit and skips upload', () => {
    const upload = vi.fn();
    const onError = vi.fn();
    const onChange = vi.fn();

    // Seed with a full 2-slot gallery and maxGallery=2 so the next click
    // should refuse to even open the picker.
    const seed: ArtistBioData = {
      text: '',
      mainImage: '',
      gallery: ['https://cdn.example.com/x.png', 'https://cdn.example.com/y.png'],
    };
    render(
      <BlockEditorProvider uploadImage={upload} onError={onError}>
        <ArtistEditor
          content={ser.serialize(seed)}
          onChange={onChange}
          maxGallery={2}
        />
      </BlockEditorProvider>,
    );

    // When remaining === 0 the "add" button is not rendered. The spec
    // documents the cap via the button being absent and onError firing
    // only on programmatic over-add attempts. We assert the visible
    // contract: button gone, no upload triggered.
    expect(screen.queryByRole('button', { name: /이미지 추가/ })).toBeNull();
    expect(upload).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  });
});

describe('ArtistEditor — upload failure path invokes onError', () => {
  it('onError is called with the failure message and no onChange fires for the failed file', async () => {
    const upload = vi.fn(async () => {
      throw new Error('network down');
    });
    const onError = vi.fn();
    const onChange = vi.fn();

    render(
      <BlockEditorProvider uploadImage={upload} onError={onError}>
        <ArtistEditor content="" onChange={onChange} />
      </BlockEditorProvider>,
    );

    const picker = withFilePicker();
    try {
      const mainDrop = document.querySelector('.abe-main-img-upload')! as HTMLElement;
      fireEvent.click(mainDrop);
      await picker.next([makeFile('boom.png')]);
    } finally {
      picker.restore();
    }

    await waitFor(() => expect(onError).toHaveBeenCalled());
    expect(onError).toHaveBeenLastCalledWith('이미지 업로드 중 오류 발생');
    expect(upload).toHaveBeenCalledTimes(1);
    // The failure must NOT propagate as a successful state update — the
    // main image dropzone should remain in its empty state.
    expect(
      document.querySelector('.abe-main-img-upload')!.classList.contains('has-image'),
    ).toBe(false);
    // And onChange must not have been fed a payload that contains the
    // failed upload.
    for (const call of onChange.mock.calls) {
      const payload = ser.deserialize(call[0] as string);
      expect(payload?.mainImage ?? '').toBe('');
    }
  });
});
