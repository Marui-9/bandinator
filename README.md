# Team-Wiki

> Demo web app for tender document analysis with feasibility scoring

## Overview

Team-Wiki ingests documents, indexes a searchable knowledge base, parses tenders, runs configurable rules to produce a feasibility score with evidence links, and exports results as PDF and CSV.

## Features

- 📄 Document ingestion (PDF, DOCX, TXT)
- 🔍 Searchable knowledge base
- 📊 Tender parsing and analysis
- ⚙️ Configurable rule engine
- 📈 Feasibility scoring with evidence links
- 📋 One-page PDF report generation
- 📁 CSV export

## Tech Stack

- **Frontend**: React + TypeScript + Vite + TailwindCSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: SQLite (easy demo, can scale to PostgreSQL)
- **Search**: Simple text search (can integrate vector search)
- **PDF Generation**: PDFKit
- **Document Parsing**: pdf-parse, mammoth

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 8+ (or npm)

### Installation

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env

# Start development servers (backend + frontend)
pnpm dev
```

The app will be available at:

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

### Production Build

```bash
# Build all packages
pnpm build

# Using Docker
docker-compose up -d
```

## Project Structure

```
team-wiki/
├── packages/
│   ├── app-backend/          # Express API server
│   │   ├── src/
│   │   │   ├── routes/       # API routes
│   │   │   ├── services/     # Business logic
│   │   │   ├── models/       # Data models
│   │   │   └── utils/        # Utilities
│   │   └── tests/
│   └── app-frontend/         # React frontend
│       ├── src/
│       │   ├── components/   # React components
│       │   ├── pages/        # Page components
│       │   ├── hooks/        # Custom hooks
│       │   └── utils/        # Utilities
│       └── tests/
├── .github/
│   └── workflows/            # CI/CD
├── docker-compose.yml
├── package.json
└── README.md
```

## Development

```bash
# Run tests
pnpm test

# Lint code
pnpm lint

# Format code
pnpm format
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## License

MIT - see LICENSE file for details
