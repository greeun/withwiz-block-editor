"use client";

import { useRef } from "react";
import { useImageDropZone } from "../hooks/useImageDropZone";

interface ImageUploadFieldProps {
  blockId: number;
  field: string;
  src: string;
  className?: string;
  onUploadComplete: (blockId: number, field: string, url: string) => void;
  onKeyTracked?: (key: string) => void;
  onClear: (blockId: number, field: string) => void;
}

export function ImageUploadField({
  blockId,
  field,
  src,
  className,
  onUploadComplete,
  onKeyTracked,
  onClear,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const drop = useImageDropZone({
    onUpload: (result) => onUploadComplete(blockId, field, result.url),
    onKeyTracked,
  });

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={async (e) => {
          await drop.handleFileInput(e.target.files);
          e.target.value = "";
        }}
      />
      <div
        className={`be-img-upload ${src ? "has-image" : ""} ${className || ""}${drop.isDragOver ? " is-drag-over" : ""}${drop.isUploading ? " is-uploading" : ""}${drop.isResizing ? " is-resizing" : ""}`}
        onClick={() => !src && !drop.isUploading && !drop.isResizing && inputRef.current?.click()}
        {...drop.dragHandlers}
      >
        {drop.isResizing ? (
          <div className="be-upload-spinner">이미지 최적화 중...</div>
        ) : drop.isUploading ? (
          <div className="be-upload-spinner">업로드 중...</div>
        ) : drop.isDragOver ? (
          <div className="be-drag-hint">여기에 놓으세요</div>
        ) : (
          <>
            <span className="be-img-upload-text">+ 이미지 업로드</span>
            <span className="be-img-upload-hint">JPG, PNG, WebP, GIF / 10MB 초과 시 자동 최적화</span>
          </>
        )}
        {src && (
          <>
            <img src={src} alt="" />
            <button
              className="be-img-remove-btn"
              onClick={(e) => {
                e.stopPropagation();
                onClear(blockId, field);
              }}
            >
              &times;
            </button>
          </>
        )}
      </div>
      {drop.error && <div className="be-error">{drop.error}</div>}
    </>
  );
}
