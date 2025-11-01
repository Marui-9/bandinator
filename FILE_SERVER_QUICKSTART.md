# File Server Connector & RAG System - Quick Start

## Overview

Team-Wiki now includes a **secure, read-only file server connector** with **RAG (Retrieval-Augmented Generation)** capabilities for intelligent document search and AI-powered question answering with citations.

## ✅ What's Been Implemented

### Backend (Complete)

1. **Database Schema** (`packages/app-backend/src/services/database.ts`)
   - `file_servers` table for connector configurations
   - `document_chunks` table for RAG embeddings
   - `sync_logs` table for audit trail
   - Extended `documents` table with connector metadata

2. **Encryption Service** (`packages/app-backend/src/services/encryption.ts`)
   - AES-256-GCM encryption for credentials
   - SHA-256 file hashing for integrity checking

3. **File Server Connector** (`packages/app-backend/src/services/connector.ts`)
   - Support for local and NFS file systems
   - Three scan modes: manual, scheduled, watch
   - File change detection with hash-based deduplication
   - Event-driven architecture for real-time processing

4. **RAG Service** (`packages/app-backend/src/services/rag.ts`)
   - OpenAI embeddings generation (text-embedding-3-small)
   - Document chunking with configurable size and overlap
   - Hybrid search: TF-IDF (30%) + vector similarity (70%)
   - AI-powered answer generation with citations (GPT-4)

5. **API Routes**
   - `POST /api/file-servers` - Create connector
   - `GET /api/file-servers` - List connectors
   - `POST /api/file-servers/:id/test` - Test connection
   - `POST /api/file-servers/:id/scan` - Trigger scan
   - `GET /api/file-servers/:id/logs` - View sync logs
   - `POST /api/chat/query` - Ask questions with RAG
   - `POST /api/chat/reindex` - Re-index all documents
   - `GET /api/chat/stats` - Get RAG statistics

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd packages/app-backend
pnpm install
```

### 2. Configure Environment

```bash
# Copy example env file
cp .env.example .env

# Generate encryption key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Edit .env and set:
ENCRYPTION_KEY=<your-generated-key>
OPENAI_API_KEY=<your-openai-api-key>  # Optional but recommended
```

### 3. Start the Backend

```bash
pnpm dev
```

The database will automatically create the new tables on first run.

## 📖 Usage Examples

### Create a File Server Connector

```bash
curl -X POST http://localhost:3001/api/file-servers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Project Documents",
    "protocol": "local",
    "base_path": "/path/to/your/documents",
    "scan_mode": "manual",
    "include_patterns": ["**/*.pdf", "**/*.docx", "**/*.txt"],
    "exclude_patterns": ["**/node_modules/**", "**/.git/**"],
    "enabled": true
  }'
```

**Response:**

```json
{
  "id": 1,
  "message": "File server connector created successfully"
}
```

### Test Connection

```bash
curl -X POST http://localhost:3001/api/file-servers/1/test
```

**Response:**

```json
{
  "success": true,
  "message": "Connected, found 42 items"
}
```

### Trigger Manual Scan

```bash
curl -X POST http://localhost:3001/api/file-servers/1/scan
```

**Response:**

```json
{
  "message": "Scan completed",
  "stats": {
    "scanned": 42,
    "added": 38,
    "updated": 4,
    "errors": []
  }
}
```

### Ask a Question with RAG

```bash
curl -X POST http://localhost:3001/api/chat/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is Team-Wiki used for?",
    "limit": 10
  }'
```

**Response:**

```json
{
  "query": "What is Team-Wiki used for?",
  "answer": "Team-Wiki is a demo web application for tender document analysis with automated feasibility scoring [1]. It allows users to upload documents, create tenders, configure analysis rules, and generate PDF/CSV reports [1].",
  "citations": [
    {
      "documentId": 1,
      "chunkId": 5,
      "filePath": "README.md",
      "title": "README.md",
      "page": null,
      "paragraph": null,
      "excerpt": "Team-Wiki is a demo web application for tender document analysis...",
      "score": 0.95
    }
  ],
  "resultsCount": 10
}
```

### View Sync Logs

```bash
curl http://localhost:3001/api/file-servers/1/logs
```

**Response:**

```json
[
  {
    "id": 1,
    "connector_id": 1,
    "status": "completed",
    "files_scanned": 42,
    "files_added": 38,
    "files_updated": 4,
    "files_deleted": 0,
    "errors": [],
    "started_at": "2025-11-01T10:30:00.000Z",
    "completed_at": "2025-11-01T10:32:15.000Z"
  }
]
```

### Get RAG Statistics

```bash
curl http://localhost:3001/api/chat/stats
```

**Response:**

```json
{
  "totalDocuments": 38,
  "totalChunks": 342,
  "averageChunksPerDocument": 9
}
```

## 🔧 Configuration Options

### File Server Connector

| Field              | Type    | Required | Description                              |
| ------------------ | ------- | -------- | ---------------------------------------- |
| `name`             | string  | Yes      | Display name for the connector           |
| `protocol`         | enum    | Yes      | `local`, `nfs`, or `smb` (SMB TBD)       |
| `base_path`        | string  | Yes      | Root directory path to scan              |
| `host`             | string  | No       | Server hostname (for SMB/NFS)            |
| `port`             | number  | No       | Server port (for SMB/NFS)                |
| `username`         | string  | No       | Authentication username                  |
| `password`         | string  | No       | Authentication password (encrypted)      |
| `include_patterns` | array   | No       | File patterns to include (default: all)  |
| `exclude_patterns` | array   | No       | File patterns to exclude                 |
| `scan_mode`        | enum    | No       | `manual`, `scheduled`, or `watch`        |
| `scan_interval`    | number  | No       | Seconds between scans (for scheduled)    |
| `enabled`          | boolean | No       | Enable/disable connector (default: true) |

### Scan Modes

- **manual**: Scan only when triggered via API
- **scheduled**: Automatic periodic scans (configurable interval)
- **watch**: Real-time monitoring with 30-second polling

### Supported File Types

- PDF (`.pdf`)
- Word Documents (`.docx`, `.doc`)
- Text Files (`.txt`)
- Markdown (`.md`)

## 🔒 Security Features

### Implemented

✅ **Read-Only Access** - Connectors never write to file systems  
✅ **Encrypted Credentials** - AES-256-GCM encryption at rest  
✅ **File Type Whitelist** - Only allowed document types processed  
✅ **Hash Validation** - SHA-256 for file integrity checking  
✅ **Path Validation** - Prevents directory traversal attacks

### Recommended for Production

🔐 **Authentication** - Add user auth middleware  
🔐 **Rate Limiting** - Prevent API abuse  
🔐 **Audit Logging** - Log all sensitive operations  
🔐 **RBAC** - Role-based access control  
🔐 **API Key Rotation** - Regular OpenAI key rotation

## 📊 RAG Configuration

### Environment Variables

```bash
# Embedding model (1536 dimensions)
OPENAI_EMBEDDING_MODEL=text-embedding-3-small

# Chat model for answer generation
OPENAI_CHAT_MODEL=gpt-4-turbo-preview

# Chunking parameters
CHUNK_SIZE=512        # Words per chunk
CHUNK_OVERLAP=50      # Overlapping words between chunks
```

### Hybrid Search Scoring

The RAG service uses a hybrid approach:

- **70%** - Vector similarity (cosine distance between embeddings)
- **30%** - TF-IDF (keyword matching)

This balances semantic understanding with exact keyword matching.

### How RAG Works

1. **Indexing Phase:**
   - Document is split into overlapping chunks
   - Each chunk generates an embedding (1536-dim vector)
   - Chunks stored in database with embeddings

2. **Query Phase:**
   - User question generates query embedding
   - Hybrid search finds most relevant chunks
   - Top chunks sent to GPT-4 as context
   - GPT-4 generates answer with citations

## 🧪 Testing the System

### 1. Create Test Documents

```bash
mkdir -p ./test-docs
cat > ./test-docs/overview.txt << 'EOF'
Team-Wiki is a comprehensive document analysis platform.
It supports tender management, feasibility scoring, and RAG-based search.
EOF

cat > ./test-docs/features.md << 'EOF'
# Key Features
- Document ingestion (PDF, DOCX, TXT)
- AI-powered analysis
- Automated feasibility scoring
- Export to PDF and CSV
EOF
```

### 2. Configure Connector

```bash
curl -X POST http://localhost:3001/api/file-servers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Docs",
    "protocol": "local",
    "base_path": "./test-docs",
    "scan_mode": "manual"
  }'
```

### 3. Scan Files

```bash
curl -X POST http://localhost:3001/api/file-servers/1/scan
```

### 4. Test RAG Query

```bash
curl -X POST http://localhost:3001/api/chat/query \
  -H "Content-Type: application/json" \
  -d '{"query": "What are the key features?"}'
```

## 🎯 Next Steps (Frontend Implementation Needed)

### File Server Admin Panel

- Create `/src/pages/FileServersPage.tsx`
- Form for adding/editing connectors
- List view with status indicators
- Test connection and scan buttons
- Sync log viewer

### Enhanced Documents Page

- Add source column (upload vs connector)
- Show file path for connector documents
- Filter by source type
- Re-index button for individual docs

### Chat Interface with Citations

- Create `/src/pages/ChatPage.tsx` (enhance existing)
- Display AI responses with inline citations
- Citation cards with document metadata
- Click to open document viewer
- Show relevance scores

### Document Viewer

- PDF viewer with highlighting
- DOCX/text viewer
- Jump to specific page/paragraph
- Breadcrumb navigation

## 📚 API Reference

Full API documentation available in `FILE_SERVER_RAG_IMPLEMENTATION.md`.

## 🐛 Troubleshooting

### "Cannot find module 'openai'"

```bash
cd packages/app-backend
pnpm install openai natural
```

### "Decryption failed"

Ensure `ENCRYPTION_KEY` is consistent and 64 hex characters.

### "No embeddings generated"

Check `OPENAI_API_KEY` is set correctly in `.env`.

### Database Schema Issues

Delete `data/team-wiki.db` and restart to recreate tables.

## 📖 Related Documentation

- [FILE_SERVER_RAG_IMPLEMENTATION.md](./FILE_SERVER_RAG_IMPLEMENTATION.md) - Complete implementation guide
- [SETUP.md](./SETUP.md) - General setup instructions
- [DEVELOPMENT.md](./DEVELOPMENT.md) - Development workflow

## 🎉 Summary

You now have a fully functional backend for:

✅ Secure file server connectivity (local/NFS)  
✅ Automated document ingestion and indexing  
✅ RAG-powered search with hybrid scoring  
✅ AI question answering with citations  
✅ Encrypted credential storage  
✅ Comprehensive audit logging

The frontend UI components (admin panel, chat interface, document viewer) are the final step to complete the user-facing experience!
