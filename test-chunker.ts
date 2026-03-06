import { chunkText } from "./lib/chunker";

const sampleText = `
Retrieval-Augmented Generation (RAG) is a technique that combines search with AI generation.
It was introduced by researchers at Facebook AI in 2020.

The core idea is simple: instead of relying only on what the model learned during training,
you retrieve relevant documents at query time and inject them as context.

This solves two major problems. First, it allows the model to answer questions about
private data it was never trained on. Second, it reduces hallucinations because the
model is grounded in real retrieved text rather than guessing from memory.

RAG has three main stages: ingestion, retrieval, and generation. During ingestion,
documents are chunked and embedded. During retrieval, the query is embedded and
matched against stored chunks. During generation, matching chunks are sent as
context to the LLM.
`.trim();

const chunks = chunkText(sampleText, 300, 50);
chunks.forEach(c => {
  console.log(`\n--- Chunk ${c.index} (${c.content.length} chars) ---`);
  console.log(c.content);
});