# Contributing to OnePlayer

Thank you for your interest in contributing to OnePlayer! We welcome contributions from the community.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Coding Guidelines](#coding-guidelines)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)

---

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please read it before contributing.

---

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/teamOnePlayer/oneplayer.git`
3. Create a new branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Test your changes
6. Commit and push
7. Open a Pull Request

---

## How to Contribute

### Types of Contributions

- **Bug Fixes** - Fix issues and bugs
- **Features** - Add new features or enhance existing ones
- **Documentation** - Improve docs, examples, or comments
- **Tests** - Add or improve test coverage
- **Performance** - Optimize code for better performance

---

## Development Setup

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn
- A Lavalink server for testing

### Installation

```bash
# Clone the repository
git clone https://github.com/teamOnePlayer/oneplayer.git
cd oneplayer

# Install dependencies
npm install

# Run linting
npm run lint
```

### Project Structure

```
oneplayer/
├── build/
│   ├── core/       # Main client & plugin base
│   ├── network/    # Node, REST, Lavalink features
│   ├── player/     # Player, queue, tracks
│   ├── audio/      # Filters, effects, voice, TTS
│   └── plugins/    # Built-in plugins
├── examples/       # Example bots
└── package.json
```

---

## Pull Request Process

1. **Update Documentation** - Update README.md or DOCUMENTATION.md if needed
2. **Follow Code Style** - Ensure your code follows our coding guidelines
3. **Test Your Changes** - Make sure everything works correctly
4. **Write Clear Commits** - Use descriptive commit messages
5. **One Feature Per PR** - Keep pull requests focused on a single change
6. **Link Issues** - Reference any related issues in your PR description

### Commit Message Format

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style changes (formatting, etc.)
- `refactor` - Code refactoring
- `perf` - Performance improvements
- `test` - Adding or updating tests
- `chore` - Maintenance tasks

**Examples:**
```
feat(filters): add new reverb filter
fix(player): resolve connection timeout issue
docs(readme): update installation instructions
```

---

## Coding Guidelines

### JavaScript Style

- Use ES6+ features
- Use `const` and `let`, avoid `var`
- Use async/await over callbacks
- Use meaningful variable and function names
- Add JSDoc comments for public methods

### Code Format

```javascript
/**
 * Description of the method
 * @param {string} param1 - Description
 * @param {Object} options - Options object
 * @returns {Promise<Object>}
 */
async methodName(param1, options = {}) {
  // Implementation
}
```

### File Naming

- Use PascalCase for class files: `Player.js`, `Filters.js`
- Use camelCase for utility files: `helpers.js`
- Use kebab-case for config files: `eslint-config.js`

### Best Practices

- Keep functions small and focused
- Handle errors appropriately
- Avoid deeply nested code
- Use early returns when possible
- Add debug logging for important operations

---

## Reporting Bugs

### Before Reporting

1. Check existing issues to avoid duplicates
2. Make sure you're using the latest version
3. Try to reproduce the bug consistently

### Bug Report Template

```markdown
**Description**
A clear description of the bug.

**Steps to Reproduce**
1. Step one
2. Step two
3. Step three

**Expected Behavior**
What you expected to happen.

**Actual Behavior**
What actually happened.

**Environment**
- OnePlayer version:
- Node.js version:
- Lavalink version:
- Discord.js version:
- OS:

**Additional Context**
Any other relevant information, logs, or screenshots.
```

---

## Suggesting Features

### Before Suggesting

1. Check if the feature already exists
2. Check existing feature requests
3. Consider if it fits the project scope

### Feature Request Template

```markdown
**Description**
A clear description of the feature.

**Use Case**
Why this feature would be useful.

**Proposed Solution**
How you think it should work.

**Alternatives Considered**
Any alternative solutions you've considered.

**Additional Context**
Any other relevant information.
```

---

## Questions?

If you have questions about contributing, feel free to:

- Open a discussion on GitHub
- Ask in the issues section

---

## Recognition

Contributors will be recognized in our README.md. Thank you for helping make OnePlayer better!

---

## License

By contributing to OnePlayer, you agree that your contributions will be licensed under the MIT License.