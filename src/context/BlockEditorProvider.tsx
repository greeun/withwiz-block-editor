"use client";

import { createContext, useContext } from "react";
import type { UploadFn, ErrorFn } from "../types";

interface BlockEditorContextValue {
  uploadImage: UploadFn;
  onError: ErrorFn;
  autoResize: boolean;
  maxSizeMB: number;
}

const BlockEditorContext = createContext<BlockEditorContextValue | null>(null);

interface BlockEditorProviderProps {
  /** Upload function — project-specific (e.g. adminFetch → /api/upload) */
  uploadImage: UploadFn;
  /** Error handler — project-specific (e.g. toast.error) */
  onError?: ErrorFn;
  /** Auto-resize images over maxSizeMB (default: true) */
  autoResize?: boolean;
  /** Max image size in MB before auto-resize (default: 10) */
  maxSizeMB?: number;
  children: React.ReactNode;
}

export function BlockEditorProvider({
  uploadImage,
  onError = console.error,
  autoResize = true,
  maxSizeMB = 10,
  children,
}: BlockEditorProviderProps) {
  return (
    <BlockEditorContext.Provider value={{ uploadImage, onError, autoResize, maxSizeMB }}>
      {children}
    </BlockEditorContext.Provider>
  );
}

export function useBlockEditorContext(): BlockEditorContextValue {
  const ctx = useContext(BlockEditorContext);
  if (!ctx) {
    throw new Error("BlockEditorProvider is required. Wrap your editor with <BlockEditorProvider>.");
  }
  return ctx;
}
