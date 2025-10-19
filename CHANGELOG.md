# Bandinator Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-10-19

### Added
- Initial project setup with pnpm monorepo
- Backend API server with Express + TypeScript
- Frontend React application with Vite + TypeScript
- Document management system (upload, view, delete)
- Support for PDF, DOCX, and TXT file parsing
- Tender management (CRUD operations)
- Configurable rule engine with multiple rule types:
  - Keyword matching
  - Budget range validation
  - Document content checking
  - Custom rules
- Analysis engine with weighted scoring
- PDF report generation
- CSV export functionality
- SQLite database with full schema
- RESTful API endpoints
- Responsive UI with TailwindCSS
- Full-text search across documents
- Evidence tracking and linking
- Docker support with docker-compose
- GitHub Actions CI workflow
- ESLint + Prettier configuration
- Husky pre-commit hooks
- Comprehensive documentation

### Technical Details
- Node.js 20+ support
- TypeScript 5.3+
- React 18
- Express 4
- SQLite 3
- Vite 5
- TailwindCSS 3

### Documentation
- README.md with project overview
- SETUP.md with installation instructions
- DEVELOPMENT.md with architecture and guides
- Inline code comments
- API endpoint documentation
