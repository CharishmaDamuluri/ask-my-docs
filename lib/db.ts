import { sql } from '@vercel/postgres';

/* Run this once - it creates pgvector extension and table to store chunks and embeddings*/
export async function setupDatabase() {
  // adding vector search capability to the Postgres database
  await sql`CREATE EXTENSION IF NOT EXISTS vector`;

  // creating the table that holds document chunks
  await sql`
    CREATE TABLE IF NOT EXISTS document_chunks (
      id          SERIAL PRIMARY KEY,
      content     TEXT NOT NULL,
      source      TEXT NOT NULL,
      chunk_index INTEGER NOT NULL,
      embedding   vector(1536),
      created_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  // creating an index for fast vector search
  // ivfflat is an approximate search algorithm — faster than exact search
  // lists = 100 means it groups vectors into 100 clusters for faster lookup
  await sql`
    CREATE INDEX IF NOT EXISTS chunks_embedding_idx
    ON document_chunks
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100)
  `;
}

/* Saves one chunk + its embedding into the database*/
export async function insertChunk({
  content,
  source,
  chunkIndex,
  embedding,
}: {
  content: string;
  source: string;
  chunkIndex: number;
  embedding: number[];
}) {
  // pgvector expects the vector as a string '[0.1, 0.2, 0.3, ...]'
  const embeddingStr = `[${embedding.join(',')}]`;

  await sql`
    INSERT INTO document_chunks (content, source, chunk_index, embedding)
    VALUES (${content}, ${source}, ${chunkIndex}, ${embeddingStr}::vector)
  `;
}

/* Finds the top K chunks most similar to the query embedding. */
 /* The <=> operator is pgvector's cosine distance operator.
 * Lower distance = more similar, so we ORDER BY distance ascending.
 * We convert to similarity score (1 - distance) so higher = better.
 */
export async function similaritySearch(queryEmbedding: number[], topK = 5) {
  const embeddingStr = `[${queryEmbedding.join(',')}]`;

  const result = await sql`
    SELECT
      content,
      source,
      chunk_index,
      1 - (embedding <=> ${embeddingStr}::vector) AS similarity
    FROM document_chunks
    ORDER BY embedding <=> ${embeddingStr}::vector
    LIMIT ${topK}
  `;

  return result.rows as {
    content: string;
    source: string;
    chunk_index: number;
    similarity: number;
  }[];
}