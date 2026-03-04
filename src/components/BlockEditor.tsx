"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { BlockData, BlockDef, BlockEditorConfig } from "../types";
import { createSerializer } from "../core/serializer";
import { createHtmlRenderer } from "../core/html-renderer";
import { createEmptyBlock } from "../blocks/built-in";
import { BlockRenderer } from "./BlockRenderer";

/* ═══ Props ═══ */

interface SerializedMode {
  /** Serialized HTML+marker string from DB */
  content: string;
  /** Called with HTML+marker string */
  onChange: (html: string) => void;
}

interface RawMode {
  /** Block array (for parent-managed serialization) */
  blocks: BlockData[];
  /** Called with updated block array */
  onBlocksChange: (blocks: BlockData[]) => void;
}

type BlockEditorProps = (SerializedMode | RawMode) & {
  config: BlockEditorConfig;
  /** Current category (when enableCategoryFilter is true) */
  category?: string;
  /** Track uploaded image keys for orphan cleanup */
  onImageUploaded?: (key: string) => void;
  /** Template/sample load notification */
  onModeChange?: (mode: "template" | "sample") => void;
};

function isSerialized(props: BlockEditorProps): props is SerializedMode & BlockEditorProps {
  return "content" in props;
}

/* ═══ Component ═══ */

export function BlockEditor(props: BlockEditorProps) {
  const { config, category = "", onImageUploaded, onModeChange } = props;
  const { enableDragDrop = true, enableCategoryFilter = false } = config;

  const serializer = useRef(createSerializer<BlockData[]>(config.marker));
  const renderer = useRef(createHtmlRenderer(
    config.cssPrefix,
    config.catClasses?.[category],
  ));

  // Update renderer when category changes
  useEffect(() => {
    renderer.current = createHtmlRenderer(config.cssPrefix, config.catClasses?.[category]);
  }, [category, config.cssPrefix, config.catClasses]);

  /* --- State --- */
  const [blocks, setBlocksState] = useState<BlockData[]>(() => {
    if (isSerialized(props)) {
      const existing = serializer.current.deserialize(props.content);
      if (existing && existing.length > 0) return existing;
      // Load template if available
      const tpl = config.templates?.[category];
      if (tpl) return tpl.map((t, i) => ({ ...t, id: i }));
      return [];
    }
    return props.blocks;
  });

  const nextId = useRef(blocks.length > 0 ? Math.max(...blocks.map((b) => b.id)) + 1 : 0);
  const editorRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);
  const prevCategoryRef = useRef(category);

  // For serialized mode: onChange ref
  const onChangeRef = useRef<((html: string) => void) | null>(null);
  if (isSerialized(props)) {
    onChangeRef.current = props.onChange;
  }

  // For raw mode: onBlocksChange ref
  const onBlocksChangeRef = useRef<((blocks: BlockData[]) => void) | null>(null);
  if (!isSerialized(props)) {
    onBlocksChangeRef.current = props.onBlocksChange;
  }

  const blocksRef = useRef(blocks);
  blocksRef.current = blocks;

  // Wrapper to update both state and notify parent
  const setBlocks = useCallback((updater: BlockData[] | ((prev: BlockData[]) => BlockData[])) => {
    setBlocksState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      return next;
    });
  }, []);

  // Sync raw mode blocks from parent
  useEffect(() => {
    if (!isSerialized(props)) {
      const incoming = (props as RawMode).blocks;
      setBlocksState((prev) => (prev === incoming ? prev : incoming));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!isSerialized(props) && (props as RawMode).blocks]);

  /* --- Drag & Drop State --- */
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [dragOverId, setDragOverId] = useState<number | null>(null);
  const dragOverDir = useRef<"above" | "below">("below");

  /* --- Emit changes --- */
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (onChangeRef.current) {
      const html = renderer.current.renderBlocksWrapped(blocks);
      const data = serializer.current.serialize(blocks);
      onChangeRef.current(html + data);
    }
    if (onBlocksChangeRef.current) {
      onBlocksChangeRef.current(blocks);
    }
  }, [blocks, category]);

  /* --- Category change auto-load template --- */
  useEffect(() => {
    if (prevCategoryRef.current === category) return;
    prevCategoryRef.current = category;

    const currentBlocks = blocksRef.current;
    const hasContent = currentBlocks.some((b) => {
      if (b.text || b.en || b.src || b.src1 || b.src2 || b.src3) return true;
      if (b.name || b.bio || b.q || b.a || b.url) return true;
      if (b.items?.some((it) => Object.entries(it).some(([key, val]) => key !== "k" && val))) return true;
      return false;
    });

    if (!hasContent && config.templates?.[category]) {
      const id = nextId.current;
      const tpl = config.templates[category].map((t, i) => ({ ...t, id: id + i }));
      nextId.current = id + tpl.length;
      setBlocks(tpl);
    }
  }, [category, config.templates, setBlocks]);

  const hasBlockContent = useCallback(() => {
    return blocksRef.current.some((b) => {
      if (b.text || b.en || b.src || b.src1 || b.src2 || b.src3) return true;
      if (b.name || b.bio || b.q || b.a || b.url) return true;
      if (b.items?.some((it) => Object.values(it).some((val) => val))) return true;
      return false;
    });
  }, []);

  const loadTemplate = useCallback(() => {
    if (!config.templates?.[category]) return;
    if (hasBlockContent() && !confirm("현재 작성 중인 내용이 모두 초기화됩니다. 계속하시겠습니까?")) return;
    const id = nextId.current;
    const tpl = config.templates[category].map((t, i) => ({ ...t, id: id + i }));
    nextId.current = id + tpl.length;
    setBlocks(tpl);
    onModeChange?.("template");
  }, [category, config.templates, hasBlockContent, onModeChange, setBlocks]);

  const loadSample = useCallback(() => {
    if (!config.samples?.[category]) return;
    if (hasBlockContent() && !confirm("현재 작성 중인 내용이 모두 초기화됩니다. 계속하시겠습니까?")) return;
    const id = nextId.current;
    const smp = config.samples[category].map((t, i) => ({ ...t, id: id + i }));
    nextId.current = id + smp.length;
    setBlocks(smp);
    onModeChange?.("sample");
  }, [category, config.samples, hasBlockContent, onModeChange, setBlocks]);

  /* --- Block Operations --- */
  const addBlock = useCallback((type: string) => {
    const def = config.blocks.find((d) => d.type === type);
    const id = nextId.current++;
    const newBlock = def ? def.createEmpty(id) : createEmptyBlock(type, id);
    setBlocks((prev) => [...prev, newBlock]);
    setTimeout(() => {
      editorRef.current?.scrollTo({ top: editorRef.current.scrollHeight, behavior: "smooth" });
    }, 50);
  }, [config.blocks, setBlocks]);

  const removeBlock = useCallback((id: number) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  }, [setBlocks]);

  const moveBlock = useCallback((id: number, dir: number) => {
    setBlocks((prev) => {
      const i = prev.findIndex((b) => b.id === id);
      const ni = i + dir;
      if (ni < 0 || ni >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[ni]] = [next[ni], next[i]];
      return next;
    });
  }, [setBlocks]);

  const updateBlock = useCallback((id: number, field: string, value: string) => {
    setBlocks((prev) =>
      prev.map((b) => {
        if (b.id !== id) return b;
        const parts = field.split(".");
        if (parts.length === 3 && parts[0] === "items") {
          const idx = parseInt(parts[1]);
          const key = parts[2];
          const items = [...(b.items || [])];
          items[idx] = { ...items[idx], [key]: value };
          return { ...b, items };
        }
        return { ...b, [field]: value };
      }),
    );
  }, [setBlocks]);

  const addSubItem = useCallback((id: number, type: string) => {
    setBlocks((prev) =>
      prev.map((b) => {
        if (b.id !== id) return b;
        const items = [...(b.items || [])];
        switch (type) {
          case "stats": items.push({ num: "", label: "" }); break;
          case "infobox": items.push({ k: "", v: "" }); break;
          case "numcards": items.push({ title: "", desc: "" }); break;
          case "press-list": items.push({ src: "", date: "", title: "", ex: "", link: "" }); break;
          case "timeline": items.push({ date: "", title: "", desc: "" }); break;
        }
        return { ...b, items };
      }),
    );
  }, [setBlocks]);

  const removeSubItem = useCallback((id: number, idx: number) => {
    setBlocks((prev) =>
      prev.map((b) => {
        if (b.id !== id) return b;
        const items = [...(b.items || [])];
        items.splice(idx, 1);
        return { ...b, items };
      }),
    );
  }, [setBlocks]);

  /* --- Drag & Drop Handlers --- */
  const handleDragStart = useCallback((e: React.DragEvent, id: number) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(id));
    const el = (e.target as HTMLElement).closest(".be-block") as HTMLElement;
    if (el) requestAnimationFrame(() => { el.style.opacity = "0.4"; });
  }, []);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    const el = (e.target as HTMLElement).closest(".be-block") as HTMLElement;
    if (el) el.style.opacity = "";
    setDraggedId(null);
    setDragOverId(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, id: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (id === draggedId) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    dragOverDir.current = e.clientY < midY ? "above" : "below";
    setDragOverId(id);
  }, [draggedId]);

  const handleDrop = useCallback((e: React.DragEvent, targetId: number) => {
    e.preventDefault();
    if (draggedId === null || draggedId === targetId) return;
    setBlocks((prev) => {
      const fromIdx = prev.findIndex((b) => b.id === draggedId);
      const toIdx = prev.findIndex((b) => b.id === targetId);
      if (fromIdx === -1 || toIdx === -1) return prev;
      const next = [...prev];
      const [moved] = next.splice(fromIdx, 1);
      const insertIdx = dragOverDir.current === "above"
        ? toIdx > fromIdx ? toIdx - 1 : toIdx
        : toIdx > fromIdx ? toIdx : toIdx + 1;
      next.splice(insertIdx, 0, moved);
      return next;
    });
    setDraggedId(null);
    setDragOverId(null);
  }, [draggedId, setBlocks]);

  /* --- Available Blocks --- */
  const availableBlocks: BlockDef[] = enableCategoryFilter && category
    ? config.blocks.filter((def) => !def.cats || def.cats.includes(category))
    : config.blocks;

  // Block label lookup
  const blockLabel = (type: string): string => {
    return config.blocks.find((d) => d.type === type)?.label || type;
  };

  const hasTemplates = !!(config.templates && config.templates[category]);
  const hasSamples = !!(config.samples && config.samples[category]);

  /* --- Render --- */
  return (
    <div className="be-blocks-section" ref={editorRef}>
      {(hasTemplates || hasSamples) && (
        <div className="be-mode-bar">
          <span className="be-mode-label">초기화</span>
          {hasTemplates && <button className="be-mode-btn" onClick={loadTemplate}>빈 템플릿</button>}
          {hasSamples && <button className="be-mode-btn" onClick={loadSample}>예시 콘텐츠</button>}
          {enableCategoryFilter && (
            <span className="be-mode-hint">카테고리별 블록 구성이 자동 적용됩니다</span>
          )}
        </div>
      )}
      <div className="be-blocks">
        {blocks.map((block) => (
          <div
            key={block.id}
            className={`be-block${draggedId === block.id ? " be-dragging" : ""}${dragOverId === block.id && draggedId !== block.id ? ` be-drag-over be-drag-${dragOverDir.current}` : ""}`}
            draggable={enableDragDrop}
            onDragStart={enableDragDrop ? (e) => handleDragStart(e, block.id) : undefined}
            onDragEnd={enableDragDrop ? handleDragEnd : undefined}
            onDragOver={enableDragDrop ? (e) => handleDragOver(e, block.id) : undefined}
            onDrop={enableDragDrop ? (e) => handleDrop(e, block.id) : undefined}
          >
            <div className="be-block-header">
              <div className="be-block-type">
                {enableDragDrop && <span className="be-block-drag">&#x283F;</span>}
                {blockLabel(block.type)}
              </div>
              <div className="be-block-actions">
                <button className="be-block-btn" onClick={() => moveBlock(block.id, -1)}>&#8593;</button>
                <button className="be-block-btn" onClick={() => moveBlock(block.id, 1)}>&#8595;</button>
                <button className="be-block-btn be-block-btn-del" onClick={() => removeBlock(block.id)}>&times;</button>
              </div>
            </div>
            <div className="be-block-body">
              <BlockRenderer
                block={block}
                updateBlock={updateBlock}
                addSubItem={addSubItem}
                removeSubItem={removeSubItem}
                onImageUploaded={onImageUploaded}
              />
            </div>
          </div>
        ))}
      </div>
      {blocks.length === 0 && (
        <div className="be-empty">
          아래 버튼으로 콘텐츠 블록을 추가하세요
        </div>
      )}
      <div className="be-add-bar">
        {availableBlocks.map((def) => (
          <button key={def.type} className="be-add-btn" title={def.desc} onClick={() => addBlock(def.type)}>
            {def.icon} {def.label}
          </button>
        ))}
      </div>
    </div>
  );
}
