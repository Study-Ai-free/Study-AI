# Contributing to AI-Powered Study Assistant

We welcome contributions to the AI-Powered Study Assistant! This document provides guidelines for contributing to the project.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally
3. **Set up the development environment** following the README instructions
4. **Create a new branch** for your feature or bugfix

## Development Setup

### Prerequisites
- Node.js 18+ or Python 3.9+
- PostgreSQL 14+
- Git

### Environment Setup
```bash
# Backend setup
cd backend
npm install
cp .env.example .env
# Configure your environment variables

# Frontend setup
cd frontend
npm install

# Database setup
cd database
# Run schema.sql and sample_data.sql
```

## Code Style

### Backend (Node.js)
- Use ESLint configuration provided
- Follow conventional commit messages
- Write tests for new API endpoints
- Use async/await for asynchronous operations

### Frontend (React/TypeScript)
- Use TypeScript strict mode
- Follow React hooks patterns
- Use Material-UI components consistently
- Write unit tests for components

### AI Engine
- Always use the ProviderManager for AI operations
- Implement proper error handling and fallbacks
- Document AI prompt engineering decisions

## Pull Request Process

1. **Update documentation** if you've changed APIs or added features
2. **Add tests** for new functionality
3. **Ensure all tests pass** (`npm test` in relevant directories)
4. **Update the README** if you've added dependencies or changed setup
5. **Create a pull request** with a clear description of changes

## Bug Reports

When filing a bug report, please include:
- **Clear description** of the issue
- **Steps to reproduce** the bug
- **Expected vs actual behavior**
- **Environment details** (OS, Node version, etc.)
- **Error logs** if applicable

## Feature Requests

For new features:
- **Describe the use case** and problem being solved
- **Explain the proposed solution**
- **Consider impact** on existing functionality
- **Discuss alternatives** you've considered

## Code Review Guidelines

- Be respectful and constructive
- Focus on code quality and maintainability
- Consider performance implications
- Ensure security best practices
- Verify accessibility standards

## Questions?

Feel free to open an issue for questions about contributing or join our discussions!

Thank you for contributing! 🚀