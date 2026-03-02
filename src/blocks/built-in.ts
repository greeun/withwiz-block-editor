import type { BlockData, BlockDef } from "../types";

/* ═══ Create Empty Block ═══ */

function empty(type: string, id: number): BlockData {
  const b: BlockData = { type, id };
  switch (type) {
    case "lead": case "paragraph": b.text = ""; break;
    case "subheading": b.text = ""; break;
    case "subheading-label": b.en = ""; b.text = ""; break;
    case "divider": break;
    case "spacer": b.size = "medium"; break;
    case "img-full": b.src = ""; b.cap = ""; break;
    case "img-inline": b.src = ""; b.cap = ""; b.size = "full"; break;
    case "img-pair": b.src1 = ""; b.src2 = ""; b.cap = ""; break;
    case "gallery": b.src1 = ""; b.src2 = ""; b.src3 = ""; b.cap = ""; break;
    case "img-text": b.src = ""; b.name = ""; b.role = ""; b.bio = ""; break;
    case "quote": case "quote-large": b.text = ""; b.attr = ""; break;
    case "stats": b.items = [{ num: "", label: "" }, { num: "", label: "" }, { num: "", label: "" }]; break;
    case "infobox": b.label = ""; b.items = [{ k: "", v: "" }]; break;
    case "callout": b.title = ""; b.text = ""; break;
    case "numcards": b.items = [{ title: "", desc: "" }]; break;
    case "qa": b.q = ""; b.a = ""; break;
    case "press-list": b.items = [{ src: "", date: "", title: "", ex: "", link: "" }]; break;
    case "timeline": b.items = [{ date: "", title: "", desc: "" }]; break;
    case "video": b.url = ""; b.cap = ""; break;
    case "cta": b.text = ""; b.label = ""; b.url = ""; break;
  }
  return b;
}

/** Standalone factory for creating an empty block by type */
export function createEmptyBlock(type: string, id: number): BlockData {
  return empty(type, id);
}

/* ═══ Built-in Block Definitions (22 types) ═══ */

export const BUILT_IN_BLOCKS: BlockDef[] = [
  { type: "lead",             label: "리드 단락",      icon: "❡", desc: "기사 도입부. 핵심 내용을 요약하는 첫 문단", createEmpty: (id) => empty("lead", id) },
  { type: "paragraph",        label: "일반 단락",      icon: "¶", desc: "본문 텍스트", createEmpty: (id) => empty("paragraph", id) },
  { type: "subheading",       label: "소제목",         icon: "H", desc: "본문 중간에 넣는 구분 제목", createEmpty: (id) => empty("subheading", id) },
  { type: "subheading-label", label: "소제목+부제",    icon: "Hₑ", desc: "작은 부제가 위에 붙는 소제목", createEmpty: (id) => empty("subheading-label", id) },
  { type: "divider",          label: "구분선",         icon: "—", desc: "내용 사이 시각적 구분", createEmpty: (id) => empty("divider", id) },
  { type: "spacer",           label: "여백",           icon: "↕", desc: "내용 사이에 빈 공간 추가. 크기 조절 가능", createEmpty: (id) => empty("spacer", id) },
  { type: "img-full",         label: "이미지(전폭)",   icon: "▣", desc: "화면 너비 가득 채우는 큰 사진", createEmpty: (id) => empty("img-full", id) },
  { type: "img-inline",       label: "이미지(본문폭)", icon: "▢", desc: "본문 너비에 맞는 사진. 크기 조절 가능", createEmpty: (id) => empty("img-inline", id) },
  { type: "img-pair",         label: "이미지 2장",     icon: "▥", desc: "나란히 배치되는 사진 두 장", createEmpty: (id) => empty("img-pair", id) },
  { type: "gallery",          label: "갤러리 3장",     icon: "⊞", desc: "정사각형 사진 세 장 나란히", createEmpty: (id) => empty("gallery", id) },
  { type: "img-text",         label: "인물 소개",      icon: "☺", desc: "인물 사진 + 이름, 직함, 소개글", createEmpty: (id) => empty("img-text", id) },
  { type: "quote",            label: "인용문",         icon: "\"", desc: "인터뷰, 대사 등 강조할 말", createEmpty: (id) => empty("quote", id) },
  { type: "quote-large",      label: "인용문(대형)",   icon: "❝", desc: "페이지 중앙에 크게 표시되는 인용", createEmpty: (id) => empty("quote-large", id) },
  { type: "stats",            label: "숫자 하이라이트", icon: "#", desc: "강조할 숫자 (예: 공연 3회, 관객 1,200명)", createEmpty: (id) => empty("stats", id) },
  { type: "infobox",          label: "정보 박스",      icon: "☰", desc: "항목별 정보", createEmpty: (id) => empty("infobox", id) },
  { type: "callout",          label: "강조 박스",      icon: "!", desc: "독자에게 안내할 중요 사항", createEmpty: (id) => empty("callout", id) },
  { type: "numcards",         label: "넘버 카드",      icon: "①", desc: "01, 02, 03 순서로 정리하는 안내 카드", createEmpty: (id) => empty("numcards", id) },
  { type: "qa",               label: "Q&A",           icon: "Q", desc: "질문과 답변 형식의 인터뷰", createEmpty: (id) => empty("qa", id) },
  { type: "press-list",       label: "보도 목록",      icon: "✎", desc: "언론 보도 기사 목록 (매체명, 제목, 링크)", createEmpty: (id) => empty("press-list", id) },
  { type: "timeline",         label: "타임라인",       icon: "↓", desc: "시간 순서대로 정리하는 일정/과정", createEmpty: (id) => empty("timeline", id) },
  { type: "video",            label: "영상",           icon: "▶", desc: "YouTube 영상 삽입", createEmpty: (id) => empty("video", id) },
  { type: "cta",              label: "CTA 버튼",      icon: "→", desc: "행동 유도 버튼", createEmpty: (id) => empty("cta", id) },
];

/** Lookup helper: type → BlockDef */
export function getBlockDef(type: string): BlockDef | undefined {
  return BUILT_IN_BLOCKS.find((d) => d.type === type);
}
