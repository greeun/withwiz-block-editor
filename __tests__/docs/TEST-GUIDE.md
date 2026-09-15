# Test Suite Quick Reference Guide

**Project**: @withwiz/block-editor
**Total Tests**: 508 passing, 26 todo (534 tests in 23 files, measured 2026-09-16 with `npm test` on v0.3.1 plus the unreleased linkify quote fix on `fix/residual-defects`)
**Code Coverage**: Statements 86.69%, Branches 88.04%, Functions 89.91%, Lines 86.43% for source files loaded by tests (measured 2026-09-16, see [Coverage Requirements](#coverage-requirements))
**Status**: ✅ 0 failing. The 26 todo tests are `it.todo` placeholders in `accessibility.test.ts`

---

## Running Tests

### Quick Commands

```bash
# Run all tests once
npm test

# Watch mode (re-run on file changes)
npm run test:watch

# Specific test category
npm run test:unit              # Unit tests (324)
npm run test:integration       # Integration tests (34)
npm run test:api               # API contract tests (11)
npm run test:e2e               # E2E tests (57)
npm run test:security          # Security tests (50)
npm run test:performance       # Performance tests (12)
npm run test:accessibility     # Accessibility tests (46: 20 passing, 26 todo)

# Coverage report (requires @vitest/coverage-v8, which is not installed by npm ci)
npm run test:coverage
```

---

## Test Organization

### Directory Structure

```
__tests__/
├── unit/                    # 324 tests
│   ├── core/
│   │   ├── html-renderer.test.ts        (67 tests)
│   │   ├── html-renderer-blocks.test.ts (85 tests)
│   │   ├── image-resize.test.ts         (16 tests)
│   │   └── serializer.test.ts           (38 tests)
│   ├── blocks/
│   │   └── built-in.test.ts             (47 tests)
│   ├── context/
│   │   └── BlockEditorProvider.test.tsx (7 tests)
│   ├── hooks/
│   │   └── useImageDropZone.test.tsx    (20 tests)
│   └── mini-editor/
│       ├── MiniEditor.regressions.test.tsx (25 tests)
│       ├── MiniEditor.test.tsx          (8 tests)
│       ├── toolbar-config.test.ts       (5 tests)
│       └── useRichText.test.ts          (6 tests)
│
├── api/                     # 11 tests
│   └── upload-single.test.ts            (11 tests)
│
├── e2e/                     # 57 tests
│   ├── block-editor-render.test.tsx     (31 tests)
│   ├── mini-editor-journey.test.tsx     (6 tests)
│   └── serializer-roundtrip.test.ts     (20 tests)
│
├── security/                # 50 tests
│   ├── attribute-injection.test.tsx     (15 tests)
│   ├── xss-prevention.test.ts           (14 tests)
│   └── file-upload-validation.test.ts   (21 tests)
│
├── performance/             # 12 tests
│   ├── rendering-performance.test.ts    (7 tests)
│   └── serializer-renderer-perf.test.ts (5 tests)
│
├── accessibility/           # 46 tests (20 passing, 26 todo)
│   └── accessibility.test.ts
│
├── integration/             # 34 tests
│   ├── artist-editor.test.tsx           (6 tests)
│   └── block-editor-integration.test.ts (28 tests)
│
├── __mocks__/               # README.md only (no mock or factory files)
├── config/                  # ci.yml (same as .github/workflows/ci.yml), pre-commit, vitest.config.ts; not used by npm scripts
├── docs/                    # TEST-GUIDE.md, TEST-SCRIPTS.md
├── setup.ts                 # setupFiles: jest-dom matchers, matchMedia/IntersectionObserver/ResizeObserver mocks, fake timers
└── README.md
```

The npm scripts use the root `vitest.config.ts`. `__tests__/config/vitest.config.ts` is a separate copy that no script references.

---

## Test File Reference

### Unit Tests

#### 1. HTML Helper Functions (`html-renderer.test.ts`) - 67 tests

**Functions tested** (all in `src/core/html-renderer.ts`):
- `h(s: string)` - Escape `&`, `<`, `>`, `"`, `'` for HTML text and quoted attributes (9 tests)
- `nl2br(s: string)` - Escape with `h()`, convert `\n`/`\r\n` to `<br>`, then apply `linkify()` (6 tests)
- `linkify(html: string)` - Wrap http(s) URLs in anchor tags. The URL match stops before a raw quote or a quote entity (`&quot;`, `&#39;`, `&#x27;`, `&apos;`) (13 tests: 4 basic + 9 quoted URL)
- `hAttr(s: string)` - Attribute-value escaping; returns `h(s)` unchanged (6 tests)
- `sanitizeUrl(url: string)` - Returns the trimmed URL for http(s), `/`, `#`, `./`, `../`, or `""` otherwise (19 tests)
- `sanitizeImageSrc(src: string)` - Returns the trimmed image source for allowed values, or `""` (14 tests)

**Example test**:
```typescript
it('작은 괄호를 &lt;&gt;로 변환', () => {
  expect(h('<script>')).toBe('&lt;script&gt;');
});
```

#### 2. Block Type Rendering (`html-renderer-blocks.test.ts`) - 85 tests

**All 22 block types covered**:
- paragraph, lead, subheading, subheading-label
- divider, spacer
- img-full, img-inline, img-pair, gallery, img-text
- quote, quote-large
- stats, infobox, callout, numcards
- qa, press-list, timeline, video, cta

Plus unknown block type (1), CSS class prefix (1), and `catClass` (2).

**Example test**:
```typescript
const renderer = createHtmlRenderer('test');

it('텍스트가 있으면 p.test-p로 렌더링', () => {
  const block: BlockData = { type: 'paragraph', id: 1, text: '본문 텍스트' };
  expect(renderer.renderBlock(block)).toBe('<p class="test-p">본문 텍스트</p>');
});
```

#### 3. Serialization (`serializer.test.ts`) - 38 tests

**Coverage**:
- `serialize()` - Block array to an HTML comment `<!-- {marker}{base64} -->` (6)
- `deserialize()` - Restore data, return `null` for missing marker or corrupted data (14)
- Round-trip equality (13)
- Custom marker and marker with special characters (3)
- Large block arrays (2)

**Example test**:
```typescript
const serializer = createSerializer<BlockData[]>('BK_DATA_V1');

it('preserves block data through serialization cycle', () => {
  const original: BlockData[] = [{ type: 'paragraph', id: 1, text: 'Hello' }];
  const serialized = serializer.serialize(original);
  const deserialized = serializer.deserialize(serialized);
  expect(deserialized).toEqual(original);
});
```

#### 4. Block Factory (`built-in.test.ts`) - 47 tests

**Coverage**:
- BUILT_IN_BLOCKS array (22 blocks) and block definition structure (9)
- getBlockDef() lookup (6)
- createEmptyBlock() factory (28)
- BlockDef.createEmpty (2) and identity checks (2)

**Example test**:
```typescript
it('BUILT_IN_BLOCKS has exactly 22 blocks', () => {
  expect(BUILT_IN_BLOCKS).toHaveLength(22);
});
```

### E2E Tests

#### 5. Rendered HTML in React DOM (`block-editor-render.test.tsx`) - 31 tests

This file mounts `createHtmlRenderer()` output with a local `HtmlRenderer` helper component defined in the test file (`dangerouslySetInnerHTML`). It does not render the package's `BlockRenderer` or `BlockEditor` components.

**Coverage**:
- Single/multiple block rendering and order
- Special character escaping and XSS prevention
- Images, empty blocks, compound blocks
- CSS prefix, newlines, `renderBlocksWrapped()`, `catClass`

**Example test**:
```typescript
function HtmlRenderer({ html }: { html: string }) {
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

it('단락 블록이 <p> 태그로 렌더링됨', () => {
  const block: BlockData = { type: 'paragraph', id: 1, text: '안녕하세요' };
  const { container } = render(<HtmlRenderer html={renderer.renderBlock(block)} />);
  expect(container.querySelector('p.test-p')).toBeInTheDocument();
});
```

#### 6. Serialization Roundtrip (`serializer-roundtrip.test.ts`) - 20 tests

**Coverage**:
- Simple and compound block round-trips
- Special characters and encoding
- Serialized data embedded in HTML markup
- Large data sets, error handling and edge cases

---

## Test Categories Summary

### Coverage by Category

| Category | Tests | Status |
|----------|-------|--------|
| Unit Tests | 324 | ✅ 100% pass |
| API Tests | 11 | ✅ 100% pass |
| E2E Tests | 57 | ✅ 100% pass |
| Security | 50 | ✅ 100% pass |
| Performance | 12 | ✅ 100% pass |
| Accessibility | 46 | ✅ 20 pass, 26 todo |
| Integration | 34 | ✅ 100% pass |
| **Total** | **534** | **✅ 508 pass, 0 fail, 26 todo** |

Per-file breakdown and scenario/case mapping: `docs/testing/test-classification.md`.

### Coverage by Module

Measured 2026-09-16 with `@vitest/coverage-v8@4.1.7` installed temporarily (`npm install --no-save`) and `--coverage.include='src/**'`.

| Module | Stmts | Branch | Funcs | Lines |
|--------|-------|--------|-------|-------|
| src/blocks/built-in.ts | 100% | 100% | 100% | 100% |
| src/context/BlockEditorProvider.tsx | 100% | 100% | 100% | 100% |
| src/mini-editor/toolbar-config.ts | 100% | 100% | 100% | 100% |
| src/core/serializer.ts | 100% | 75% | 100% | 100% |
| src/core/html-renderer.ts | 98.98% | 95.41% | 100% | 98.76% |
| src/mini-editor/useRichText.ts | 96.72% | 91.42% | 100% | 100% |
| src/mini-editor/MiniEditor.tsx | 93.1% | 88% | 100% | 100% |
| src/components/ArtistEditor.tsx | 88.88% | 80.7% | 87.5% | 91.58% |
| src/hooks/useImageDropZone.ts | 84.15% | 82.6% | 92.3% | 84.37% |
| src/core/image-resize.ts | 58.19% | 73.33% | 50% | 58.67% |
| src/components/BlockEditor.tsx, BlockRenderer.tsx, ImageUploadField.tsx, BlockPreviewTheme.tsx | 0% | 0% | 0% | 0% |
| **Overall, files loaded by tests** (`npm run test:coverage` default) | **86.69%** | **88.04%** | **89.91%** | **86.43%** |
| **Overall, all `src/**`** | **58.68%** | **58.93%** | **48.41%** | **58.93%** |

No test imports the four component files in the 0% row. Without `--coverage.include`, Vitest 4 leaves them out of the report, so the default overall figure only covers the other files.

---

## Common Test Patterns

### Testing a Block Type

```typescript
describe('Image gallery block rendering', () => {
  it('should render gallery with images', () => {
    const block: BlockData = {
      type: 'gallery',
      id: 1,
      src1: 'image1.jpg',
      src2: 'image2.jpg',
      src3: '',
      cap: 'Caption'
    };
    const html = renderer.renderBlock(block);
    expect(html).toContain('class="test-gal"');
    expect(html).toContain('image1.jpg');
    expect(html).toContain('image2.jpg');
  });
});
```

### Testing Sanitization

```typescript
describe('Security - URL sanitization', () => {
  it('should block javascript: URLs', () => {
    expect(sanitizeUrl('javascript:alert("xss")')).toBe('');
  });

  it('should allow safe URLs', () => {
    const safe = sanitizeUrl('https://example.com');
    expect(safe).toBe('https://example.com');
  });
});
```

`sanitizeUrl()` and `sanitizeImageSrc()` never throw. They return `""` for blocked input.

### Testing Round-Trip Serialization

```typescript
describe('Serialization round-trip', () => {
  const serializer = createSerializer<BlockData[]>('BK_DATA_V1');

  it('preserves data integrity', () => {
    const blocks: BlockData[] = [
      { type: 'paragraph', id: 1, text: 'Hello' },
      { type: 'img-full', id: 2, src: 'image.jpg', cap: '' }
    ];
    const html = serializer.serialize(blocks);
    const restored = serializer.deserialize(html);
    expect(restored).toEqual(blocks);
  });
});
```

---

## Block Type Coverage Matrix

All 22 block types have render tests in `html-renderer-blocks.test.ts`:

| Block Type | Tests |
|------------|-------|
| paragraph | 3 |
| lead | 4 |
| subheading | 3 |
| subheading-label | 4 |
| divider | 1 |
| spacer | 4 |
| img-full | 4 |
| img-inline | 4 |
| img-pair | 5 |
| gallery | 3 |
| img-text | 5 |
| quote | 4 |
| quote-large | 3 |
| stats | 3 |
| infobox | 2 |
| callout | 4 |
| numcards | 3 |
| qa | 5 |
| press-list | 4 |
| timeline | 3 |
| video | 4 |
| cta | 6 |

**Coverage**: 22/22 block types have at least one render test. Per-block line coverage is not measured separately.

---

## Core Function Coverage

All 6 exported helper functions in `src/core/html-renderer.ts` have unit tests. `createHtmlRenderer()` is covered by `html-renderer-blocks.test.ts`.

| Function | File | Tests |
|----------|------|-------|
| h() | html-renderer.test.ts | 9 |
| nl2br() | html-renderer.test.ts | 6 |
| linkify() | html-renderer.test.ts | 13 |
| hAttr() | html-renderer.test.ts | 6 |
| sanitizeUrl() | html-renderer.test.ts | 19 |
| sanitizeImageSrc() | html-renderer.test.ts | 14 |

`nl2br()` and `linkify()` are also checked for attribute injection by parsing the output in `security/attribute-injection.test.tsx` (SEC-007, SEC-008).

**Coverage**: 6/6 helper functions have unit tests. `html-renderer.ts` function coverage is 100% (2026-09-16).

---

## Debugging Tests

### Run Single Test File

```bash
# One-shot run (npx vitest <file> without "run" starts watch mode)
npx vitest run __tests__/unit/core/html-renderer.test.ts
```

### Run Tests Matching Pattern

```bash
npx vitest run -t "paragraph"
```

### Run with Debug Output

```bash
npx vitest run --reporter=verbose
```

### UI Mode (Visual Test Runner)

```bash
npx vitest --ui
```

`@vitest/ui` is not a devDependency. Without it this command fails with `MISSING DEPENDENCY Cannot find dependency '@vitest/ui'`.

---

## Coverage Requirements

### Running Coverage

`@vitest/coverage-v8` is not a devDependency. After `npm ci`, `npm run test:coverage` exits with code 1:

```
MISSING DEPENDENCY  Cannot find dependency '@vitest/coverage-v8'
```

To measure coverage without changing `package.json`, install the provider that matches the installed Vitest version:

```bash
npm install --no-save @vitest/coverage-v8@4.1.7
npm run test:coverage
```

Coverage instrumentation slows rendering. On 2026-09-16, PERF-002 `500블록 호출 x30회 — p95 < 5ms` failed once under coverage with p95 7.57ms, then passed in the next two coverage runs. It passes in normal `npm test` runs.

When Vitest detects an AI agent environment, the text reporter hides files with 100% statement, branch, and function coverage. Use `--coverage.reporter=json-summary` or open `coverage/index.html` to see every file.

### Configured Thresholds (Not Enforced)

`vitest.config.ts` sets these values directly under `coverage`:
- Lines: 85%
- Functions: 85%
- Statements: 85%
- Branches: 80%

Vitest 4 reads thresholds only from `coverage.thresholds`, so these values are ignored and a coverage run never fails because of them. `thresholdAutoUpdate` is not a Vitest 4 option either.

### Actual Coverage (2026-09-16)

| Scope | Stmts | Branch | Funcs | Lines |
|-------|-------|--------|-------|-------|
| Files loaded by tests (default report) | 86.69% | 88.04% | 89.91% | 86.43% |
| All `src/**` | 58.68% | 58.93% | 48.41% | 58.93% |

The default report is above the configured values. The all-`src/**` figure is below them.

---

## Integration with Build Process

### Build Commands

```bash
# Full build (JS + types)
npm run build

# Bundle only
npm run build:js

# Type declarations only
npm run build:types

# Type checking
npm run typecheck
```

### Build Status

`package.json` has no `prepublishOnly` script, so `npm publish` does not build or test automatically. Run these before publishing.

Results on 2026-09-16 (`fix/residual-defects`):
- ✅ `npm run typecheck` (TypeScript compilation, no errors)
- ✅ `npm run build` (tsup bundle + type declaration generation)
- ✅ `npm test` (508 passing, 0 failing, 26 todo)
- Coverage is not a gate. The configured thresholds are not enforced (see [Coverage Requirements](#coverage-requirements))

---

## Adding New Tests

### For New Block Types

1. Add test cases to `__tests__/unit/core/html-renderer-blocks.test.ts`
2. Update the 22-block assertions in `__tests__/unit/blocks/built-in.test.ts`
3. Add a round-trip case to `__tests__/e2e/serializer-roundtrip.test.ts`
4. Run `npm run test:coverage` to check coverage (requires the coverage provider, see [Coverage Requirements](#coverage-requirements))

### For New Functions

1. Add unit tests to appropriate `__tests__/unit/` file
2. Add edge case tests (null, undefined, empty values)
3. Add security tests if handling user input
4. Check coverage against the 85% target (not enforced automatically)

### For New Features

1. Write tests first (TDD methodology)
2. Implement feature to pass tests
3. Add integration tests
4. Run full test suite
5. Verify coverage maintained or improved

---

## Troubleshooting

### Tests Failing After Code Changes

```bash
# Run tests in watch mode to see failures immediately
npm run test:watch

# Run coverage to see what's not covered (requires @vitest/coverage-v8)
npm run test:coverage
```

### Checking Coverage for a File

```bash
# Generate detailed coverage report (requires @vitest/coverage-v8)
npm run test:coverage

# Coverage for a specific source file
npx vitest run --coverage --coverage.include=src/core/html-renderer.ts
```

### Performance Issues

```bash
# Check rendering performance
npm run test:performance

# Show per-test durations
npx vitest run --reporter=verbose
```

---

## Documentation

**Test Classification**: [docs/testing/test-classification.md](../../docs/testing/test-classification.md)

**PDCA Report**: [docs/04-report/test-implementation.report.md](../../docs/04-report/test-implementation.report.md) (written 2026-03-03 when the suite had 381 tests; its figures are historical)

**Project Guide**: [CLAUDE.md](../../CLAUDE.md)

---

## Quick Status

✅ **508 passing, 0 failing, 26 todo** (534 tests in 23 files)
✅ **86.43% line coverage** for files loaded by tests (58.93% across all `src/**`)
✅ **22/22 block types** have render tests
✅ **6/6 html-renderer helper functions** have unit tests

**Last Updated**: September 16, 2026 (test counts, coverage, and build status measured on `fix/residual-defects`, v0.3.1 plus the linkify quote fix)
**PDCA Report Status**: Approved (report dated 2026-03-03)
