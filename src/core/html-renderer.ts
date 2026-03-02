import type { BlockData } from "../types";

/* === HTML Helpers === */

export function h(s: string): string {
  return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function nl2br(s: string): string {
  return h(s).replace(/\n/g, "<br>");
}

/* === Renderer Factory === */

/**
 * Creates an HTML renderer with the given CSS class prefix.
 * @param prefix - CSS class prefix (e.g. "nbe-pvb", "rm-bk")
 * @param catClass - optional category CSS class for themed blocks (e.g. "onstage")
 */
export function createHtmlRenderer(prefix: string, catClass?: string) {
  const p = prefix;
  const cc = catClass || "";

  function renderBlock(b: BlockData): string {
    switch (b.type) {
      case "lead":
        return b.text ? `<div class="${p}-lead">${nl2br(b.text)}</div>` : "";
      case "paragraph":
        return b.text ? `<p class="${p}-p">${nl2br(b.text)}</p>` : "";
      case "subheading":
        return b.text ? `<div class="${p}-sh">${h(b.text)}</div>` : "";
      case "subheading-label":
        if (b.en) {
          return `<div class="${p}-sh-en">${h(b.en)}</div>${b.text ? `<div class="${p}-sh">${h(b.text)}</div>` : ""}`;
        }
        return b.text ? `<div class="${p}-sh">${h(b.text)}</div>` : "";
      case "divider":
        return `<div class="${p}-hr"></div>`;
      case "spacer": {
        const sh = b.size === "small" ? 16 : b.size === "large" ? 56 : 32;
        return `<div style="height:${sh}px"></div>`;
      }
      case "img-full":
        return b.src
          ? `<div class="${p}-imgf"><img src="${b.src}" alt="">${b.cap ? `<div class="${p}-cap">${h(b.cap)}</div>` : ""}</div>`
          : "";
      case "img-inline":
        if (!b.src) return "";
        { const w = b.size === "small" ? "50%" : b.size === "medium" ? "70%" : "100%";
          return `<div class="${p}-imgi" style="width:${w}"><img src="${b.src}" alt="">${b.cap ? `<div class="${p}-cap">${h(b.cap)}</div>` : ""}</div>`; }
      case "img-pair":
        return (b.src1 || b.src2)
          ? `<div class="${p}-pair">${b.src1 ? `<img src="${b.src1}" alt="">` : ""}${b.src2 ? `<img src="${b.src2}" alt="">` : ""}${b.cap ? `<div class="${p}-cap">${h(b.cap)}</div>` : ""}</div>`
          : "";
      case "gallery":
        return `<div class="${p}-gal">${b.src1 ? `<img src="${b.src1}" alt="">` : ""}${b.src2 ? `<img src="${b.src2}" alt="">` : ""}${b.src3 ? `<img src="${b.src3}" alt="">` : ""}${b.cap ? `<div class="${p}-cap">${h(b.cap)}</div>` : ""}</div>`;
      case "img-text":
        return (b.src || b.name)
          ? `<div class="${p}-prof">${b.src ? `<img src="${b.src}" alt="">` : ""}<div>${b.name ? `<div class="${p}-nm">${h(b.name)}</div>` : ""}${b.role ? `<div class="${p}-rl">${h(b.role)}</div>` : ""}${b.bio ? `<div class="${p}-bio">${nl2br(b.bio)}</div>` : ""}</div></div>`
          : "";
      case "quote":
        return b.text
          ? `<div class="${p}-q"><p>${nl2br(b.text)}</p>${b.attr ? `<div class="${p}-at">${h(b.attr)}</div>` : ""}</div>`
          : "";
      case "quote-large":
        return b.text
          ? `<div class="${p}-ql"><div class="${p}-mk">&ldquo;</div><p>${nl2br(b.text)}</p>${b.attr ? `<div class="${p}-at">${h(b.attr)}</div>` : ""}</div>`
          : "";
      case "stats":
        if (!b.items?.length) return "";
        return `<div class="${p}-stats">${b.items.map((it) => `<div class="${p}-stat"><div class="${p}-n">${h(it.num || "\u2014")}</div><div class="${p}-l">${h(it.label || "")}</div></div>`).join("")}</div>`;
      case "infobox":
        { let out = `<div class="${p}-ib"><div class="${p}-lbl${cc ? ` ${cc}` : ""}">${h(b.label || "Info")}</div>`;
          if (b.items) for (const it of b.items) { if (it.k || it.v) out += `<strong>${h(it.k)}</strong> &middot; ${h(it.v)}<br>`; }
          return out + `</div>`; }
      case "callout":
        return b.text
          ? `<div class="${p}-co">${b.title ? `<div class="${p}-ct">${h(b.title)}</div>` : ""}<p>${nl2br(b.text)}</p></div>`
          : "";
      case "numcards":
        if (!b.items?.length) return "";
        return `<div class="${p}-nc">${b.items.map((it, i) => `<div class="${p}-nci"><div class="${p}-num">${String(i + 1).padStart(2, "0")}</div>${it.title ? `<h3>${h(it.title)}</h3>` : ""}${it.desc ? `<p>${h(it.desc)}</p>` : ""}</div>`).join("")}</div>`;
      case "qa":
        return (b.q || b.a)
          ? `<div class="${p}-qa"><div class="${p}-qai">${b.q ? `<div class="${p}-qaq">${h(b.q)}</div>` : ""}${b.a ? `<p class="${p}-qaa">${nl2br(b.a)}</p>` : ""}</div></div>`
          : "";
      case "press-list":
        if (!b.items?.length) return "";
        { let out = `<div class="${p}-pl">`;
          for (const it of b.items) {
            if (!it.src && !it.title) continue;
            out += `<div class="${p}-pli"><div class="${p}-src">${h(it.src)}<span class="${p}-pd">${h(it.date)}</span></div><div><div class="${p}-ptt">${h(it.title)}</div><div class="${p}-pex">${h(it.ex)}</div>${it.link ? `<a class="${p}-plk" href="${h(it.link)}" target="_blank" rel="noopener noreferrer">원문 보기 &rarr;</a>` : ""}</div></div>`;
          }
          return out + `</div>`; }
      case "timeline":
        if (!b.items?.length) return "";
        return `<div class="${p}-tl">${b.items.map((it) => `<div class="${p}-tli">${it.date ? `<div class="${p}-td">${h(it.date)}</div>` : ""}${it.title ? `<div class="${p}-tt">${h(it.title)}</div>` : ""}${it.desc ? `<p>${h(it.desc)}</p>` : ""}</div>`).join("")}</div>`;
      case "video":
        return b.url
          ? `<div class="${p}-vid"><div class="${p}-vw"><iframe src="${b.url}" allowfullscreen></iframe></div>${b.cap ? `<div class="${p}-cap">${h(b.cap)}</div>` : ""}</div>`
          : "";
      case "cta":
        return (b.text || b.label)
          ? `<div class="${p}-cta${cc ? ` ${cc}` : ""}"><p>${h(b.text || "")}</p>${b.label ? `<a class="${p}-cta-btn" href="${b.url || "#"}">${h(b.label)}</a>` : ""}</div>`
          : "";
      default:
        return "";
    }
  }

  function renderBlocks(blocks: BlockData[]): string {
    return blocks.map(renderBlock).filter(Boolean).join("\n");
  }

  function renderBlocksWrapped(blocks: BlockData[]): string {
    return `<div class="${p}-body">${renderBlocks(blocks)}</div>`;
  }

  return { renderBlock, renderBlocks, renderBlocksWrapped };
}
