# Contributing to Team-Wiki

Thank you for your interest in contributing to Team-Wiki! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on what's best for the project
- Show empathy towards other contributors

## Getting Started

1. **Fork the repository**
2. **Clone your fork**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/team-wiki.git
   cd team-wiki
   ```
3. **Install dependencies**:
   ```bash
   ./setup.sh
   ```
4. **Create a branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

### 1. Make Your Changes

- Write clean, readable code
- Follow existing code style
- Add comments for complex logic
- Update documentation if needed

### 2. Test Your Changes

```bash
# Run all tests
pnpm test

# Run specific package tests
pnpm --filter app-backend test
pnpm --filter app-frontend test

# Test in development mode
pnpm dev
```

### 3. Lint and Format

```bash
# Lint code
pnpm lint

# Format code
pnpm format
```

### 4. Commit Your Changes

We use conventional commits. Format: `type(scope): message`

Types:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style (formatting, missing semicolons, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:

```bash
git commit -m "feat(backend): add document search endpoint"
git commit -m "fix(frontend): resolve upload button state"
git commit -m "docs: update API documentation"
```

### 5. Push and Create Pull Request

```bash
git push origin feature/your-feature-name
```

Then open a pull request on GitHub.

## Pull Request Guidelines

### PR Title

Use conventional commit format:

```
feat(scope): add new feature
fix(scope): resolve issue with X
```

### PR Description

Include:

- **What**: Brief description of changes
- **Why**: Reason for the changes
- **How**: Implementation approach
- **Testing**: How you tested the changes
- **Screenshots**: For UI changes

Template:

```markdown
## What

Brief description of the changes

## Why

Explanation of why these changes are needed

## How

Technical approach and implementation details

## Testing

- [ ] Unit tests added/updated
- [ ] Manual testing completed
- [ ] All tests passing

## Screenshots (if applicable)

[Add screenshots here]
```

### Checklist

Before submitting, ensure:

- [ ] Code follows project style
- [ ] Tests pass (`pnpm test`)
- [ ] Linting passes (`pnpm lint`)
- [ ] Documentation updated
- [ ] Commit messages follow convention
- [ ] Branch is up to date with main

## Project Structure

```
team-wiki/
├── packages/
│   ├── app-backend/      # Backend API
│   └── app-frontend/     # Frontend UI
├── .github/              # GitHub config
├── docs/                 # Documentation
└── README.md
```

## Coding Standards

### TypeScript

- Use TypeScript strict mode
- Define interfaces for data structures
- Avoid `any` type
- Use meaningful variable names
- Add JSDoc comments for public APIs

### React

- Use functional components
- Use hooks for state management
- Keep components small and focused
- Extract reusable logic to custom hooks
- Use TypeScript for props

### Backend

- Use async/await for async operations
- Handle errors properly
- Use parameterized queries
- Validate input data
- Add error logging

### Git

- Keep commits atomic and focused
- Write descriptive commit messages
- Rebase before pushing (if needed)
- Don't commit generated files

## Testing

### Backend Tests

```typescript
import { describe, it, expect } from '@jest/globals';

describe('Feature', () => {
  it('should do something', () => {
    const result = doSomething();
    expect(result).toBe(expected);
  });
});
```

### Frontend Tests

```typescript
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';

describe('Component', () => {
  it('renders correctly', () => {
    const { getByText } = render(<Component />);
    expect(getByText('Hello')).toBeInTheDocument();
  });
});
```

## Documentation

Update documentation when:

- Adding new features
- Changing APIs
- Modifying setup process
- Adding dependencies

Files to update:

- `README.md` - Project overview
- `SETUP.md` - Installation guide
- `DEVELOPMENT.md` - Developer guide
- `CHANGELOG.md` - Version history
- Inline code comments

## Issue Reporting

### Bug Reports

Include:

- Clear description
- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment (OS, Node version, etc.)
- Screenshots (if applicable)

### Feature Requests

Include:

- Use case
- Proposed solution
- Alternative solutions
- Additional context

## Questions?

- Check existing documentation
- Search existing issues
- Ask in discussions
- Create a new issue

## Recognition

Contributors will be recognized in:

- README.md contributors section
- Release notes
- Project documentation

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Team-Wiki! 🎉
