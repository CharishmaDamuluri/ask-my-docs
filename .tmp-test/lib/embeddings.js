"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.embed = embed;
exports.embedBatch = embedBatch;
const ai_1 = require("ai");
const MODEL_ID = "text-embedding-3-small";
const EMBEDDINGS_URL = "https://api.openai.com/v1/embeddings";
async function fetchEmbeddings(values) {
    var _a;
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        throw new Error("OPENAI_API_KEY is missing");
    }
    const response = await fetch(EMBEDDINGS_URL, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: MODEL_ID,
            input: values,
        }),
    });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Embedding request failed (${response.status}): ${errorText}`);
    }
    const payload = (await response.json());
    const embeddings = payload.data
        .slice()
        .sort((a, b) => a.index - b.index)
        .map((item) => item.embedding);
    return {
        embeddings,
        tokens: (_a = payload.usage) === null || _a === void 0 ? void 0 : _a.prompt_tokens,
    };
}
const openAIEmbeddingModel = {
    specificationVersion: "v3",
    provider: "openai",
    modelId: MODEL_ID,
    maxEmbeddingsPerCall: undefined,
    supportsParallelCalls: true,
    async doEmbed({ values }) {
        const result = await fetchEmbeddings(values);
        return {
            embeddings: result.embeddings,
            usage: result.tokens === undefined
                ? undefined
                : {
                    tokens: result.tokens,
                },
            warnings: [],
        };
    },
};
// Fn to embed a single piece of text → returns array of numbers
async function embed(text) {
    const { embedding } = await (0, ai_1.embed)({
        model: openAIEmbeddingModel,
        value: text,
    });
    return embedding;
}
// Fn to embed multiple texts in ONE API call.
async function embedBatch(texts) {
    if (texts.length === 0)
        return [];
    const { embeddings } = await (0, ai_1.embedMany)({
        model: openAIEmbeddingModel,
        values: texts,
    });
    return embeddings;
}
