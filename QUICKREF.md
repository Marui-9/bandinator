# Team-Wiki - Quick Reference

## 🚀 Quick Start Commands

```bash
# First time setup
./setup.sh

# Start development servers
pnpm dev

# Run tests
pnpm test

# Build for production
pnpm build

# Seed sample data
chmod +x seed-data.sh && ./seed-data.sh
```

## 📁 Project Structure

```
team-wiki/
├── packages/
│   ├── app-backend/       Backend API (http://localhost:3001)
│   └── app-frontend/      Frontend UI (http://localhost:3000)
├── data/                  SQLite database
├── uploads/               Uploaded documents
└── .env                   Configuration
```

## 🔗 API Endpoints

### Documents

- `POST /api/documents/upload` - Upload file
- `GET /api/documents` - List all
- `GET /api/documents/:id` - Get one
- `DELETE /api/documents/:id` - Delete
- `GET /api/documents/search?q=query` - Search

### Tenders

- `POST /api/tenders` - Create
- `GET /api/tenders` - List all
- `GET /api/tenders/:id` - Get one
- `PUT /api/tenders/:id` - Update
- `DELETE /api/tenders/:id` - Delete

### Rules

- `POST /api/rules` - Create
- `GET /api/rules` - List all
- `GET /api/rules/:id` - Get one
- `PUT /api/rules/:id` - Update
- `DELETE /api/rules/:id` - Delete

### Analysis

- `POST /api/analysis/run/:tenderId` - Run analysis
- `GET /api/analysis/tender/:tenderId` - Get results
- `GET /api/analysis/:id` - Get one result

### Export

- `GET /api/export/pdf/:analysisId` - PDF report
- `GET /api/export/csv/:analysisId` - CSV export

## 🎯 Rule Types

| Type       | Condition Format         | Example                      |
| ---------- | ------------------------ | ---------------------------- |
| `keyword`  | Comma-separated keywords | `software,development,agile` |
| `budget`   | Range: `min-max`         | `10000-50000`                |
| `document` | Keywords in docs         | `certification,compliance`   |
| `custom`   | Any text                 | `custom condition`           |

## 💻 Development Commands

```bash
# Backend only
cd packages/app-backend
pnpm dev

# Frontend only
cd packages/app-frontend
pnpm dev

# Run backend tests
pnpm --filter app-backend test

# Run frontend tests
pnpm --filter app-frontend test

# Lint specific package
pnpm --filter app-backend lint

# Format code
pnpm format
```

## 🐳 Docker Commands

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down

# Rebuild
docker-compose up -d --build
```

## 🗄️ Database Commands

```bash
# Open database
sqlite3 data/team-wiki.db

# Common queries
.tables                           # List tables
SELECT * FROM documents;          # View documents
SELECT * FROM tenders;            # View tenders
SELECT * FROM rules;              # View rules
SELECT * FROM analysis_results;   # View analyses
.quit                             # Exit
```

## 🔧 Troubleshooting

### Port already in use

```bash
# Kill process on port 3001 (backend)
lsof -ti:3001 | xargs kill -9

# Kill process on port 3000 (frontend)
lsof -ti:3000 | xargs kill -9
```

### Clear and reinstall

```bash
rm -rf node_modules packages/*/node_modules
pnpm install
```

### Reset database

```bash
rm data/team-wiki.db
pnpm dev  # Database will be recreated
```

### Clear uploads

```bash
rm -rf uploads/*
```

## 📊 Workflow Example

1. **Upload Documents** (Documents page)
   - Upload PDFs, DOCX, or TXT files
   - Content is automatically parsed and indexed

2. **Configure Rules** (Rules page)
   - Create keyword, budget, or document rules
   - Set weights (importance) for each rule
   - Enable/disable as needed

3. **Create Tender** (Tenders page)
   - Add title, reference, deadline, budget
   - Describe requirements

4. **Run Analysis** (Analysis page)
   - Select tender
   - Click "Run Analysis"
   - View feasibility score and evidence

5. **Export Results**
   - Download PDF report
   - Download CSV for spreadsheet

## 🎨 UI Routes

- `/` - Home page with overview
- `/documents` - Document management
- `/tenders` - Tender management
- `/rules` - Rule configuration
- `/analysis` - Run analysis and view results

## ⚙️ Configuration (.env)

```bash
# Backend
NODE_ENV=development
PORT=3001
CORS_ORIGIN=http://localhost:3000

# Database
DATABASE_URL=./data/team-wiki.db

# Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads

# Frontend
VITE_API_URL=http://localhost:3001
```

## 📚 Documentation

- `README.md` - Project overview
- `SETUP.md` - Installation guide
- `DEVELOPMENT.md` - Developer guide
- `CONTRIBUTING.md` - Contribution guidelines
- `CHANGELOG.md` - Version history

## 🧪 Testing

```bash
# All tests
pnpm test

# With coverage
pnpm test -- --coverage

# Watch mode
pnpm test -- --watch
```

## 🚢 Production Deployment

```bash
# Build all packages
pnpm build

# Run backend
cd packages/app-backend
node dist/index.js

# Serve frontend (use any static server)
cd packages/app-frontend
npx serve dist

# Or use Docker
docker-compose up -d
```

## 🔐 Security Notes

- Add authentication for production
- Set up SSL/TLS certificates
- Configure proper CORS origins
- Implement rate limiting
- Validate all user input
- Use secure file storage

## 🐛 Common Issues

1. **Module not found**: Run `pnpm install`
2. **Port in use**: Change port in `.env`
3. **Database locked**: Close other connections
4. **Upload fails**: Check `MAX_FILE_SIZE` in `.env`
5. **Tests fail**: Ensure all dependencies installed

## 📞 Support

- Check documentation first
- Search existing issues
- Create new issue with details
- Include error logs and environment info

---

**Quick Links:**

- Backend: http://localhost:3001
- Frontend: http://localhost:3000
- API Health: http://localhost:3001/health
