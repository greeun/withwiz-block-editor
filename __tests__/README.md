# Test Suite Documentation

All tests and test configuration are centralized under the `__tests__` directory.

## Directory Structure

```
__tests__/
├── config/                                 # Test configuration files
│   ├── vitest.config.ts                   # Vitest config
│   ├── ci.yml                             # GitHub Actions CI/CD pipeline
│   ├── pre-commit                         # Husky pre-commit hook
│   ├── .lintstagedrc.json                 # Lint-staged config
│   └── .codeclimate.yml                   # CodeClimate config
│
├── setup.ts                                # Test environment setup
│
├── security/                               # Security tests
│   ├── xss-prevention.test.ts             # XSS prevention (14 tests)
│   └── file-upload-validation.test.ts     # File upload validation (21 tests)
│
├── performance/                            # Performance tests
│   └── rendering-performance.test.ts      # Rendering performance (7 tests)
│
├── accessibility/                          # Accessibility tests
│   └── accessibility.test.ts              # WCAG 2.1 AA compliance (41 tests)
│
├── integration/                            # Integration tests
│   └── block-editor-integration.test.ts   # Block editor integration (28 tests)
│
└── e2e/                                   # E2E tests (to be added)
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests by category
```bash
npm run test:security       # Security tests (35 tests)
npm run test:performance    # Performance tests (7 tests)
npm run test:accessibility  # Accessibility tests (41 tests)
npm run test:integration    # Integration tests (28 tests)
npm run test:unit          # Unit tests
```

### Generate coverage report
```bash
npm run test:coverage
```

## Test Patterns

### TDD (Test-Driven Development)

All tests follow the TDD methodology (RED → GREEN → REFACTOR):

1. **RED**: Write a failing test
2. **GREEN**: Make it pass with minimal code
3. **REFACTOR**: Clean up and optimize the code

## Test Categories

### Security
- XSS (Cross-Site Scripting) prevention
- File upload validation
- URL sanitization
- HTML escaping

### Performance
- Block rendering speed
- Memory efficiency
- Output size optimization

### Accessibility
- WCAG 2.1 AA compliance
- Semantic HTML
- Keyboard navigation
- Screen reader compatibility

### Integration
- Component interaction
- Rendering pipeline
- Workflow validation

## CI/CD Pipeline

Automated testing via GitHub Actions:
- Run tests on Node.js 18.x, 20.x
- ESLint linting
- TypeScript type checking
- Security scan (Snyk)
- Coverage report (Codecov)
- Automated NPM publish (main branch)

## Configuration File Locations

All test-related configuration lives in `__tests__/config/`:
- `vitest.config.ts`: Vitest config
- `ci.yml`: GitHub Actions workflow
- `pre-commit`: Git pre-commit hook
- `.lintstagedrc.json`: Staged file linting config
- `.codeclimate.yml`: Code quality monitoring

## Test Statistics

| Category | Test Count | Status |
|---------|---------|------|
| Security | 35 | ✅ Pass |
| Performance | 7 | ✅ Pass |
| Accessibility | 41 | ✅ Pass |
| Integration | 28 | ✅ Pass |
| **Total** | **111** | **✅ Pass** |

## Next Steps

- [ ] Configure GitHub Secrets (NPM_TOKEN, SNYK_TOKEN)
- [ ] Initialize Husky (`npm install`)
- [ ] Configure ESLint & Prettier rules
- [ ] Add E2E tests
- [ ] Add badges (README)
