# Contributing to Docker Manager

Thank you for your interest in contributing to Docker Manager! This document provides guidelines and instructions for contributing.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/docker-manager.git`
3. Create a new branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Test your changes
6. Commit your changes: `git commit -am 'Add some feature'`
7. Push to the branch: `git push origin feature/your-feature-name`
8. Submit a pull request

## Development Setup

### Prerequisites
- Docker 24.0+
- Docker Compose 2.20+
- Go 1.21+ (for backend development)
- Node.js 18+ (for frontend development)
- PostgreSQL 15+

### Backend Development

```bash
cd backend

# Install dependencies
go mod download

# Run database migrations
go run cmd/server/main.go

# Run tests
go test ./...

# Run linter
golangci-lint run
```

### Frontend Development

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start

# Run tests
npm test

# Build for production
npm run build
```

## Code Style

### Go
- Follow standard Go formatting: `go fmt`
- Use `golangci-lint` for linting
- Write meaningful comments for exported functions
- Keep functions small and focused

### TypeScript/React
- Use TypeScript for type safety
- Follow React best practices
- Use functional components with hooks
- Write meaningful component and function names

## Commit Messages

Follow conventional commits:
- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation changes
- `style:` for formatting changes
- `refactor:` for code refactoring
- `test:` for adding tests
- `chore:` for maintenance tasks

Example: `feat: add container auto-scaling support`

## Testing

- Write unit tests for new features
- Ensure all tests pass before submitting PR
- Aim for good test coverage
- Test edge cases

## Documentation

- Update README.md if needed
- Document new features in ARCHITECTURE.md
- Add inline comments for complex logic
- Update API documentation

## Pull Request Process

1. Update the README.md or relevant documentation
2. Ensure all tests pass
3. Update the CHANGELOG.md
4. Request review from maintainers
5. Address review feedback
6. Ensure CI/CD passes

## Reporting Issues

- Use GitHub Issues
- Provide detailed description
- Include steps to reproduce
- Include error messages and logs
- Specify your environment (OS, Docker version, etc.)

## Feature Requests

- Open a GitHub Issue with label "enhancement"
- Describe the feature and its use case
- Explain why this feature would be useful
- Be open to discussion and feedback

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Help others learn and grow

## Questions?

Feel free to open an issue or reach out to the maintainers.

Thank you for contributing!
