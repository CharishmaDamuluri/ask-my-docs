"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.embedSingle = embedSingle;
exports.embedBatch = embedBatch;
const ai_1 = require("ai");
const gateway_1 = require("@ai-sdk/gateway");
// The embedding model — same OpenAI model, but billed to your Vercel credits
const embeddingModel = gateway_1.gateway.textEmbeddingModel('openai/text-embedding-3-small');
// Embeds a single piece of text → returns array of 1536 numbers
// Used at QUERY TIME when user asks a question
async function embedSingle(text) {
    const { embedding } = await (0, ai_1.embed)({
        model: embeddingModel,
        value: text,
    });
    return embedding;
}
// Embeds multiple texts in ONE call → returns array of arrays
// Used at INGESTION TIME to embed all chunks at once
async function embedBatch(texts) {
    if (texts.length === 0)
        return [];
    const { embeddings } = await (0, ai_1.embedMany)({
        model: embeddingModel,
        values: texts,
    });
    return embeddings;
}
