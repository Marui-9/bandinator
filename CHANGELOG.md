# Team-Wiki Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-10-19

### Added - UX Enhancements

- **Interactive Dashboard**: Transformed homepage into live dashboard with recent documents, evaluations, and system stats
- **Chat Interface**: New `/chat` route for conversational knowledge base queries (mock AI, LLM-ready)
- **KB Search**: New `/kb-search` route for semantic search across documents and tenders with relevance scoring
- **Document Attributes**: Form-based tagging system (category, domain, project, version, tags)
- **Status Tracking**: Automatic evaluation status (pending → in-progress → complete) with visual indicators
- **Quick Actions**: Dashboard cards for common tasks (Upload, Evaluate, Search, Chat)
- **System Overview**: Real-time statistics cards (total docs, evaluations, average score)
- **API Endpoints**: `/api/kb/search` and `/api/kb/chat` for knowledge base interactions
- **Database Migration**: Script to upgrade existing databases (`pnpm migrate`)
- **Status Badges**: Color-coded status indicators throughout UI
- **Attribute Display**: Visual badges for document categories, domains, projects, and tags

### Changed

- Homepage redesigned as interactive dashboard with live data panels
- DocumentsPage includes upload form modal with attribute fields
- Tenders table: added `status` and `updated_at` columns
- Documents table: added `attributes` JSON column
- Analysis route: automatically updates tender status during evaluation
- Rules routes: reset tender status to pending when rules change
- Navigation: added Search and Chat menu items
- Document list: displays attribute badges (category, domain, project, tags)

### Enhanced

- Document upload captures rich metadata (category, domain, project, version, tags)
- Search results include relevance scoring and metadata
- Status updates automatically during evaluation lifecycle
- Rule modifications trigger status reset to pending

### Technical

- New backend route: `/routes/kb.ts` with search and chat endpoints
- New frontend pages: `ChatPage.tsx`, `KBSearchPage.tsx`
- Enhanced `HomePage.tsx` with dashboard components
- Database migration script: `migrate-db.js`
- LLM-ready architecture (prepared for OpenAI integration)
- Single-user mode (authentication-ready for future)

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
