# Product Requirements Document: @withwiz/block-editor

## 1. Executive Summary

**Product Name:** @withwiz/block-editor  
**Version:** 0.1.0  
**Status:** Active Development  
**Target Users:** Web publishers, content platforms, editorial teams  
**Platform:** React 18+ component library (browser-based)

@withwiz/block-editor is a professional block-based content editor for web publishing. It provides a flexible, extensible React component library with 22 built-in content blocks, supporting both serialized (HTML-based) and raw (array-based) content models. The editor is designed for seamless integration into publishing platforms, CMS systems, and content management applications.

---

## 2. Problem Statement

### Current Market Gaps

1. **Lack of lightweight, flexible block editors:** Existing solutions (Gutenberg, Slate) are either monolithic or require extensive customization
2. **Integration complexity:** Most editors are tightly coupled with specific data formats or frameworks
3. **Limited visual variety:** Standard WYSIWYG editors lack specialized blocks for modern publishing (timelines, galleries, stats, Q&A)
4. **Publishing platform constraints:** Content platforms need granular control over serialization and data storage

### User Pain Points

- **Content creators:** Need intuitive, drag-and-drop interface with rich block options
- **Developers:** Want easy integration without learning proprietary frameworks
- **Publishers:** Require flexible content models that work with different backends
- **Platform architects:** Need performant, tree-shakeable components for bundle size control

---

## 3. Product Goals & Vision

### Primary Goals

1. **Provide a flexible block editor framework** for React applications
2. **Support multiple content models** (serialized HTML or raw block arrays)
3. **Enable seamless integration** into existing publishing platforms
4. **Maintain lightweight footprint** through ESM and subpath exports
5. **Support visual content richness** with 22+ built-in block types
6. **Ensure extensibility** for custom block types without source modifications

### Strategic Vision

Become the **go-to React component library** for content editors in publishing platforms, enabling teams to build custom, branded editors without building from scratch.

---

## 4. Target Audience & Use Cases

### Primary Users

| User Type | Use Case | Priority |
|-----------|----------|----------|
| **Content Creators** | Write, edit, and publish articles with rich formatting | P0 |
| **Editorial Teams** | Manage multi-author content workflow with consistent styling | P0 |
| **Platform Developers** | Integrate editor into publishing/CMS systems | P0 |
| **Component Consumers** | Use BlockRenderer for read-only content display | P1 |
| **Artist/Bio Editors** | Manage artist profiles with photos and galleries | P1 |

### Supported Platforms

- Web-based publishing platforms
- CMS (Content Management Systems)
- Blog engines
- News websites
- Media/entertainment publishing
- Artist portfolio sites

---

## 5. Core Features & Block Types

### 5.1 Editor Components

| Component | Purpose | Status |
|-----------|---------|--------|
| **BlockEditor** | Main editor component (serialized or raw mode) | ✅ Complete |
| **BlockRenderer** | Read-only renderer for preview/published content | ✅ Complete |
| **BlockEditorProvider** | Context provider for upload functions & error handling | ✅ Complete |
| **ArtistEditor** | Specialized editor for artist bios with gallery | ✅ Complete |
| **ImageUploadField** | Image upload UI with drag-drop support | ✅ Complete |

### 5.2 Built-in Block Types (22 Total)

#### Text Blocks
- **Lead Paragraph** – Opening summary paragraph
- **Paragraph** – Standard body text
- **Subheading** – Section divider
- **Subheading + Label** – Subheading with small label

#### Structural Blocks
- **Divider** – Visual separator
- **Spacer** – Adjustable blank space

#### Image Blocks
- **Full-width Image** – Spans page width
- **Inline Image** – Resizable within body width
- **Image Pair** – Two images side-by-side
- **Gallery (3)** – Three square images in row

#### Content Blocks
- **Person Intro** – Profile photo + name/role/bio
- **Quote** – Interview/speech highlight
- **Large Quote** – Centered oversized pull quote
- **Q&A** – Interview-style Q&A blocks
- **Info Box** – Key-value information table
- **Press List** – Media coverage (outlet, date, title, link)

#### Data Visualization Blocks
- **Number Highlight** – Key figures (e.g., attendance, metrics)
- **Numbered Cards** – Sequential guide (01, 02, 03…)
- **Timeline** – Chronological event sequence

#### Interactive Blocks
- **Callout** – Important reader notice
- **Video** – Embedded YouTube videos
- **CTA Button** – Call-to-action button

### 5.3 Core Features

#### Editor Features
- ✅ **Drag-and-drop reordering** of blocks
- ✅ **Category-based filtering** for block selection
- ✅ **Real-time preview** (BlockRenderer integration)
- ✅ **Two operation modes:**
  - Serialized: HTML string with markers (database-friendly)
  - Raw: Block array format (custom serialization)
- ✅ **Image upload** with client-side resize
- ✅ **Error handling** via context provider
- ✅ **Keyboard accessibility** and semantic HTML

#### Content Model Features
- ✅ **Flexible serialization** – HTML + marker-based format
- ✅ **Round-trip conversion** – Block array ↔ HTML string
- ✅ **Backward compatibility** – Parse existing content
- ✅ **Custom CSS prefixes** – Brand-specific styling

#### Developer Experience
- ✅ **TypeScript support** – Full type definitions
- ✅ **Subpath exports** – Tree-shakeable imports
- ✅ **ESM only** – Modern JavaScript module format
- ✅ **React hooks** – useImageDropZone for custom integration
- ✅ **Extensible blocks** – Custom BlockDef objects
- ✅ **No external dependencies** – React peer dependency only

---

## 6. Content Model & Data Structure

### 6.1 Block Data Format

```typescript
interface BlockData {
  id: string;           // Unique block identifier
  type: string;         // Block type (e.g., "paragraph", "image", "quote")
  [key: string]: any;   // Block-specific properties (text, image URL, etc.)
}
```

### 6.2 Serialization Strategy

**Serialized Format (HTML + Marker):**
```html
<div>nbe-blocks:START</div>
<!-- Block 1: Paragraph -->
<div class="nbe-pvb-paragraph"><p>Content...</p></div>
<!-- Block 2: Image -->
<div class="nbe-pvb-img-full"><img src="..." /></div>
<div>nbe-blocks:END</div>
```

**Advantages:**
- Database-friendly (single string field)
- Human-readable for debugging
- Compatible with HTML editors
- Preserves custom styling

**Raw Format (Block Array):**
```json
[
  { "id": "1", "type": "paragraph", "text": "Content..." },
  { "id": "2", "type": "img-full", "src": "...", "alt": "..." }
]
```

**Advantages:**
- Structured data for APIs
- Custom serialization logic
- Real-time sync protocols
- Better for versioning

### 6.3 Image Handling

- **Client-side resize:** Images resized before upload
- **Upload function signature:** `(file: File) => Promise<{ url: string; key: string }>`
- **Key tracking:** Keys stored in editor state for analytics
- **Validation:** File type and size checking
- **Drag-drop support:** useImageDropZone hook

---

## 7. Technical Specifications

### 7.1 Technology Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Language** | TypeScript 5+ | Type safety for large codebase |
| **Framework** | React 18+ | Peer dependency, modern hooks |
| **Build Tool** | tsup | Fast ESM bundler, tree-shaking support |
| **Type Generation** | tsc | Official TypeScript compiler |
| **Testing** | Vitest | Fast unit tests, jsdom environment |
| **CSS** | Plain CSS | No build-time dependencies, easy to override |
| **Target Runtime** | ESM (browser) | Modern browsers only (ES2017+) |

### 7.2 Build Output

```
dist/
├── index.js                          # Main entry point
├── types.js                          # Type definitions export
├── blocks/built-in.js               # Built-in block definitions
├── components/
│   ├── BlockEditor.js
│   ├── BlockRenderer.js
│   ├── ImageUploadField.js
│   └── ArtistEditor.js
├── context/BlockEditorProvider.js   # Context provider
├── core/
│   ├── serializer.js                # HTML ↔ block conversion
│   ├── html-renderer.js             # Block → HTML rendering
│   └── image-resize.js              # Image utilities
└── hooks/useImageDropZone.js        # Drag-drop hook

styles/
├── editor.css                        # Editor UI styles
├── preview.css                       # Published content styles
└── artist.css                        # Artist editor styles
```

### 7.3 Bundle Size Goals

- **Core library:** < 50KB (gzipped)
- **With all styles:** < 70KB (gzipped)
- **Individual exports:** Importable in ~2KB chunks
- **Tree-shaking:** Unused blocks excluded from final bundle

### 7.4 Performance Requirements

| Metric | Target | Notes |
|--------|--------|-------|
| **Block render time** | < 50ms | 100 blocks |
| **Serialization** | < 100ms | Large documents (1000+ blocks) |
| **Image resize** | < 1s | Standard photos (max 5MB) |
| **Drag-drop response** | < 16ms | 60fps reordering |

---

## 8. Functional Requirements by Component

### 8.1 BlockEditor Component

**Input:**
- `config: BlockEditorConfig` – Block definitions, markers, CSS prefix
- `content: string` (serialized mode) OR `blocks: BlockData[]` (raw mode)
- `uploadFn: (file: File) => Promise<{url, key}>` (via context)

**Output:**
- `onChange: (html: string) => void` (serialized mode)
- `onBlocksChange: (blocks: BlockData[]) => void` (raw mode)

**Capabilities:**
- Render list of editable blocks
- Add/delete/reorder blocks
- Persist state (serialized or raw)
- Handle image uploads
- Support category filtering
- Trigger callbacks on changes

### 8.2 BlockRenderer Component

**Input:**
- `blocks: BlockData[]` – Block array to render
- `config: BlockEditorConfig` – For CSS prefix and styling

**Output:**
- Read-only HTML output
- Preserves visual styling from preview.css

**Capabilities:**
- Render blocks to static HTML
- Apply CSS classes for custom styling
- Support server-side rendering
- No interactive editing

### 8.3 BlockEditorProvider

**Responsibilities:**
- Provide `uploadFn` to child components
- Handle `onError` callbacks
- Manage image upload state
- Prevent prop drilling

**Context Shape:**
```typescript
{
  uploadFn: (file: File) => Promise<{url: string; key: string}>;
  onError?: (message: string) => void;
}
```

### 8.4 ArtistEditor

**Features:**
- Main image upload/crop
- Gallery image management (add/remove/reorder)
- Artist metadata (name, bio, links)
- Integrated image upload
- Responsive layout

---

## 9. Non-Functional Requirements

### 9.1 Security

- ✅ **XSS Prevention:** HTML sanitization in renderer
- ✅ **Input validation:** File type/size checks for uploads
- ✅ **No eval/innerHTML:** Safe DOM manipulation
- ✅ **Content Security Policy compatible**

### 9.2 Accessibility

- ✅ **Semantic HTML:** Proper heading hierarchy, landmarks
- ✅ **ARIA labels:** For image inputs, buttons, modals
- ✅ **Keyboard navigation:** Tab, arrow keys, Enter for actions
- ✅ **Screen reader support:** Descriptive alt text
- ✅ **Color contrast:** WCAG AA compliant

### 9.3 Browser Support

- **Target:** Modern browsers (2023+)
- **Minimum:** ES2017 support
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

### 9.4 Performance & Optimization

- ✅ **Code splitting:** Subpath exports for granular imports
- ✅ **No external dependencies:** Minimal bundle impact
- ✅ **Lazy rendering:** React virtual lists for large documents
- ✅ **Memoization:** Prevent unnecessary re-renders
- ✅ **Image optimization:** Client-side resize before upload

### 9.5 Testability

- ✅ **Unit test coverage:** 85%+ lines/functions, 80%+ branches
- ✅ **Integration tests:** Editor ↔ renderer flows
- ✅ **Security tests:** XSS, injection attacks
- ✅ **Performance tests:** Bundle size, render time
- ✅ **Test organization:** Mirrors src/ structure

---

## 10. Integration Points

### 10.1 Consumer Applications

**Required:**
1. React 18+ application
2. Image upload endpoint
3. Error handling callback

**Optional:**
1. Custom block types
2. Custom CSS styling
3. Category filtering
4. Content preview

### 10.2 Content Storage

**Serialized Mode:**
- Store HTML string in database TEXT field
- Retrieve and pass to BlockEditor
- Rendered blocks automatically deserialized

**Raw Mode:**
- Store block array as JSON
- Custom serialization to database format
- Full control over persistence

### 10.3 Image Upload Workflow

1. User selects/drops image in editor
2. Client resizes image (if needed)
3. Upload via `BlockEditorProvider.uploadFn`
4. Receive `{url, key}` response
5. Key tracked via `onImageUploaded` callback
6. URL embedded in block

---

## 11. Success Metrics

### Product Adoption

| Metric | Target | Timeline |
|--------|--------|----------|
| **npm downloads/month** | 1K+ | 6 months |
| **GitHub stars** | 100+ | 6 months |
| **Published apps using editor** | 5+ | 3 months |
| **Community block extensions** | 3+ | 6 months |

### Quality Metrics

| Metric | Target | Status |
|--------|--------|--------|
| **Test coverage** | 85%+ | ✅ In progress |
| **Bundle size** | < 50KB gzipped | ✅ On track |
| **Performance (100 blocks)** | < 100ms | ✅ Verified |
| **Accessibility (WCAG AA)** | 100% | ✅ In progress |

### User Satisfaction

| Metric | Target | Method |
|--------|--------|--------|
| **Developer feedback** | 4.5/5 stars | npm + GitHub |
| **Issue resolution time** | < 48h | GitHub issues |
| **Documentation clarity** | Beginner-friendly | User feedback |

---

## 12. Roadmap & Future Enhancements

### Phase 1: MVP (Current - v0.1.0)
- ✅ 22 built-in block types
- ✅ Serialized & raw modes
- ✅ Image upload & resize
- ✅ Drag-and-drop reordering
- ✅ Category filtering
- ✅ ArtistEditor component

### Phase 2: Developer Experience (v0.2.0)
- [ ] Plugin system for custom blocks
- [ ] Block templates library
- [ ] Detailed storybook documentation
- [ ] Example integrations (Next.js, Vue)
- [ ] Content versioning & history

### Phase 3: Rich Editing (v0.3.0)
- [ ] Text formatting (bold, italic, links, lists)
- [ ] Block nesting (indentation)
- [ ] Table editor block
- [ ] Markdown import/export
- [ ] Search & find & replace

### Phase 4: Collaboration (v1.0.0)
- [ ] Real-time collaborative editing
- [ ] Comment/mention support
- [ ] Change tracking & suggestions
- [ ] Conflict resolution
- [ ] Multi-user awareness

### Phase 5: Enterprise (v1.1.0)
- [ ] Advanced access control
- [ ] Content approval workflows
- [ ] Analytics & usage tracking
- [ ] Custom block validation
- [ ] Audit logging

---

## 13. Constraints & Assumptions

### Constraints

- **React 18+ required** – No support for older React versions
- **ESM only** – No CommonJS bundle
- **Browser-based** – No Node.js or SSR server component support
- **Single image resize ratio** – No custom aspect ratios (yet)
- **English labels** – i18n planned for future

### Assumptions

- Consumers will provide image upload function
- Content will be stored externally (database, API)
- Styling customization via CSS class overrides
- Custom blocks via BlockDef objects (no UI builder)
- Users have modern browsers (ES2017+)

---

## 14. Open Questions & Decisions

| Question | Current Decision | Rationale | Status |
|----------|------------------|-----------|--------|
| Text formatting support? | Out of scope (v0.1) | Focus on block-level structure first | Deferred to v0.3 |
| Plugin system? | Registry-based (planned) | Extensible without breaking changes | Designed, not implemented |
| Collaborative editing? | WebSocket-based (v1.0 target) | Industry standard for real-time sync | Research phase |
| i18n support? | English only (v0.1) | Focus on US market initially | Planned for v0.2 |
| Commercial licensing? | MIT (open source) | Maximize adoption & community | Decided |

---

## 15. Glossary & Definitions

| Term | Definition |
|------|-----------|
| **Block** | Single unit of content (e.g., paragraph, image, quote) |
| **BlockDef** | Definition of a block type (type, label, icon, factory) |
| **BlockData** | Instance of a block with content (id, type, properties) |
| **Serialization** | Converting block array to/from HTML string |
| **Marker** | Delimiter string in HTML (e.g., "nbe-blocks:") |
| **CSS Prefix** | Class prefix for rendered HTML (e.g., "nbe-pvb-") |
| **Subpath exports** | Named imports from package subpaths (e.g., "@pkg/components/Editor") |
| **Tree-shaking** | Dead code elimination in bundlers |
| **Drag-and-drop** | Reordering blocks with mouse/touch |
| **Round-trip** | Converting data back to original format (array → HTML → array) |

---

## 16. Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-03-03 | Claude Code | Initial PRD document |

---

**Approval Status:**  
🟡 Draft (awaiting stakeholder review)

**Next Steps:**
1. Review and approve by product leadership
2. Validate technical specifications with engineering team
3. Confirm timeline and resource allocation
4. Share with design/marketing teams for launch planning
