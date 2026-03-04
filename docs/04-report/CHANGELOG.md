# Changelog

All notable changes to the @withwiz/block-editor project are documented here.

## [0.1.0] - 2026-03-03

### Added - Test Implementation Phase Completion

#### Test Suite
- **Unit Tests**: 219 tests across core utilities and block types
  - `html-renderer.test.ts`: 49 tests for HTML helper functions (h, nl2br, hAttr, sanitizeUrl, sanitizeImageSrc)
  - `html-renderer-blocks.test.ts`: 85 tests for all 22 block type renderings
  - `serializer.test.ts`: 38 tests for serialization round-trips
  - `built-in.test.ts`: 47 tests for block factory functions and definitions

- **E2E Tests**: 51 tests for integration scenarios
  - `block-editor-render.test.tsx`: 31 tests for React component rendering
  - `serializer-roundtrip.test.ts`: 20 tests for full serialization workflows

- **Additional Test Coverage**: 111 pre-existing tests
  - Security tests: XSS prevention (34 tests) + file upload validation (28 tests)
  - Performance tests: Rendering performance benchmarks (23 tests)
  - Accessibility tests: WCAG compliance verification (26 tests)

#### Test Coverage
- Code coverage: 97%+ (exceeds 85% threshold)
- Block type coverage: 22/22 (100%)
- Core function coverage: 5/5 (100%)
- Total passing tests: 381

#### Documentation
- Comprehensive PDCA completion report: `docs/04-report/test-implementation.report.md`
- Test execution documentation with command reference
- Coverage metrics validation report
- Lessons learned and recommendations for future development

### Key Achievements

- **Test-Driven Development (TDD)**: All tests follow RED → GREEN → REFACTOR cycle
- **Zero Unimplemented Tests**: 100% match rate between design and implementation
- **Security Testing**: JavaScript URL blocking, SVG injection prevention, HTML entity escaping
- **Round-Trip Serialization**: Data preservation verified through BlockData → HTML → BlockData cycle
- **Edge Case Coverage**: Unicode, emoji, special characters, null values, empty arrays

### Technical Details

#### Block Types Verified (22/22)
paragraph, lead, subheading, subheading-label, divider, spacer, img-full, img-inline, img-pair, gallery, img-text, quote, quote-large, stats, infobox, callout, numcards, qa, press-list, timeline, video, cta

#### Core Functions Tested (5/5)
- `h()`: HTML tag creation with attributes
- `nl2br()`: Newline to `<br>` conversion
- `hAttr()`: HTML attribute building
- `sanitizeUrl()`: XSS-safe URL handling
- `sanitizeImageSrc()`: Image source validation

### Issues Resolved

1. **Serializer Behavior Understanding**: Corrected assertions to verify marker-based JSON encoding
2. **Emoji Text Matching**: Fixed Korean language test data typos
3. **CSS Prefix System**: Updated tag matching to account for class attributes in prefixed output

### Testing Commands

```bash
npm test                          # Run all 381 tests
npm run test:watch               # Watch mode
npm run test:unit                # Unit tests (219)
npm run test:integration         # Integration tests
npm run test:security            # Security tests
npm run test:performance         # Performance tests
npm run test:accessibility       # Accessibility tests
npm run test:coverage            # Coverage report
```

### Build Status

- ✅ `npm run build`: All TypeScript compiled successfully
- ✅ `npm run typecheck`: No type errors
- ✅ Coverage thresholds: 85%+ achieved (97%+ actual)
- ✅ All tests passing: 381/381 (100%)

### PDCA Cycle Summary

| Phase | Status | Completion |
|-------|--------|------------|
| Plan | ✅ | Comprehensive scope defined (~216 tests) |
| Design | ✅ | Test architecture documented |
| Do | ✅ | 381 tests implemented and passing |
| Check | ✅ | Gap analysis: 0 unimplemented (100% match) |
| Act | ✅ | Documentation complete, ready for release |

### Recommendations

- Maintain 85%+ coverage threshold on new features
- Continue systematic security testing for new block types
- Consider property-based testing for complex scenarios
- Monitor rendering performance across versions
- Expand E2E tests for real-world usage workflows

---

## Related Documents

- [Plan Document](../01-plan/features/test-implementation.plan.md)
- [Design Document](../02-design/features/test-implementation.design.md)
- [Analysis Document](../03-analysis/test-implementation.analysis.md)
- [Completion Report](./test-implementation.report.md)

---

## Version Information

**Package**: @withwiz/block-editor
**Version**: 0.1.0
**Release Status**: Ready for npm publish
**Test Suite Status**: Fully implemented and verified
**Code Coverage**: 97%+ (target: 85%+)
**Total Tests**: 381 passing
