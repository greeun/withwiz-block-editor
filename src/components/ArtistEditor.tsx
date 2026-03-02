"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useBlockEditorContext } from "../context/BlockEditorProvider";
import { createSerializer } from "../core/serializer";
import { h, nl2br } from "../core/html-renderer";
import type { ArtistBioData } from "../types";

/* ═══ Serialization ═══ */

const DEFAULT_MARKER = "abe-blocks:";

function generateHtml(data: ArtistBioData): string {
  const hasText = !!data.text.trim();
  const hasMain = !!data.mainImage;
  const galleryImages = data.gallery.filter(Boolean);
  const hasGallery = galleryImages.length > 0;

  if (!hasText && !hasMain && !hasGallery) {
    return '<div class="abe-pv-body"><div class="abe-pv-empty">약력을 입력하면 미리보기가 표시됩니다</div></div>';
  }

  let html = '<div class="abe-pv-body">';

  if (hasText || hasMain) {
    if (hasText && hasMain) {
      html += '<div class="abe-pv-intro">';
      html += `<div class="abe-pv-bio">${nl2br(data.text)}</div>`;
      html += `<div class="abe-pv-main-img"><img src="${data.mainImage}" alt=""></div>`;
      html += "</div>";
    } else if (hasText) {
      html += `<div class="abe-pv-bio" style="margin-bottom:20px">${nl2br(data.text)}</div>`;
    } else {
      html += `<div class="abe-pv-main-img" style="max-width:200px;margin-bottom:20px"><img src="${data.mainImage}" alt=""></div>`;
    }
  }

  if (hasGallery) {
    const n = galleryImages.length;
    html += '<div class="abe-pv-gallery">';
    html += '<div class="abe-pv-gallery-label">Gallery</div>';
    html += `<div class="abe-pv-gallery-grid layout-${n}">`;
    galleryImages.forEach((src, i) => {
      html += `<img src="${h(src)}" alt="" class="abe-gi abe-gi-${i}">`;
    });
    html += "</div></div>";
  }

  html += "</div>";
  return html;
}

/* ═══ Props ═══ */

interface ArtistEditorProps {
  content: string;
  onChange: (html: string) => void;
  onImageUploaded?: (key: string) => void;
  placeholder?: string;
  /** Serialization marker (default: "abe-blocks:") */
  marker?: string;
  /** Max gallery images (default: 5) */
  maxGallery?: number;
}

/* ═══ Component ═══ */

export function ArtistEditor({
  content,
  onChange,
  onImageUploaded,
  placeholder,
  marker = DEFAULT_MARKER,
  maxGallery = 5,
}: ArtistEditorProps) {
  const { uploadImage, onError } = useBlockEditorContext();
  const ser = useRef(createSerializer<ArtistBioData>(marker));

  const [data, setData] = useState<ArtistBioData>(() => {
    const existing = ser.current.deserialize(content);
    if (existing) return existing;
    const plainText = content
      ? content.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "").trim()
      : "";
    return { text: plainText, mainImage: "", gallery: [] };
  });

  const isInitialMount = useRef(true);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const html = generateHtml(data);
    const serialized = ser.current.serialize(data);
    onChangeRef.current(html + serialized);
  }, [data]);

  const updateText = useCallback((text: string) => {
    setData((prev) => ({ ...prev, text }));
  }, []);

  const updateMainImage = useCallback((mainImage: string) => {
    setData((prev) => ({ ...prev, mainImage }));
  }, []);

  const updateGalleryImage = useCallback((index: number, src: string) => {
    setData((prev) => {
      const gallery = [...prev.gallery];
      gallery[index] = src;
      return { ...prev, gallery };
    });
  }, []);

  const removeGalleryImage = useCallback((index: number) => {
    setData((prev) => {
      const gallery = prev.gallery.filter((_, i) => i !== index);
      return { ...prev, gallery };
    });
  }, []);

  /* ─── Image Upload ─── */
  const handleImageUpload = useCallback(
    (target: "main" | number) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return;
        try {
          const result = await uploadImage(file);
          if (result.url) {
            if (target === "main") {
              updateMainImage(result.url);
            } else {
              updateGalleryImage(target, result.url);
            }
            if (result.key) onImageUploaded?.(result.key);
          }
        } catch {
          onError("이미지 업로드 중 오류 발생");
        }
      };
      input.click();
    },
    [uploadImage, updateMainImage, updateGalleryImage, onImageUploaded, onError],
  );

  const handleGalleryMultiUpload = useCallback(() => {
    const currentCount = data.gallery.filter(Boolean).length;
    const remaining = maxGallery - currentCount;
    if (remaining <= 0) {
      onError(`갤러리 이미지는 최대 ${maxGallery}장까지 등록할 수 있습니다.`);
      return;
    }
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.multiple = true;
    input.onchange = async () => {
      const files = Array.from(input.files || []).slice(0, remaining);
      if (files.length === 0) return;
      for (const file of files) {
        try {
          const result = await uploadImage(file);
          if (result.url) {
            setData((prev) => {
              if (prev.gallery.filter(Boolean).length >= maxGallery) return prev;
              return { ...prev, gallery: [...prev.gallery, result.url] };
            });
            if (result.key) onImageUploaded?.(result.key);
          }
        } catch {
          onError("이미지 업로드 중 오류 발생");
        }
      }
    };
    input.click();
  }, [data.gallery, maxGallery, uploadImage, onImageUploaded, onError]);

  /* ─── Render ─── */
  const previewHtml = generateHtml(data);
  const galleryImages = data.gallery.filter(Boolean);
  const galleryRemaining = maxGallery - galleryImages.length;

  return (
    <div className="abe-wrapper">
      {/* Editor */}
      <div className="abe-editor">
        <div className="abe-section">
          <div className="abe-section-label">약력 텍스트</div>
          <textarea
            className="abe-textarea"
            value={data.text}
            onChange={(e) => updateText(e.target.value)}
            placeholder={placeholder || "약력을 입력하세요..."}
          />
        </div>
        <div className="abe-section">
          <div className="abe-section-label">대표 이미지</div>
          <div
            className={`abe-main-img-upload ${data.mainImage ? "has-image" : ""}`}
            onClick={() => !data.mainImage && handleImageUpload("main")}
          >
            <span className="abe-upload-text">+ 이미지 업로드<br />3:4 비율 권장</span>
            {data.mainImage && (
              <>
                <img src={data.mainImage} alt="" />
                <button
                  className="abe-img-remove-btn"
                  onClick={(e) => { e.stopPropagation(); updateMainImage(""); }}
                >
                  &times;
                </button>
              </>
            )}
          </div>
        </div>
        <div className="abe-section">
          <div className="abe-section-label">추가 갤러리 ({galleryImages.length}/{maxGallery})</div>
          {galleryImages.length > 0 && (
            <div className="abe-gallery-grid">
              {galleryImages.map((src, i) => (
                <div key={i} className="abe-gallery-item has-image">
                  <img src={src} alt="" />
                  <button
                    className="abe-img-remove-btn"
                    onClick={() => removeGalleryImage(i)}
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}
          {galleryRemaining > 0 && (
            <button
              type="button"
              className="abe-gallery-add-btn"
              onClick={handleGalleryMultiUpload}
            >
              + 이미지 추가 (최대 {galleryRemaining}장 선택 가능)
            </button>
          )}
        </div>
      </div>
      {/* Preview */}
      <div className="abe-preview">
        <div className="abe-pv-label">실시간 미리보기</div>
        <div className="abe-pv-article" dangerouslySetInnerHTML={{ __html: previewHtml }} />
      </div>
    </div>
  );
}
