import { OpenAI } from 'openai';
import natural from 'natural';
import db from './database';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

const EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small';
const CHAT_MODEL = process.env.OPENAI_CHAT_MODEL || 'gpt-4-turbo-preview';
const CHUNK_SIZE = parseInt(process.env.CHUNK_SIZE || '512');
const CHUNK_OVERLAP = parseInt(process.env.CHUNK_OVERLAP || '50');

export interface SearchResult {
  chunkId: number;
  documentId: number;
  content: string;
  filePath: string;
  title: string;
  pageNumber?: number;
  paragraphNumber?: number;
  score: number;
  metadata: any;
}

export interface Citation {
  documentId: number;
  chunkId: number;
  filePath: string;
  title: string;
  pageNumber?: number;
  paragraphNumber?: number;
  excerpt: string;
  relevanceScore: number;
}

export class RAGService {
  private tfidf: natural.TfIdf;

  constructor() {
    this.tfidf = new natural.TfIdf();
  }

  /**
   * Generate embeddings for text using OpenAI
   */
  async generateEmbeddings(text: string): Promise<number[]> {
    try {
      if (!process.env.OPENAI_API_KEY) {
        console.warn('OpenAI API key not configured, returning zero vector');
        return new Array(1536).fill(0);
      }

      const response = await openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: text,
      });

      return response.data[0].embedding;
    } catch (error: any) {
      console.error('Error generating embeddings:', error.message);
      throw error;
    }
  }

  /**
   * Create chunks from document content
   */
  async chunkDocument(documentId: number, content: string, filePath: string): Promise<void> {
    // Delete existing chunks for this document
    const deleteStmt = db.prepare('DELETE FROM document_chunks WHERE document_id = ?');
    deleteStmt.run(documentId);

    // Split into chunks
    const chunks = this.splitIntoChunks(content, CHUNK_SIZE, CHUNK_OVERLAP);

    // Process chunks in batches for efficiency
    const batchSize = 10;
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (chunk, batchIndex) => {
          const chunkIndex = i + batchIndex;

          try {
            // Generate embedding
            const embedding = await this.generateEmbeddings(chunk.text);
            const embeddingBuffer = Buffer.from(new Float32Array(embedding).buffer);

            // Detect page/paragraph numbers from content
            const pageMatch = chunk.text.match(/\[Page (\d+)\]/);
            const pageNumber = pageMatch ? parseInt(pageMatch[1]) : null;

            // Store chunk with embedding
            const insertStmt = db.prepare(`
              INSERT INTO document_chunks (
                document_id, chunk_index, content, page_number, 
                paragraph_number, start_char, end_char, embedding, metadata
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            insertStmt.run(
              documentId,
              chunkIndex,
              chunk.text,
              pageNumber,
              null, // paragraph number - could be enhanced
              chunk.start,
              chunk.end,
              embeddingBuffer,
              JSON.stringify({ filePath, length: chunk.text.length })
            );
          } catch (error) {
            console.error(`Error processing chunk ${chunkIndex}:`, error);
          }
        })
      );
    }

    console.log(`Created ${chunks.length} chunks for document ${documentId}`);
  }

  /**
   * Split text into overlapping chunks
   */
  private splitIntoChunks(
    text: string,
    chunkSize: number,
    overlap: number
  ): Array<{ text: string; start: number; end: number }> {
    const words = text.split(/\s+/);
    const chunks: Array<{ text: string; start: number; end: number }> = [];

    let start = 0;
    while (start < words.length) {
      const end = Math.min(start + chunkSize, words.length);
      const chunkText = words.slice(start, end).join(' ');

      chunks.push({
        text: chunkText,
        start,
        end,
      });

      // Move forward by (chunkSize - overlap)
      start += chunkSize - overlap;

      // Break if we're at the end
      if (end === words.length) break;
    }

    return chunks;
  }

  /**
   * Hybrid search: TF-IDF + Vector similarity
   */
  async search(query: string, limit: number = 10): Promise<SearchResult[]> {
    // Generate query embedding
    const queryEmbedding = await this.generateEmbeddings(query);

    // Get all chunks with their embeddings
    const chunks = db
      .prepare(
        `
      SELECT 
        c.id as chunkId,
        c.document_id as documentId,
        c.content,
        c.page_number as pageNumber,
        c.paragraph_number as paragraphNumber,
        c.embedding,
        c.metadata,
        d.file_path as filePath,
        d.original_name as title
      FROM document_chunks c
      JOIN documents d ON c.document_id = d.id
    `
      )
      .all() as any[];

    // Calculate similarity scores
    const results: SearchResult[] = chunks.map(chunk => {
      // Vector similarity (cosine)
      const chunkEmbedding = new Float32Array(chunk.embedding.buffer);
      const vectorScore = this.cosineSimilarity(queryEmbedding, Array.from(chunkEmbedding));

      // TF-IDF similarity
      const tfidfScore = this.calculateTFIDF(query, chunk.content);

      // Hybrid score: weighted combination
      const score = 0.7 * vectorScore + 0.3 * tfidfScore;

      return {
        chunkId: chunk.chunkId,
        documentId: chunk.documentId,
        content: chunk.content,
        filePath: chunk.filePath,
        title: chunk.title,
        pageNumber: chunk.pageNumber,
        paragraphNumber: chunk.paragraphNumber,
        score,
        metadata: JSON.parse(chunk.metadata || '{}'),
      };
    });

    // Sort by score and return top results
    return results.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) return 0;

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }

    if (norm1 === 0 || norm2 === 0) return 0;

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  /**
   * Calculate TF-IDF similarity (simplified)
   */
  private calculateTFIDF(query: string, content: string): number {
    const queryWords = query.toLowerCase().split(/\s+/);
    const contentWords = content.toLowerCase().split(/\s+/);

    const contentSet = new Set(contentWords);
    let matches = 0;

    for (const word of queryWords) {
      if (contentSet.has(word)) {
        matches++;
      }
    }

    return queryWords.length > 0 ? matches / queryWords.length : 0;
  }

  /**
   * Generate AI response with citations
   */
  async generateAnswer(
    query: string,
    context: SearchResult[]
  ): Promise<{ answer: string; citations: Citation[] }> {
    try {
      if (!process.env.OPENAI_API_KEY) {
        return {
          answer: 'OpenAI API key not configured. Using retrieved context only.',
          citations: context.slice(0, 5).map(c => this.createCitation(c)),
        };
      }

      // Build context for LLM
      const contextText = context
        .slice(0, 5) // Top 5 results
        .map((r, i) => `[${i + 1}] ${r.title} (${r.filePath}):\n${r.content}`)
        .join('\n\n');

      // Generate answer using OpenAI
      const response = await openai.chat.completions.create({
        model: CHAT_MODEL,
        messages: [
          {
            role: 'system',
            content: `You are a helpful assistant that answers questions based on the provided document context. 
            Always cite your sources using the format [1], [2], etc. corresponding to the document numbers in the context.
            If the context doesn't contain relevant information, say so clearly.`,
          },
          {
            role: 'user',
            content: `Context:\n${contextText}\n\nQuestion: ${query}\n\nAnswer:`,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      const answer = response.choices[0]?.message?.content || 'No answer generated.';

      // Extract citations from top results
      const citations = context.slice(0, 5).map(r => this.createCitation(r));

      return { answer, citations };
    } catch (error: any) {
      console.error('Error generating answer:', error.message);
      throw error;
    }
  }

  /**
   * Create citation from search result
   */
  private createCitation(result: SearchResult): Citation {
    // Extract excerpt (first 150 chars)
    const excerpt =
      result.content.length > 150 ? result.content.substring(0, 150) + '...' : result.content;

    return {
      documentId: result.documentId,
      chunkId: result.chunkId,
      filePath: result.filePath,
      title: result.title,
      pageNumber: result.pageNumber,
      paragraphNumber: result.paragraphNumber,
      excerpt,
      relevanceScore: result.score,
    };
  }

  /**
   * Re-index all documents (useful for updates)
   */
  async reindexAll(): Promise<{ processed: number; errors: number }> {
    const documents = db.prepare('SELECT id, content, file_path FROM documents').all() as any[];

    let processed = 0;
    let errors = 0;

    for (const doc of documents) {
      try {
        if (doc.content) {
          await this.chunkDocument(doc.id, doc.content, doc.file_path);
          processed++;
        }
      } catch (error) {
        console.error(`Error reindexing document ${doc.id}:`, error);
        errors++;
      }
    }

    return { processed, errors };
  }

  /**
   * Delete chunks for a document
   */
  async deleteDocumentChunks(documentId: number): Promise<void> {
    const stmt = db.prepare('DELETE FROM document_chunks WHERE document_id = ?');
    stmt.run(documentId);
  }
}

// Export singleton instance
export const ragService = new RAGService();
