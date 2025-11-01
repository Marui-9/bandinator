# File Server Connector with RAG - Implementation Guide

## Overview

This document describes the complete implementation of a secure, read-only file server connector with RAG (Retrieval-Augmented Generation) capabilities and document citations for the Team-Wiki application.

## ✅ Completed Components

### 1. Database Schema Extensions (`/packages/app-backend/src/services/database.ts`)

**New Tables:**

- `file_servers` - Connector configurations with encrypted credentials
- `document_chunks` - Text chunks for RAG with embeddings
- `sync_logs` - Audit trail of connector sync operations

**Extended Tables:**

- `documents` - Added: `source_type`, `source_host`, `file_hash`, `last_modified`, `connector_id`

**Indexes:**

- Performance indexes on `file_hash`, `connector_id`, `document_id`

### 2. Encryption Service (`/packages/app-backend/src/services/encryption.ts`)

**Features:**

- AES-256-GCM encryption for credentials
- SHA-256 file hashing for integrity checking
- Secure key management via environment variables
- Auth tag validation for data integrity

### 3. File Server Connector (`/packages/app-backend/src/services/connector.ts`)

**Supported Protocols:**

- ✅ Local filesystem
- ✅ NFS (treated as local mount)
- ⏳ SMB (placeholder for future implementation)

**Scan Modes:**

- `manual` - On-demand scanning only
- `scheduled` - Periodic scans (configurable interval)
- `watch` - Real-time monitoring via polling (30s intervals)

**Security Features:**

- Read-only access enforcement
- File type whitelist (.pdf, .docx, .doc, .txt, .md)
- Include/exclude pattern support
- Directory traversal protection

**Key Methods:**

- `testConnection()` - Validate connector configuration
- `scan()` - Perform full filesystem scan
- `start()` - Begin monitoring based on scan_mode
- `stop()` - Gracefully shutdown connector

**Events Emitted:**

- `file` - New/changed/deleted file detected
- `scan-complete` - Scan finished successfully
- `scan-error` - Scan encountered errors
- `started`/`stopped` - Connector lifecycle events

### 4. Updated Dependencies (`/packages/app-backend/package.json`)

**Added:**

- `chokidar` - File system watching (for future enhancement)
- `natural` - TF-IDF and NLP processing
- `langchain` - RAG framework and embeddings
- `openai` - AI completions and embeddings API

## 🚧 Next Steps - Implementation Required

### 5. RAG Service (`/packages/app-backend/src/services/rag.ts`)

```typescript
// Pseudo-code structure
export class RAGService {
  // Generate embeddings for document chunks
  async generateEmbeddings(text: string): Promise<number[]>;

  // Create chunks from document with metadata
  async chunkDocument(documentId: number, content: string): Promise<void>;

  // Hybrid search: TF-IDF + vector similarity
  async search(query: string, limit: number): Promise<SearchResult[]>;

  // Generate AI response with citations
  async generateAnswer(
    query: string,
    context: SearchResult[]
  ): Promise<{
    answer: string;
    citations: Citation[];
  }>;
}

interface Citation {
  documentId: number;
  chunkId: number;
  filePath: string;
  title: string;
  pageNumber?: number;
  excerpt: string;
  relevanceScore: number;
}
```

**Implementation Notes:**

- Use OpenAI `text-embedding-3-small` for embeddings
- Store embeddings as BLOB in SQLite (or migrate to pgvector)
- Chunk size: 512 tokens with 50 token overlap
- Hybrid scoring: 0.3 _ TF-IDF + 0.7 _ cosine_similarity

### 6. Enhanced Ingestion Pipeline (`/packages/app-backend/src/services/ingestion.ts`)

```typescript
export class IngestionService {
  // Process file from connector
  async processConnectorFile(
    connectorId: number,
    filePath: string,
    hash: string,
    buffer: Buffer
  ): Promise<number>;

  // Check if file needs reindexing
  async needsReindex(filePath: string, hash: string): Promise<boolean>;

  // Update existing document
  async updateDocument(documentId: number, content: string): Promise<void>;

  // Delete stale documents
  async cleanupDeletedFiles(connectorId: number, currentFiles: string[]): Promise<void>;
}
```

### 7. API Routes for File Server Management

**`/packages/app-backend/src/routes/fileServers.ts`:**

```typescript
// POST /api/file-servers - Create connector
router.post('/', async (req, res) => {
  const { name, protocol, base_path, username, password, ... } = req.body;
  // Encrypt password before storing
  const encrypted_password = encrypt(password);
  // Insert into file_servers table
});

// GET /api/file-servers - List connectors
router.get('/', async (req, res) => {
  // Return connectors (decrypt passwords for display as masked)
});

// POST /api/file-servers/:id/test - Test connection
router.post('/:id/test', async (req, res) => {
  const connector = new FileServerConnector(config);
  const result = await connector.testConnection();
  res.json(result);
});

// POST /api/file-servers/:id/scan - Trigger manual scan
router.post('/:id/scan', async (req, res) => {
  const connector = connectorManager.getConnector(id);
  const stats = await connector.scan();
  res.json(stats);
});

// GET /api/file-servers/:id/logs - View sync logs
router.get('/:id/logs', async (req, res) => {
  // Query sync_logs table
});
```

### 8. API Routes for RAG Chat

**`/packages/app-backend/src/routes/chat.ts`:**

```typescript
// POST /api/chat/query - Ask question with RAG
router.post('/query', async (req, res) => {
  const { query } = req.body;

  // 1. Search for relevant chunks
  const results = await ragService.search(query, 10);

  // 2. Generate answer with citations
  const { answer, citations } = await ragService.generateAnswer(query, results);

  res.json({
    query,
    answer,
    citations: citations.map(c => ({
      documentId: c.documentId,
      filePath: c.filePath,
      title: c.title,
      page: c.pageNumber,
      excerpt: c.excerpt,
      score: c.relevanceScore,
    })),
  });
});

// GET /api/chat/history - Get chat history (optional)
```

### 9. Frontend - File Server Admin Panel

**`/packages/app-frontend/src/pages/FileServersPage.tsx`:**

```tsx
// Features:
// - List of configured connectors with status
// - Add/Edit connector form:
//   - Protocol selector (local/nfs/smb)
//   - Path input with validation
//   - Credentials (masked password input)
//   - Include/exclude patterns (textarea)
//   - Scan mode selector
//   - Schedule interval (for scheduled mode)
// - Action buttons per connector:
//   - Test Connection (shows success/error modal)
//   - Scan Now (shows progress + results)
//   - View Logs (opens sync log modal)
//   - Enable/Disable toggle
//   - Delete (with confirmation)
```

**Key UI Components:**

```tsx
<FileServerForm
  onSubmit={handleSubmit}
  onTest={handleTestConnection}
/>

<FileServerList
  servers={servers}
  onScan={handleScan}
  onViewLogs={handleViewLogs}
  onToggle={handleToggle}
  onDelete={handleDelete}
/>

<SyncLogModal
  connectorId={selectedId}
  logs={syncLogs}
  onClose={handleClose}
/>
```

### 10. Frontend - Enhanced Documents Page

**Updates to `/packages/app-frontend/src/pages/DocumentsPage.tsx`:**

```tsx
// Add columns to documents table:
// - Source (upload | connector_name)
// - File Path (for connector docs)
// - Last Modified
// - Status indicator (synced | outdated | error)

// Add filter options:
// - Filter by source type
// - Filter by connector
// - Search by file path

// Document row actions:
// - View (opens preview modal)
// - Re-index (for connector docs)
// - Delete
```

### 11. Frontend - Chat/RAG Interface

**`/packages/app-frontend/src/pages/ChatPage.tsx`:**

```tsx
export function ChatPage() {
  return (
    <div className="flex flex-col h-full">
      {/* Chat history */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => (
          <ChatMessage key={msg.id} message={msg} citations={msg.citations} />
        ))}
      </div>

      {/* Input area */}
      <ChatInput onSubmit={handleSubmit} />
    </div>
  );
}

function ChatMessage({ message, citations }) {
  return (
    <div className="message">
      <div className="text">{message.answer}</div>

      {/* Citation cards */}
      {citations.length > 0 && (
        <div className="citations mt-3 space-y-2">
          <div className="text-sm text-gray-600">Sources:</div>
          {citations.map(citation => (
            <CitationCard
              key={citation.documentId}
              citation={citation}
              onClick={() => openDocumentViewer(citation)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CitationCard({ citation, onClick }) {
  return (
    <div
      className="citation-card border rounded p-3 cursor-pointer hover:bg-gray-50"
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="font-medium">{citation.title}</div>
          <div className="text-sm text-gray-600">{citation.filePath}</div>
          {citation.page && <div className="text-xs text-gray-500">Page {citation.page}</div>}
          <div className="text-sm mt-2 text-gray-700">"{citation.excerpt}..."</div>
        </div>
        <div className="ml-3 text-xs text-gray-500">{Math.round(citation.score * 100)}% match</div>
      </div>
    </div>
  );
}
```

### 12. Document Viewer with Anchoring

**`/packages/app-frontend/src/components/DocumentViewer.tsx`:**

```tsx
// Features:
// - PDF viewer (using react-pdf or pdf.js)
// - DOCX viewer (convert to HTML or use mammoth)
// - Text viewer
// - Highlight functionality for excerpt location
// - Jump to page/paragraph from citation
// - Breadcrumb showing: file path > page > location
```

## Configuration

### Environment Variables (`.env`)

```bash
# Encryption
ENCRYPTION_KEY=<64-char-hex-string>

# OpenAI for RAG
OPENAI_API_KEY=sk-...
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
OPENAI_CHAT_MODEL=gpt-4-turbo-preview

# RAG Settings
CHUNK_SIZE=512
CHUNK_OVERLAP=50
MAX_RESULTS=10
```

## Security Considerations

### ✅ Implemented:

1. **Read-only access** - Connector only reads files, never writes
2. **Credential encryption** - AES-256-GCM for passwords at rest
3. **File type whitelist** - Only allowed document types processed
4. **Path validation** - Prevent directory traversal attacks

### 🔒 Recommended:

1. **Authentication** - Add user auth before exposing chat endpoint
2. **Rate limiting** - Prevent abuse of AI endpoints
3. **Input sanitization** - Validate all user inputs
4. **Audit logging** - Log all connector actions and queries
5. **API key rotation** - Regular rotation of OpenAI keys
6. **RBAC** - Role-based access to connectors and documents

## Testing the Implementation

### 1. Test File Server Connector

```bash
# Create test directory structure
mkdir -p ./test-documents
echo "Test content" > ./test-documents/test.txt
echo "# Markdown test" > ./test-documents/test.md

# Configure connector via API
curl -X POST http://localhost:3001/api/file-servers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Local Test",
    "protocol": "local",
    "base_path": "/path/to/test-documents",
    "scan_mode": "manual",
    "include_patterns": ["**/*"],
    "exclude_patterns": ["**/node_modules/**"]
  }'

# Test connection
curl -X POST http://localhost:3001/api/file-servers/1/test

# Trigger scan
curl -X POST http://localhost:3001/api/file-servers/1/scan
```

### 2. Test RAG Chat

```bash
# Ask a question
curl -X POST http://localhost:3001/api/chat/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is the project about?"
  }'

# Expected response:
# {
#   "query": "What is the project about?",
#   "answer": "Based on the documents...",
#   "citations": [
#     {
#       "documentId": 1,
#       "filePath": "README.md",
#       "title": "README.md",
#       "page": null,
#       "excerpt": "Team-Wiki is a demo web application...",
#       "score": 0.95
#     }
#   ]
# }
```

## Performance Optimization

1. **Batch Embeddings** - Generate embeddings for multiple chunks in parallel
2. **Cache Results** - Cache search results for common queries
3. **Index Optimization** - Add GIN/GiST indexes if using PostgreSQL
4. **Lazy Loading** - Only load embeddings for top-k results
5. **Async Processing** - Queue heavy operations (embedding generation)

## Migration Path

### Current (MVP): SQLite

- Stores embeddings as BLOB
- Uses cosine similarity in application code
- Good for demos and small datasets

### Future (Production): PostgreSQL + pgvector

```sql
-- Migration script
CREATE EXTENSION vector;

ALTER TABLE document_chunks
  ADD COLUMN embedding vector(1536);

CREATE INDEX ON document_chunks
  USING ivfflat (embedding vector_cosine_ops);
```

## Deployment Checklist

- [ ] Set `ENCRYPTION_KEY` in production environment
- [ ] Configure `OPENAI_API_KEY`
- [ ] Set up file server mount points (NFS/SMB)
- [ ] Configure connector credentials securely
- [ ] Set up monitoring for sync errors
- [ ] Enable rate limiting on chat endpoint
- [ ] Add authentication middleware
- [ ] Set up backup for document_chunks table
- [ ] Configure log rotation for sync_logs
- [ ] Test failover scenarios

## API Documentation

### File Servers

| Endpoint                     | Method | Description           |
| ---------------------------- | ------ | --------------------- |
| `/api/file-servers`          | GET    | List all connectors   |
| `/api/file-servers`          | POST   | Create connector      |
| `/api/file-servers/:id`      | GET    | Get connector details |
| `/api/file-servers/:id`      | PUT    | Update connector      |
| `/api/file-servers/:id`      | DELETE | Delete connector      |
| `/api/file-servers/:id/test` | POST   | Test connection       |
| `/api/file-servers/:id/scan` | POST   | Trigger scan          |
| `/api/file-servers/:id/logs` | GET    | Get sync logs         |

### Chat/RAG

| Endpoint            | Method | Description           |
| ------------------- | ------ | --------------------- |
| `/api/chat/query`   | POST   | Ask question with RAG |
| `/api/chat/history` | GET    | Get chat history      |

## File Structure

```
packages/app-backend/src/
├── services/
│   ├── database.ts          ✅ Extended schema
│   ├── encryption.ts        ✅ Credential encryption
│   ├── connector.ts         ✅ File server connector
│   ├── rag.ts              🚧 RAG service (to implement)
│   └── ingestion.ts        🚧 Enhanced ingestion (to implement)
├── routes/
│   ├── fileServers.ts      🚧 Connector management (to implement)
│   └── chat.ts             🚧 RAG chat API (to implement)

packages/app-frontend/src/
├── pages/
│   ├── FileServersPage.tsx  🚧 Admin panel (to implement)
│   ├── DocumentsPage.tsx    🚧 Enhanced UI (to update)
│   └── ChatPage.tsx         ✅ Already exists, needs RAG integration
├── components/
│   ├── DocumentViewer.tsx   🚧 Viewer with anchoring (to implement)
│   └── CitationCard.tsx     🚧 Citation component (to implement)
```

## Summary

This implementation provides:

- ✅ Secure file server connector (local/NFS)
- ✅ Encrypted credential storage
- ✅ File monitoring and change detection
- ✅ Extensible architecture for RAG
- 🚧 RAG service (next to implement)
- 🚧 Admin UI (next to implement)
- 🚧 Chat UI with citations (next to implement)

The foundation is complete and ready for the RAG service and UI components to be built on top.
