"use client";

import type { BlockData } from "../types";
import { ImageUploadField } from "./ImageUploadField";

interface BlockRendererProps {
  block: BlockData;
  updateBlock: (id: number, field: string, value: string) => void;
  addSubItem: (id: number, type: string) => void;
  removeSubItem: (id: number, idx: number) => void;
  onImageUploaded?: (key: string) => void;
}

export function BlockRenderer({ block, updateBlock, addSubItem, removeSubItem, onImageUploaded }: BlockRendererProps) {
  const { id, type } = block;

  /* -- Render Helpers -- */
  const inp = (field: string, placeholder: string, style?: React.CSSProperties) => (
    <input
      className="be-input"
      value={(block as unknown as Record<string, string>)[field] || ""}
      onChange={(e) => updateBlock(id, field, e.target.value)}
      placeholder={placeholder}
      style={style}
    />
  );

  const ta = (field: string, placeholder: string, style?: React.CSSProperties) => (
    <textarea
      className="be-textarea"
      value={(block as unknown as Record<string, string>)[field] || ""}
      onChange={(e) => updateBlock(id, field, e.target.value)}
      placeholder={placeholder}
      style={style}
    />
  );

  const iInp = (index: number, field: string, placeholder: string, style?: React.CSSProperties) => (
    <input
      className="be-input"
      value={block.items?.[index]?.[field] || ""}
      onChange={(e) => updateBlock(id, `items.${index}.${field}`, e.target.value)}
      placeholder={placeholder}
      style={style}
    />
  );

  const iTa = (index: number, field: string, placeholder: string, style?: React.CSSProperties) => (
    <textarea
      className="be-textarea"
      value={block.items?.[index]?.[field] || ""}
      onChange={(e) => updateBlock(id, `items.${index}.${field}`, e.target.value)}
      placeholder={placeholder}
      style={style}
    />
  );

  const imgUp = (field: string, className?: string) => {
    const src = (block as unknown as Record<string, string>)[field] || "";
    return (
      <ImageUploadField
        blockId={id}
        field={field}
        src={src}
        className={className}
        onUploadComplete={(bid, f, url) => updateBlock(bid, f, url)}
        onKeyTracked={onImageUploaded}
        onClear={(bid, f) => updateBlock(bid, f, "")}
      />
    );
  };

  /* -- Block Type Switch -- */
  switch (type) {
    case "lead":
      return ta("text", "기사의 첫 문단입니다. 핵심 내용을 1~2문장으로 요약해 주세요.", { fontStyle: block.text ? "normal" : "italic" });

    case "paragraph":
      return ta("text", "본문 내용을 입력하세요.");

    case "subheading":
      return inp("text", "본문을 나누는 중간 제목");

    case "subheading-label":
      return (
        <>
          {inp("en", "위에 작게 표시될 부제 (예: Behind the Scene)", { fontSize: 11, marginBottom: 4 })}
          {inp("text", "소제목")}
        </>
      );

    case "divider":
      return <div style={{ height: 1, background: "var(--be-border, #ddd)", margin: "4px 0" }} />;

    case "spacer":
      return (
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span style={{ fontSize: 11, color: "var(--be-text-dim, #999)" }}>여백 크기</span>
          <select
            className="be-input"
            value={block.size || "medium"}
            onChange={(e) => updateBlock(id, "size", e.target.value)}
            style={{ width: "auto", padding: "4px 8px", fontSize: 11 }}
          >
            <option value="small">작게 (16px)</option>
            <option value="medium">보통 (32px)</option>
            <option value="large">크게 (56px)</option>
          </select>
        </div>
      );

    case "img-full":
      return (
        <>
          {imgUp("src")}
          {inp("cap", "캡션 (선택)", { fontSize: 11 })}
        </>
      );

    case "img-inline":
      return (
        <>
          <div style={{ display: "flex", gap: 6, marginBottom: 6, alignItems: "center" }}>
            <span style={{ fontSize: 10, color: "var(--be-text-dim, #999)" }}>사이즈</span>
            <select
              className="be-input"
              value={block.size || "full"}
              onChange={(e) => updateBlock(id, "size", e.target.value)}
              style={{ width: "auto", padding: "4px 8px", fontSize: 10 }}
            >
              <option value="full">전체 (100%)</option>
              <option value="medium">중간 (70%)</option>
              <option value="small">작게 (50%)</option>
            </select>
          </div>
          {imgUp("src")}
          {inp("cap", "캡션 (선택)", { fontSize: 11 })}
        </>
      );

    case "img-pair":
      return (
        <>
          <div className="be-img-pair-grid">
            {imgUp("src1", "small")}
            {imgUp("src2", "small")}
          </div>
          {inp("cap", "캡션 (선택)", { fontSize: 11 })}
        </>
      );

    case "gallery":
      return (
        <>
          <div className="be-img-gallery-grid">
            {imgUp("src1", "square")}
            {imgUp("src2", "square")}
            {imgUp("src3", "square")}
          </div>
          {inp("cap", "캡션 (선택)", { fontSize: 11 })}
        </>
      );

    case "img-text":
      return (
        <>
          {imgUp("src", "portrait")}
          {inp("name", "이름", { fontSize: 11, marginBottom: 3 })}
          {inp("role", "직함", { fontSize: 11, marginBottom: 3 })}
          {ta("bio", "소개", { minHeight: 40 })}
        </>
      );

    case "quote":
      return (
        <div className="be-quote-area">
          {ta("text", "강조하고 싶은 말, 인터뷰 내용 등", { minHeight: 40 })}
          {inp("attr", "출처 (예: — 지우영 예술감독)", { fontSize: 11, marginTop: 4 })}
        </div>
      );

    case "quote-large":
      return (
        <>
          {ta("text", "페이지 중앙에 크게 표시됩니다. 가장 인상적인 한마디를 넣어주세요.", { minHeight: 40, textAlign: "center" })}
          {inp("attr", "출처", { fontSize: 11, marginTop: 4, textAlign: "center" })}
        </>
      );

    case "stats":
      return (
        <>
          {block.items?.map((_, i) => (
            <div key={i} className="be-stats-row">
              <input className="be-kv-key" value={block.items?.[i]?.num || ""} onChange={(e) => updateBlock(id, `items.${i}.num`, e.target.value)} placeholder="숫자" />
              <input className="be-kv-value" value={block.items?.[i]?.label || ""} onChange={(e) => updateBlock(id, `items.${i}.label`, e.target.value)} placeholder="라벨" />
              <button className="be-kv-delete" onClick={() => removeSubItem(id, i)}>&times;</button>
            </div>
          ))}
          <button className="be-add-row-btn" onClick={() => addSubItem(id, "stats")}>+ 항목 추가</button>
        </>
      );

    case "infobox":
      return (
        <>
          {inp("label", "박스 라벨", { fontSize: 10, letterSpacing: 1, marginBottom: 6 })}
          {block.items?.map((_, i) => (
            <div key={i} className="be-kv-row">
              <input className="be-kv-key" value={block.items?.[i]?.k || ""} onChange={(e) => updateBlock(id, `items.${i}.k`, e.target.value)} placeholder="항목명" />
              <input className="be-kv-value" value={block.items?.[i]?.v || ""} onChange={(e) => updateBlock(id, `items.${i}.v`, e.target.value)} placeholder="내용" />
              <button className="be-kv-delete" onClick={() => removeSubItem(id, i)}>&times;</button>
            </div>
          ))}
          <button className="be-add-row-btn" onClick={() => addSubItem(id, "infobox")}>+ 항목 추가</button>
        </>
      );

    case "callout":
      return (
        <>
          {inp("title", "제목 (선택)", { fontSize: 11, marginBottom: 4 })}
          {ta("text", "강조 내용...")}
        </>
      );

    case "numcards":
      return (
        <>
          {block.items?.map((_, i) => (
            <div key={i} className="be-subitem-card">
              <div className="be-subitem-header">
                <span className="be-subitem-label">카드 {String(i + 1).padStart(2, "0")}</span>
                <button className="be-kv-delete" onClick={() => removeSubItem(id, i)}>&times;</button>
              </div>
              {iInp(i, "title", "제목", { fontSize: 11, margin: "4px 0 3px" })}
              {iTa(i, "desc", "설명", { minHeight: 36 })}
            </div>
          ))}
          <button className="be-add-row-btn" onClick={() => addSubItem(id, "numcards")}>+ 카드 추가</button>
        </>
      );

    case "qa":
      return (
        <div className="be-quote-area">
          {inp("q", "질문", { fontSize: 12, marginBottom: 4 })}
          {ta("a", "답변")}
        </div>
      );

    case "press-list":
      return (
        <>
          {block.items?.map((_, i) => (
            <div key={i} className="be-subitem-card">
              <div className="be-subitem-header">
                <span className="be-subitem-label">보도 {i + 1}</span>
                <button className="be-kv-delete" onClick={() => removeSubItem(id, i)}>&times;</button>
              </div>
              <div className="be-subitem-2col">
                {iInp(i, "src", "매체명", { fontSize: 10 })}
                {iInp(i, "date", "보도일", { fontSize: 10 })}
              </div>
              {iInp(i, "title", "기사 제목", { fontSize: 11, marginBottom: 3 })}
              {iInp(i, "ex", "요약", { fontSize: 10, marginBottom: 3 })}
              {iInp(i, "link", "원문 URL", { fontSize: 10 })}
            </div>
          ))}
          <button className="be-add-row-btn" onClick={() => addSubItem(id, "press-list")}>+ 보도 추가</button>
        </>
      );

    case "timeline":
      return (
        <>
          {block.items?.map((_, i) => (
            <div key={i} className="be-timeline-card">
              <div className="be-subitem-header">
                <span className="be-subitem-label">Step {i + 1}</span>
                <button className="be-kv-delete" onClick={() => removeSubItem(id, i)}>&times;</button>
              </div>
              {iInp(i, "date", "날짜/시기", { fontSize: 10, margin: "4px 0 3px" })}
              {iInp(i, "title", "제목", { fontSize: 11, marginBottom: 3 })}
              {iInp(i, "desc", "설명 (선택)", { fontSize: 10 })}
            </div>
          ))}
          <button className="be-add-row-btn" onClick={() => addSubItem(id, "timeline")}>+ 단계 추가</button>
        </>
      );

    case "video":
      return (
        <>
          {inp("url", "YouTube URL (예: https://www.youtube.com/embed/...)", { fontSize: 11, marginBottom: 4 })}
          {inp("cap", "캡션 (선택)", { fontSize: 11 })}
        </>
      );

    case "cta":
      return (
        <>
          {ta("text", "행동을 유도하는 메시지", { minHeight: 36 })}
          <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
            {inp("label", "버튼 텍스트", { fontSize: 11, flex: 1 })}
            {inp("url", "버튼 링크 URL", { fontSize: 11, flex: 2 })}
          </div>
        </>
      );

    default:
      return null;
  }
}
