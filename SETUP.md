# Setup Instructions for Bandinator

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 20+ ([Download](https://nodejs.org/))
- **pnpm** 8+ (will be installed automatically by setup script, or install with `npm install -g pnpm`)
- **Git** (for version control)

## Quick Start

### 1. Install Node.js

If you don't have Node.js 20+ installed:

**Linux/macOS:**
```bash
# Using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20
```

**Windows:**
Download from [nodejs.org](https://nodejs.org/)

### 2. Run Setup Script

```bash
# Make the setup script executable
chmod +x setup.sh

# Run the setup script
./setup.sh
```

The setup script will:
- Check Node.js version
- Install pnpm globally
- Install all project dependencies
- Set up Husky git hooks
- Create necessary directories
- Copy environment configuration

### 3. Configure Environment

Edit the `.env` file (created from `.env.example`) with your settings:

```bash
# Backend Configuration
NODE_ENV=development
PORT=3001
CORS_ORIGIN=http://localhost:3000

# Database
DATABASE_URL=./data/bandinator.db

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads

# Frontend
VITE_API_URL=http://localhost:3001
```

### 4. Start Development Servers

```bash
# Start both backend and frontend in development mode
pnpm dev
```

This will start:
- **Backend API** at http://localhost:3001
- **Frontend** at http://localhost:3000

## Manual Setup (Alternative)

If the setup script doesn't work, follow these steps:

### 1. Install pnpm

```bash
npm install -g pnpm
```

### 2. Install Dependencies

```bash
# Install all workspace dependencies
pnpm install
```

### 3. Setup Husky

```bash
# Initialize Husky for git hooks
pnpm prepare

# Make hooks executable
chmod +x .husky/pre-commit
chmod +x .husky/pre-push
```

### 4. Create Directories

```bash
mkdir -p data uploads
```

### 5. Configure Environment

```bash
cp .env.example .env
# Edit .env with your preferred editor
```

### 6. Start Development

```bash
pnpm dev
```

## Available Commands

From the root directory:

```bash
# Development
pnpm dev              # Start all services in development mode
pnpm dev:backend      # Start only backend
pnpm dev:frontend     # Start only frontend

# Building
pnpm build            # Build all packages
pnpm build:backend    # Build only backend
pnpm build:frontend   # Build only frontend

# Testing
pnpm test             # Run all tests
pnpm test:backend     # Run backend tests
pnpm test:frontend    # Run frontend tests

# Code Quality
pnpm lint             # Lint all packages
pnpm format           # Format code with Prettier

# Production
docker-compose up -d  # Run in Docker containers
```

## Project Structure

```
bandinator/
├── packages/
│   ├── app-backend/          # Express API server
│   │   ├── src/
│   │   │   ├── routes/       # API endpoints
│   │   │   ├── services/     # Business logic
│   │   │   └── index.ts      # Server entry point
│   │   └── tests/
│   └── app-frontend/         # React application
│       ├── src/
│       │   ├── components/
│       │   ├── pages/
│       │   ├── utils/
│       │   └── App.tsx
│       └── tests/
├── data/                     # SQLite database (created on first run)
├── uploads/                  # Uploaded documents (created on first run)
├── .github/workflows/        # CI/CD configuration
├── docker-compose.yml        # Docker setup
└── README.md
```

## Development Workflow

1. **Upload Documents**: Go to Documents page, upload PDF/DOCX/TXT files
2. **Configure Rules**: Create rules in the Rules page (keyword, budget, document checks)
3. **Create Tenders**: Add tender opportunities with requirements
4. **Run Analysis**: Select a tender and run analysis to get feasibility score
5. **Export Results**: Download analysis as PDF or CSV

## Troubleshooting

### Port Already in Use

If ports 3000 or 3001 are already in use:

```bash
# Change ports in .env
PORT=3002                    # For backend
VITE_API_URL=http://localhost:3002  # Update frontend to match
```

Then start with custom port:
```bash
# Frontend will use PORT from vite.config.ts
pnpm dev
```

### Database Issues

Delete and recreate the database:

```bash
rm data/bandinator.db
pnpm dev  # Database will be recreated
```

### Dependencies Issues

Clear and reinstall:

```bash
pnpm clean
rm -rf node_modules packages/*/node_modules
pnpm install
```

## Testing

### Backend Tests

```bash
cd packages/app-backend
pnpm test
```

### Frontend Tests

```bash
cd packages/app-frontend
pnpm test
```

## Production Deployment

### Using Docker

```bash
# Build and start containers
docker-compose up -d

# View logs
docker-compose logs -f

# Stop containers
docker-compose down
```

### Manual Deployment

```bash
# Build all packages
pnpm build

# Start backend
cd packages/app-backend
node dist/index.js

# Serve frontend (use any static file server)
cd packages/app-frontend
npx serve dist
```

## Support

For issues or questions:
- Check existing issues in the repository
- Review the documentation
- Create a new issue with detailed information

## License

MIT - See LICENSE file for details
