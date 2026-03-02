"use client";

import { useState, useCallback, useRef, type DragEvent } from "react";
import { useBlockEditorContext } from "../context/BlockEditorProvider";
import { resizeImageIfNeeded, validateImageFile, ALLOWED_IMAGE_TYPES } from "../core/image-resize";
import type { UploadResult } from "../types";

interface UseImageDropZoneOptions {
  multiple?: boolean;
  maxFiles?: number;
  onUpload: (result: UploadResult) => void;
  onKeyTracked?: (key: string) => void;
  disabled?: boolean;
}

export function useImageDropZone(options: UseImageDropZoneOptions) {
  const {
    multiple = false,
    maxFiles,
    onUpload,
    onKeyTracked,
    disabled = false,
  } = options;

  const { uploadImage, onError, autoResize, maxSizeMB } = useBlockEditorContext();
  const maxSize = maxSizeMB * 1024 * 1024;

  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dragCounterRef = useRef(0);

  const processFiles = useCallback(
    async (files: File[]) => {
      if (disabled || files.length === 0) return;

      let toProcess = multiple ? files : [files[0]];

      if (maxFiles && toProcess.length > maxFiles) {
        toProcess = toProcess.slice(0, maxFiles);
        setError(`최대 ${maxFiles}개까지 업로드할 수 있습니다.`);
      }

      // Validate
      for (const file of toProcess) {
        const validationError = validateImageFile(file);
        if (validationError) {
          setError(validationError);
          return;
        }
      }

      setError(null);

      // Resize if needed
      let resizedFiles: File[];
      const needsResize = autoResize && toProcess.some((f) => f.size > maxSize);

      if (needsResize) {
        setIsResizing(true);
        try {
          resizedFiles = [];
          for (const file of toProcess) {
            const result = await resizeImageIfNeeded(file);
            if (result.file.size > maxSize) {
              setError(
                `이미지 크기를 줄였지만 여전히 ${maxSizeMB}MB를 초과합니다. (${(result.file.size / 1024 / 1024).toFixed(1)}MB) 더 작은 이미지를 사용해 주세요.`,
              );
              setIsResizing(false);
              return;
            }
            resizedFiles.push(result.file);
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : "이미지 최적화 중 오류 발생";
          setError(msg);
          setIsResizing(false);
          return;
        }
        setIsResizing(false);
      } else {
        resizedFiles = toProcess;
      }

      // Upload
      setIsUploading(true);
      try {
        for (const file of resizedFiles) {
          const result = await uploadImage(file);
          onUpload(result);
          if (result.key) onKeyTracked?.(result.key);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "업로드 중 오류 발생";
        setError(msg);
        onError(msg);
      } finally {
        setIsUploading(false);
      }
    },
    [multiple, maxFiles, onUpload, onKeyTracked, disabled, uploadImage, onError, autoResize, maxSize, maxSizeMB],
  );

  const onDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer?.types.includes("Files")) {
      setIsDragOver(true);
    }
  }, []);

  const onDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const onDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragOver(false);
    }
  }, []);

  const onDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current = 0;
      setIsDragOver(false);

      if (disabled) return;

      const files = Array.from(e.dataTransfer?.files || []).filter((f) =>
        ALLOWED_IMAGE_TYPES.includes(f.type),
      );

      if (files.length === 0) {
        setError("이미지 파일만 업로드할 수 있습니다.");
        return;
      }

      processFiles(files);
    },
    [processFiles, disabled],
  );

  const handleFileInput = useCallback(
    async (fileList: FileList | null) => {
      const files = Array.from(fileList || []);
      if (files.length > 0) {
        await processFiles(files);
      }
    },
    [processFiles],
  );

  return {
    isDragOver,
    isUploading,
    isResizing,
    error,
    dragHandlers: { onDragEnter, onDragOver, onDragLeave, onDrop },
    handleFileInput,
  };
}
