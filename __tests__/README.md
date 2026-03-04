# Test Suite Documentation

모든 테스트 및 테스트 설정이 `__tests__` 디렉토리 아래에 중앙화되어 있습니다.

## 디렉토리 구조

```
__tests__/
├── config/                                 # 테스트 설정 파일들
│   ├── vitest.config.ts                   # Vitest 설정
│   ├── ci.yml                             # GitHub Actions CI/CD 파이프라인
│   ├── pre-commit                         # Husky pre-commit 훅
│   ├── .lintstagedrc.json                 # Lint-staged 설정
│   └── .codeclimate.yml                   # CodeClimate 설정
│
├── setup.ts                                # 테스트 환경 설정
│
├── security/                               # 보안 테스트
│   ├── xss-prevention.test.ts             # XSS 방지 (14 tests)
│   └── file-upload-validation.test.ts     # 파일 업로드 검증 (21 tests)
│
├── performance/                            # 성능 테스트
│   └── rendering-performance.test.ts      # 렌더링 성능 (7 tests)
│
├── accessibility/                          # 접근성 테스트
│   └── accessibility.test.ts              # WCAG 2.1 AA 준수 (41 tests)
│
├── integration/                            # 통합 테스트
│   └── block-editor-integration.test.ts   # 블록 에디터 통합 (28 tests)
│
└── e2e/                                   # E2E 테스트 (향후 추가)
```

## 테스트 실행

### 모든 테스트 실행
```bash
npm test
```

### 카테고리별 테스트 실행
```bash
npm run test:security       # 보안 테스트 (35 tests)
npm run test:performance    # 성능 테스트 (7 tests)
npm run test:accessibility  # 접근성 테스트 (41 tests)
npm run test:integration    # 통합 테스트 (28 tests)
npm run test:unit          # 단위 테스트
```

### 커버리지 리포트 생성
```bash
npm run test:coverage
```

## 테스트 패턴

### TDD (Test-Driven Development)

모든 테스트는 TDD 방법론(RED → GREEN → REFACTOR)을 따릅니다:

1. **RED**: 실패하는 테스트 작성
2. **GREEN**: 최소 코드로 통과
3. **REFACTOR**: 코드 정리 및 최적화

## 테스트 카테고리

### Security (보안)
- XSS (Cross-Site Scripting) 방지
- 파일 업로드 검증
- URL 새니타이제이션
- HTML 이스케이핑

### Performance (성능)
- 블록 렌더링 속도
- 메모리 효율성
- 출력 크기 최적화

### Accessibility (접근성)
- WCAG 2.1 AA 준수
- 시맨틱 HTML
- 키보드 네비게이션
- 스크린 리더 호환성

### Integration (통합)
- 컴포넌트 상호작용
- 렌더링 파이프라인
- 워크플로우 검증

## CI/CD 파이프라인

GitHub Actions를 통한 자동화된 테스트:
- Node.js 18.x, 20.x에서 테스트 실행
- ESLint 린팅
- TypeScript 타입 검사
- 보안 스캔 (Snyk)
- 커버리지 리포트 (Codecov)
- NPM 자동 배포 (main 브랜치)

## 설정 파일 위치

모든 테스트 관련 설정이 `__tests__/config/`에 있습니다:
- `vitest.config.ts`: Vitest 설정
- `ci.yml`: GitHub Actions 워크플로우
- `pre-commit`: Git pre-commit 훅
- `.lintstagedrc.json`: Staged 파일 린팅 설정
- `.codeclimate.yml`: 코드 품질 모니터링

## 테스트 통계

| 카테고리 | 테스트 수 | 상태 |
|---------|---------|------|
| Security | 35 | ✅ Pass |
| Performance | 7 | ✅ Pass |
| Accessibility | 41 | ✅ Pass |
| Integration | 28 | ✅ Pass |
| **Total** | **111** | **✅ Pass** |

## 다음 단계

- [ ] GitHub Secrets 설정 (NPM_TOKEN, SNYK_TOKEN)
- [ ] Husky 초기화 (`npm install`)
- [ ] ESLint & Prettier 규칙 설정
- [ ] E2E 테스트 추가
- [ ] 배지 추가 (README)
