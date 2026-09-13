# Test Suite Quick Reference Guide

**Project**: @withwiz/block-editor
**Total Tests**: 475 passing, 26 todo (501 tests in 22 files, measured 2026-09-13 with `npx vitest run`)
**Code Coverage**: 97%+
**Status**: ✅ Complete and Ready

---

## Running Tests

### Quick Commands

```bash
# Run all tests once
npm test

# Watch mode (re-run on file changes)
npm run test:watch

# Specific test category
npm run test:unit              # Unit tests (306)
npm run test:integration       # Integration tests (34)
npm run test:api               # API contract tests (11)
npm run test:e2e               # E2E tests (57)
npm run test:security          # Security tests (35)
npm run test:performance       # Performance tests (12)
npm run test:accessibility     # Accessibility tests (46: 20 passing, 26 todo)

# Coverage report
npm run test:coverage
```

---

## Test Organization

### Directory Structure

```
__tests__/
├── unit/                    # 306 tests
│   ├── core/
│   │   ├── html-renderer.test.ts        (49 tests)
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
├── security/                # 35 tests
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
└── __mocks__/              # Test utilities
    └── factories/           # Block data generators
```

---

## Test File Reference

### Unit Tests

#### 1. HTML Helper Functions (`html-renderer.test.ts`) - 49 tests

**Functions tested**:
- `h(tag, attrs?, content?)` - Create HTML tags
- `nl2br(text)` - Convert newlines to `<br>`
- `hAttr(attrs)` - Build HTML attribute strings
- `sanitizeUrl(url)` - Safe URL handling
- `sanitizeImageSrc(src)` - Image source validation

**Example test**:
```typescript
it('should escape HTML entities in text content', () => {
  const html = h('p', {}, '<script>alert("xss")</script>');
  expect(html).toContain('&lt;script&gt;');
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

**Example test**:
```typescript
it('renders paragraph block with correct class prefix', () => {
  const block: BlockData = { type: 'paragraph', id: 1, text: 'Hello' };
  const html = renderer.renderBlock(block);
  expect(html).toContain('<p class="test-p"');
  expect(html).toContain('Hello');
});
```

#### 3. Serialization (`serializer.test.ts`) - 38 tests

**Coverage**:
- Array to HTML conversion
- HTML to array parsing
- Round-trip integrity
- Marker encoding/decoding
- Custom marker support

**Example test**:
```typescript
it('preserves block data through serialization cycle', () => {
  const original = [
    { type: 'paragraph', id: 1, text: 'Hello' }
  ];
  const serialized = serializer.serialize(original);
  const deserialized = serializer.deserialize(serialized);
  expect(deserialized).toEqual(original);
});
```

#### 4. Block Factory (`built-in.test.ts`) - 47 tests

**Coverage**:
- BUILT_IN_BLOCKS array (22 blocks)
- Block definition structure
- createEmptyBlock() factory
- getBlockDef() lookup

**Example test**:
```typescript
it('BUILT_IN_BLOCKS has exactly 22 blocks', () => {
  expect(BUILT_IN_BLOCKS).toHaveLength(22);
});
```

### E2E Tests

#### 5. React Component Rendering (`block-editor-render.test.tsx`) - 31 tests

**Coverage**:
- Component mounting
- Single/multiple block rendering
- CSS prefix application
- Accessibility attributes

**Example test**:
```typescript
it('renders paragraph block in React DOM', () => {
  const block: BlockData = { type: 'paragraph', id: 1, text: 'Hello' };
  const { container } = render(<HtmlRenderer html={renderer.renderBlock(block)} />);
  expect(container.querySelector('p.test-p')).toBeInTheDocument();
});
```

#### 6. Serialization Roundtrip (`serializer-roundtrip.test.ts`) - 20 tests

**Coverage**:
- Complete workflow validation
- Data preservation
- Rendered output verification

---

## Test Categories Summary

### Coverage by Category

| Category | Tests | Status |
|----------|-------|--------|
| Unit Tests | 306 | ✅ 100% pass |
| API Tests | 11 | ✅ 100% pass |
| E2E Tests | 57 | ✅ 100% pass |
| Security | 35 | ✅ 100% pass |
| Performance | 12 | ✅ 100% pass |
| Accessibility | 46 | ✅ 20 pass, 26 todo |
| Integration | 34 | ✅ 100% pass |
| **Total** | **501** | **✅ 475 pass, 0 fail, 26 todo** |

Per-file breakdown and scenario/case mapping: `docs/testing/test-classification.md`.

### Coverage by Module

| Module | Coverage | Status |
|--------|----------|--------|
| src/blocks/built-in.ts | 100% | ✅ |
| src/core/serializer.ts | 100% | ✅ |
| src/core/html-renderer.ts | 97.18% | ✅ |
| **Overall** | **85%+** | **✅ Pass** |

---

## Common Test Patterns

### Testing a Block Type

```typescript
describe('Image gallery block rendering', () => {
  it('should render gallery with images', () => {
    const block: BlockData = {
      type: 'gallery',
      id: 1,
      items: [
        { src: 'image1.jpg', cap: 'Caption 1' },
        { src: 'image2.jpg', cap: 'Caption 2' }
      ]
    };
    const html = renderer.renderBlock(block);
    expect(html).toContain('class="test-gallery"');
    expect(html).toContain('image1.jpg');
    expect(html).toContain('image2.jpg');
  });
});
```

### Testing Sanitization

```typescript
describe('Security - URL sanitization', () => {
  it('should block javascript: URLs', () => {
    expect(() => sanitizeUrl('javascript:alert("xss")')).toThrow();
  });

  it('should allow safe URLs', () => {
    const safe = sanitizeUrl('https://example.com');
    expect(safe).toBe('https://example.com');
  });
});
```

### Testing Round-Trip Serialization

```typescript
describe('Serialization round-trip', () => {
  it('preserves data integrity', () => {
    const blocks = [
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

All 22 block types verified:

| Block Type | Test File | Tests | Status |
|------------|-----------|-------|--------|
| paragraph | html-renderer-blocks.test.ts | ✅ | 100% |
| lead | html-renderer-blocks.test.ts | ✅ | 100% |
| subheading | html-renderer-blocks.test.ts | ✅ | 100% |
| subheading-label | html-renderer-blocks.test.ts | ✅ | 100% |
| divider | html-renderer-blocks.test.ts | ✅ | 100% |
| spacer | html-renderer-blocks.test.ts | ✅ | 100% |
| img-full | html-renderer-blocks.test.ts | ✅ | 100% |
| img-inline | html-renderer-blocks.test.ts | ✅ | 100% |
| img-pair | html-renderer-blocks.test.ts | ✅ | 100% |
| gallery | html-renderer-blocks.test.ts | ✅ | 100% |
| img-text | html-renderer-blocks.test.ts | ✅ | 100% |
| quote | html-renderer-blocks.test.ts | ✅ | 100% |
| quote-large | html-renderer-blocks.test.ts | ✅ | 100% |
| stats | html-renderer-blocks.test.ts | ✅ | 100% |
| infobox | html-renderer-blocks.test.ts | ✅ | 100% |
| callout | html-renderer-blocks.test.ts | ✅ | 100% |
| numcards | html-renderer-blocks.test.ts | ✅ | 100% |
| qa | html-renderer-blocks.test.ts | ✅ | 100% |
| press-list | html-renderer-blocks.test.ts | ✅ | 100% |
| timeline | html-renderer-blocks.test.ts | ✅ | 100% |
| video | html-renderer-blocks.test.ts | ✅ | 100% |
| cta | html-renderer-blocks.test.ts | ✅ | 100% |

**Coverage**: 22/22 blocks (100%)

---

## Core Function Coverage

All 5 core functions fully tested:

| Function | File | Tests | Status |
|----------|------|-------|--------|
| h() | html-renderer.test.ts | 7 | ✅ |
| nl2br() | html-renderer.test.ts | 5 | ✅ |
| hAttr() | html-renderer.test.ts | 4 | ✅ |
| sanitizeUrl() | html-renderer.test.ts | 19 | ✅ |
| sanitizeImageSrc() | html-renderer.test.ts | 14 | ✅ |

**Coverage**: 5/5 functions (100%)

---

## Debugging Tests

### Run Single Test File

```bash
npx vitest __tests__/unit/core/html-renderer.test.ts
```

### Run Tests Matching Pattern

```bash
npx vitest -t "paragraph"
```

### Run with Debug Output

```bash
npx vitest --reporter=verbose
```

### UI Mode (Visual Test Runner)

```bash
npx vitest --ui
```

---

## Coverage Requirements

**Enforced Thresholds** (from vitest.config.ts):
- Lines: 85%
- Functions: 85%
- Statements: 85%
- Branches: 80%

**Actual Coverage**:
- Lines: 97%+
- Functions: 97%+
- Statements: 97%+
- Branches: 95%+

All thresholds exceeded.

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

All builds must pass before deployment:
- ✅ TypeScript compilation
- ✅ Type declaration generation
- ✅ Test suite passing (475 passing, 0 failing, 26 todo)
- ✅ Code coverage validated

---

## Adding New Tests

### For New Block Types

1. Add test case to `__tests__/unit/core/html-renderer-blocks.test.ts`
2. Add factory to `__tests__/__mocks__/factories/`
3. Add integration test to `__tests__/e2e/serializer-roundtrip.test.ts`
4. Run `npm run test:coverage` to verify coverage maintained

### For New Functions

1. Add unit tests to appropriate `__tests__/unit/` file
2. Add edge case tests (null, undefined, empty values)
3. Add security tests if handling user input
4. Verify coverage meets 85% threshold

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

# Run coverage to see what's not covered
npm run test:coverage
```

### Coverage Below Threshold

```bash
# Generate detailed coverage report
npm run test:coverage

# Find gaps in specific file
npx vitest --reporter=verbose __tests__/unit/core/html-renderer.test.ts
```

### Performance Issues

```bash
# Check rendering performance
npm run test:performance

# Profile test execution
npx vitest --reporter=verbose
```

---

## Documentation

**Full PDCA Report**: [docs/04-report/test-implementation.report.md](docs/04-report/test-implementation.report.md)

**PDCA Summary**: [docs/PDCA-TEST-PHASE-SUMMARY.md](docs/PDCA-TEST-PHASE-SUMMARY.md)

**Project Guide**: [CLAUDE.md](CLAUDE.md)

---

## Quick Status

✅ **475/475 tests passing** (0 failing, 26 todo)
✅ **97%+ code coverage** (target: 85%+)
✅ **22/22 block types covered** (100%)
✅ **5/5 core functions covered** (100%)
✅ **Ready for production**

**Last Updated**: March 3, 2026 (test counts re-measured September 13, 2026)
**PDCA Status**: Complete and Approved
