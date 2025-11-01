# Development Guide

## Architecture Overview

### Backend Architecture

The backend follows a layered architecture:

```
Routes (API Endpoints)
    ↓
Services (Business Logic)
    ↓
Database (SQLite)
```

#### Key Components:

1. **Routes** (`src/routes/`):
   - `documents.ts`: Document upload, retrieval, search
   - `tenders.ts`: Tender CRUD operations
   - `rules.ts`: Rule management
   - `analysis.ts`: Analysis execution
   - `export.ts`: PDF and CSV generation

2. **Services** (`src/services/`):
   - `database.ts`: Database initialization and connection
   - `parser.ts`: Document parsing (PDF, DOCX, TXT)
   - `analysis.ts`: Rule evaluation and scoring engine
   - `pdf-generator.ts`: PDF report generation
   - `csv-generator.ts`: CSV export

3. **Database Schema**:
   - `documents`: Uploaded files with parsed content
   - `tenders`: Tender opportunities
   - `rules`: Configurable analysis rules
   - `analysis_results`: Analysis outcomes
   - `rule_results`: Individual rule evaluation results

### Frontend Architecture

React application with routing and state management:

```
App (Router)
    ↓
Pages (Feature Pages)
    ↓
Components (Reusable UI)
    ↓
API Utils (Axios calls)
```

#### Key Pages:

1. **HomePage**: Landing page with features overview
2. **DocumentsPage**: Upload and manage knowledge base
3. **TendersPage**: Create and manage tenders
4. **RulesPage**: Configure analysis rules
5. **AnalysisPage**: Run analysis and view results

### Data Flow

1. **Document Upload**:

   ```
   User → Upload File → Parse Content → Store in DB → Index for Search
   ```

2. **Analysis Execution**:

   ```
   Select Tender → Load Rules → Evaluate Each Rule → Calculate Score → Save Results → Display
   ```

3. **Export**:
   ```
   Analysis Results → Generate PDF/CSV → Download
   ```

## Rule Engine

The rule engine supports multiple rule types:

### 1. Keyword Match

- **Type**: `keyword`
- **Condition**: Comma-separated keywords
- **Example**: `software,development,agile`
- **Evaluation**: Checks if keywords appear in tender text

### 2. Budget Range

- **Type**: `budget`
- **Condition**: Range format `min-max`
- **Example**: `10000-50000`
- **Evaluation**: Checks if tender budget falls within range

### 3. Document Check

- **Type**: `document`
- **Condition**: Keywords to find in documents
- **Example**: `certification,compliance`
- **Evaluation**: Searches knowledge base for keywords

### 4. Custom

- **Type**: `custom`
- **Condition**: Custom text matching
- **Example**: Any text pattern
- **Evaluation**: Simple text search

### Rule Weight

Each rule has a weight (0.1-10.0) that affects the final score:

```
Final Score = (Sum of Matched Rule Scores × Weights) / (Total Weight)
```

## API Endpoints

### Documents

- `POST /api/documents/upload` - Upload a document
- `GET /api/documents` - List all documents
- `GET /api/documents/:id` - Get document details
- `DELETE /api/documents/:id` - Delete document
- `GET /api/documents/search?q=query` - Search documents

### Tenders

- `POST /api/tenders` - Create tender
- `GET /api/tenders` - List all tenders
- `GET /api/tenders/:id` - Get tender details
- `PUT /api/tenders/:id` - Update tender
- `DELETE /api/tenders/:id` - Delete tender

### Rules

- `POST /api/rules` - Create rule
- `GET /api/rules` - List all rules
- `GET /api/rules/:id` - Get rule details
- `PUT /api/rules/:id` - Update rule
- `DELETE /api/rules/:id` - Delete rule

### Analysis

- `POST /api/analysis/run/:tenderId` - Run analysis
- `GET /api/analysis/tender/:tenderId` - Get analyses for tender
- `GET /api/analysis/:id` - Get analysis details

### Export

- `GET /api/export/pdf/:analysisId` - Export as PDF
- `GET /api/export/csv/:analysisId` - Export as CSV

## Adding New Features

### Backend

1. **Add a new route**:

   ```typescript
   // src/routes/newFeature.ts
   import { Router } from 'express';
   const router = Router();

   router.get('/', (req, res) => {
     // Implementation
   });

   export default router;
   ```

2. **Register in index.ts**:

   ```typescript
   import newFeatureRoutes from './routes/newFeature';
   app.use('/api/new-feature', newFeatureRoutes);
   ```

3. **Add database tables** (if needed):
   ```typescript
   // In src/services/database.ts
   db.exec(`
     CREATE TABLE IF NOT EXISTS new_table (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       ...
     )
   `);
   ```

### Frontend

1. **Add a new page**:

   ```typescript
   // src/pages/NewPage.tsx
   export default function NewPage() {
     return <div>New Feature</div>;
   }
   ```

2. **Add route in App.tsx**:

   ```typescript
   <Route path="/new-feature" element={<NewPage />} />
   ```

3. **Add navigation link**:

   ```typescript
   <NavLink to="/new-feature" icon={<Icon />}>
     New Feature
   </NavLink>
   ```

4. **Add API calls**:
   ```typescript
   // src/utils/api.ts
   export const getNewData = () => api.get('/new-feature');
   ```

## Testing

### Backend Tests

```typescript
// tests/feature.test.ts
describe('Feature', () => {
  it('should work', () => {
    expect(true).toBe(true);
  });
});
```

Run with: `pnpm test`

### Frontend Tests

```typescript
// tests/Component.test.tsx
import { render } from '@testing-library/react';

describe('Component', () => {
  it('renders', () => {
    const { getByText } = render(<Component />);
    expect(getByText('Hello')).toBeInTheDocument();
  });
});
```

Run with: `pnpm test`

## Database Management

### View Database

```bash
sqlite3 data/team-wiki.db
```

```sql
-- List tables
.tables

-- View data
SELECT * FROM documents;
SELECT * FROM tenders;
SELECT * FROM rules;
SELECT * FROM analysis_results;

-- Exit
.quit
```

### Reset Database

```bash
rm data/team-wiki.db
# Restart backend - database will be recreated
```

## Performance Optimization

### Backend

1. **Add indexes** for frequently queried fields
2. **Use transactions** for bulk operations
3. **Implement caching** for expensive operations
4. **Paginate** large result sets

### Frontend

1. **Lazy load** components
2. **Debounce** search inputs
3. **Memoize** expensive computations
4. **Virtual scrolling** for large lists

## Security Best Practices

1. **Input Validation**: Always validate user input
2. **File Upload**: Restrict file types and sizes
3. **SQL Injection**: Use parameterized queries (already implemented)
4. **CORS**: Configure allowed origins
5. **Rate Limiting**: Add rate limiting for production
6. **Authentication**: Add auth for production use

## Deployment Checklist

- [ ] Update environment variables
- [ ] Set NODE_ENV=production
- [ ] Configure proper CORS origins
- [ ] Set up SSL/TLS
- [ ] Configure file upload limits
- [ ] Set up monitoring and logging
- [ ] Configure backups for database
- [ ] Add rate limiting
- [ ] Add authentication (if needed)
- [ ] Test all features in production
