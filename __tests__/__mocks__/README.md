# Test Mocks & Fixtures

This directory contains reusable mocks, test doubles, and fixtures for the test suite.

## 📂 Structure

```
__mocks__/
├── factories/     # Test data factories (create mock objects)
├── services/      # Mock service implementations
├── helpers/       # Test helper functions and utilities
└── README.md      # This file
```

## 📋 Guidelines

### Factories

Create realistic test data using factory functions.

```typescript
// factories/block-factory.ts
import { Block } from '@/types';

export function createMockBlock(overrides?: Partial<Block>): Block {
  return {
    id: 'block-1',
    type: 'paragraph',
    content: 'Sample text',
    order: 1,
    ...overrides,
  };
}

export function createMockBlocks(count: number): Block[] {
  return Array.from({ length: count }, (_, i) => 
    createMockBlock({ id: `block-${i}`, order: i })
  );
}
```

### Services

Mock external services and API calls.

```typescript
// services/mock-file-upload.ts
import { vi } from 'vitest';

export function createMockUploadService() {
  return {
    upload: vi.fn().mockResolvedValue({
      id: 'upload-1',
      url: 'https://example.com/image.jpg',
    }),
    delete: vi.fn().mockResolvedValue(true),
  };
}
```

### Helpers

Shared test utilities and custom render functions.

```typescript
// helpers/test-utils.tsx
import { ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BlockEditorProvider } from '@/context/BlockEditorProvider';

function AllTheProviders({ children }: { children: ReactNode }) {
  return <BlockEditorProvider>{children}</BlockEditorProvider>;
}

export function renderWithProviders(
  ui: ReactNode,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllTheProviders, ...options });
}

export { screen, fireEvent } from '@testing-library/react';
```

## ✅ Reusability First

- Don't duplicate mock code across tests
- Move common mocks to this directory
- Share factories and service mocks
- Document each mock's purpose
- Use type-safe factories with TypeScript

## 🔗 Usage

```typescript
// In your test file
import { createMockBlock, createMockBlocks } from '../__mocks__/factories/block-factory';
import { createMockUploadService } from '../__mocks__/services/mock-file-upload';
import { renderWithProviders } from '../__mocks__/helpers/test-utils';

describe('BlockEditor', () => {
  const mockBlock = createMockBlock();
  const uploadService = createMockUploadService();
  
  it('should render block', () => {
    renderWithProviders(<BlockEditor block={mockBlock} />);
    // Test...
  });
});
```

---

**Note:** Keep mocks close to test code. Only move to this directory if reused in 2+ test files.
