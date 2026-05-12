# Contributing to Azure Image MCP Server

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

Be respectful, inclusive, and constructive in all interactions.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/azure-image-mcp-server.git`
3. Create a feature branch: `git checkout -b feature/my-new-feature`
4. Make your changes
5. Run tests: `npm test`
6. Run linting: `npm run lint`
7. Commit your changes: `git commit -am 'Add new feature'`
8. Push to your fork: `git push origin feature/my-new-feature`
9. Create a Pull Request

## Development Setup

```bash
# Install dependencies
npm install

# Run in development mode with watch
npm run dev

# Run tests in watch mode
npm run test:watch

# Run type checking
npm run typecheck

# Run linting
npm run lint
npm run lint:fix  # Auto-fix issues
```

## Project Structure

```
src/
├── index.ts              # Main server entry point
├── types/
│   └── index.ts          # TypeScript type definitions
├── schemas/
│   └── imageSchemas.ts   # Zod validation schemas
├── services/
│   └── azureImageService.ts  # Azure OpenAI integration
├── tools/
│   └── imageGeneration.ts    # MCP tool implementations
└── utils/
    ├── config.ts         # Configuration management
    └── logger.ts         # Logging utilities

tests/
├── unit/                 # Unit tests
└── integration/          # Integration tests (future)
```

## Coding Standards

### TypeScript

- Use strict TypeScript settings
- Provide explicit return types for public functions
- Use descriptive variable and function names
- Prefer `const` over `let`
- Use async/await over promises

### Code Style

- Follow ESLint rules defined in `eslint.config.js`
- Use 2 spaces for indentation
- Maximum line length: 100 characters
- Use single quotes for strings
- Add JSDoc comments for public APIs

### Example

```typescript
/**
 * Generate an image using Azure OpenAI
 * @param prompt - The text prompt for image generation
 * @param options - Optional generation parameters
 * @returns Generated image metadata and file path
 */
async function generateImage(
  prompt: string,
  options?: ImageOptions
): Promise<ImageResult> {
  // Implementation
}
```

## Testing

### Writing Tests

- Place unit tests in `tests/unit/`
- Use descriptive test names
- Follow AAA pattern: Arrange, Act, Assert
- Test both success and failure cases

### Example Test

```typescript
describe('ImageGenerationSchema', () => {
  it('should accept valid prompt', () => {
    const input = { prompt: 'A beautiful sunset' };
    const result = ImageGenerationSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('should reject empty prompt', () => {
    const input = { prompt: '' };
    const result = ImageGenerationSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});
```

### Running Tests

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # With coverage report
```

## Pull Request Guidelines

### Before Submitting

- [ ] All tests pass (`npm test`)
- [ ] No linting errors (`npm run lint`)
- [ ] Type checking passes (`npm run typecheck`)
- [ ] Code is properly formatted
- [ ] Commit messages are descriptive
- [ ] Documentation is updated if needed

### PR Description

Include:
- **What**: Brief description of changes
- **Why**: Reason for the changes
- **How**: Implementation approach
- **Testing**: How you tested the changes
- **Screenshots**: If UI changes (N/A for this project)

### Example PR Description

```markdown
## What
Add support for JPEG output format

## Why
Users requested ability to generate JPEG images for smaller file sizes

## How
- Extended ImageGenerationSchema to accept 'jpeg' format
- Updated Azure API calls to support JPEG conversion
- Added output format handling in file persistence

## Testing
- Added unit tests for JPEG format validation
- Manually tested JPEG generation with various prompts
- Verified metadata includes correct MIME type
```

## Feature Requests

For new features:
1. Open an issue first to discuss the proposal
2. Wait for maintainer feedback
3. Implement after approval
4. Submit PR with tests and documentation

## Bug Reports

When reporting bugs, include:
- **Description**: Clear description of the issue
- **Steps to Reproduce**: Detailed steps
- **Expected Behavior**: What should happen
- **Actual Behavior**: What actually happens
- **Environment**: Node version, OS, Azure region
- **Logs**: Relevant log output (redact secrets!)

## Commit Message Guidelines

Follow conventional commits format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Test additions or changes
- `chore`: Build process or tooling changes

**Examples:**
```
feat(tools): add JPEG output format support

Add support for generating JPEG images with configurable quality.
Implements feature request #123.

Closes #123
```

```
fix(service): handle rate limit errors correctly

Previously, rate limit errors were not properly detected.
Now properly catches 429 errors and provides retry suggestion.

Fixes #456
```

## Areas for Contribution

### High Priority

- [ ] SSE transport implementation
- [ ] Integration tests with mocked Azure API
- [ ] Retry logic with exponential backoff
- [ ] Progress notifications during generation
- [ ] Batch image generation support

### Medium Priority

- [ ] Support for image editing/inpainting
- [ ] Custom output file naming patterns
- [ ] Image storage to Azure Blob Storage
- [ ] Prometheus metrics export
- [ ] Docker container support

### Low Priority

- [ ] Multiple output format conversions
- [ ] Image thumbnail generation
- [ ] Metadata indexing/search
- [ ] Web UI for testing

## Questions?

- Open an issue with the `question` label
- Check existing issues and discussions
- Review the README and documentation

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
