# npm Test Scripts Guide

All tests can be executed via npm run scripts. This document provides a complete reference for running tests in the @withwiz/block-editor project.

## Quick Reference

```bash
# Run all tests once
npm test

# Run tests in watch mode (re-run on changes)
npm run test:watch

# Run specific test categories
npm run test:unit           # Unit tests only (219 tests)
npm run test:e2e            # E2E tests only (51 tests)
npm run test:integration    # Integration tests only (28 tests)
npm run test:security       # Security tests only (14 tests)
npm run test:performance    # Performance tests only (7 tests)
npm run test:accessibility  # Accessibility tests only (41 tests)

# Coverage report
npm run test:coverage       # Full coverage with detailed report

# Type checking
npm run typecheck           # Verify TypeScript types
```

## Available Scripts

### Core Test Commands

#### `npm test`
Runs all 381 tests across all categories (one time execution).

**Output:**
```
✓ 11 test files passed
✓ 381 tests passed
Duration: ~1000ms
```

**When to use:** Quick verification that all tests pass before commit/push.

---

#### `npm run test:watch`
Runs tests in watch mode. Tests automatically re-run when files change.

**Output:** Interactive watch mode with prompt for commands
```
› Press 'a' to run all tests
› Press 'f' to run only failed tests
› Press 'p' to filter by a filename
› Press 't' to filter by a test name
› Press 'q' to quit
```

**When to use:** During development to get immediate feedback on code changes.

---

### Category-Specific Tests

#### `npm run test:unit`
Unit tests for individual functions and components (219 tests).

**Test Files:**
- `__tests__/unit/core/html-renderer.test.ts` (49 tests)
  - HTML escaping: h(), nl2br(), hAttr()
  - URL sanitization: sanitizeUrl(), sanitizeImageSrc()
  
- `__tests__/unit/core/html-renderer-blocks.test.ts` (85 tests)
  - All 22 block type rendering tests
  
- `__tests__/unit/core/serializer.test.ts` (38 tests)
  - Serialization/deserialization
  - Round-trip validation
  
- `__tests__/unit/blocks/built-in.test.ts` (47 tests)
  - BUILT_IN_BLOCKS array
  - Block factory functions

**Coverage:** 100% for tested modules

**When to use:** Testing individual functions and components in isolation.

---

#### `npm run test:e2e`
End-to-end tests for complete workflows (51 tests).

**Test Files:**
- `__tests__/e2e/block-editor-render.test.tsx` (31 tests)
  - React component rendering with Testing Library
  - DOM verification for all block types
  
- `__tests__/e2e/serializer-roundtrip.test.ts` (20 tests)
  - Full serialization workflow: BlockData → HTML → BlockData → Render
  - Complex data structures and special characters

**When to use:** Testing user workflows and full feature integration.

---

#### `npm run test:integration`
Integration tests for component interactions (28 tests).

**Test Files:**
- `__tests__/integration/block-editor-integration.test.ts`
  - BlockEditor ↔ BlockRenderer interaction
  - Data flow and state management

**When to use:** Verifying multiple components work together correctly.

---

#### `npm run test:security`
Security-focused tests preventing vulnerabilities (14 tests).

**Test Files:**
- `__tests__/security/xss-prevention.test.ts`
  - XSS attack prevention
  - HTML escaping validation
  - JavaScript protocol blocking

**Coverage:**
- javascript: URL blocking
- data: URI blocking
- SVG injection prevention
- HTML entity escaping

**When to use:** Security audit and vulnerability prevention.

---

#### `npm run test:performance`
Performance benchmarks and optimization tests (7 tests).

**Test Files:**
- `__tests__/performance/rendering-performance.test.ts`
  - Rendering speed for large datasets
  - Memory efficiency

**When to use:** Performance regression detection and optimization.

---

#### `npm run test:accessibility`
Accessibility compliance tests (41 tests).

**Test Files:**
- `__tests__/accessibility/accessibility.test.ts`
  - WCAG compliance
  - Screen reader compatibility
  - Keyboard navigation

**When to use:** Ensuring accessible user experience.

---

### Coverage & Quality

#### `npm run test:coverage`
Runs all tests with coverage reporting.

**Output:**
```
Coverage Report:
──────────────────────────────────
 File              | % Stmts | % Branch | % Funcs | % Lines
──────────────────────────────────
 blocks/built-in   |   100   |   100    |  100    |  100
 core/serializer   |   100   |    75    |  100    |  100
 core/html-render  |  97.18  |  95.19   |  100    | 97.18
──────────────────────────────────
```

**Thresholds (Enforced):**
- Statements: 85%+
- Functions: 85%+
- Lines: 85%+
- Branches: 80%+

**When to use:** Before merging to main; ensuring code coverage quality.

---

#### `npm run typecheck`
Verifies TypeScript type correctness without compilation.

**When to use:** Quick type validation without full build.

---

## Test Statistics

| Category | Files | Tests | Coverage |
|----------|-------|-------|----------|
| Unit | 4 | 219 | 100% (built-in, serializer) |
| E2E | 2 | 51 | Full workflow |
| Integration | 1 | 28 | ✓ |
| Security | 1 | 14 | ✓ |
| Performance | 1 | 7 | ✓ |
| Accessibility | 1 | 41 | ✓ |
| **Total** | **11** | **381** | **97%+** |

## Development Workflow

### 1. During Development
```bash
npm run test:watch    # Keep running in terminal, watch for changes
```

### 2. Before Commit
```bash
npm test              # Verify all tests pass
npm run typecheck     # Verify types are correct
npm run build         # Verify build succeeds
```

### 3. Before Push/PR
```bash
npm run test:coverage # Check coverage meets thresholds
```

### 4. Focused Testing
```bash
npm run test:unit     # Test just the unit tests
npm run test:security # Security audit
```

## Troubleshooting

### All tests pass locally but fail in CI
- Check Node version (requires Node 18+)
- Clear node_modules: `rm -rf node_modules && npm install`
- Check file permissions in __tests__/

### Specific test file fails
```bash
# Run single file (using vitest directly)
npx vitest __tests__/unit/core/html-renderer.test.ts
```

### Watch mode not detecting changes
- Check file is in `src/` or `__tests__/`
- Verify tsconfig.json `include` paths

### Coverage report not generated
```bash
# Ensure coverage tools are installed
npm install --save-dev @vitest/coverage-v8
```

## See Also

- [CLAUDE.md](./CLAUDE.md) - Project overview and architecture
- [TEST-GUIDE.md](./TEST-GUIDE.md) - Detailed testing patterns and examples
- [docs/04-report/test-implementation.report.md](./docs/04-report/test-implementation.report.md) - Full PDCA report
