"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("node:fs");
const path = require("node:path");
function loadEnvLocal() {
    const envPath = path.resolve(process.cwd(), ".env.local");
    if (!fs.existsSync(envPath))
        return;
    const lines = fs.readFileSync(envPath, "utf8").split("\n");
    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line || line.startsWith("#"))
            continue;
        const eqIndex = line.indexOf("=");
        if (eqIndex <= 0)
            continue;
        const key = line.slice(0, eqIndex).trim();
        let value = line.slice(eqIndex + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }
        if (!process.env[key]) {
            process.env[key] = value;
        }
    }
}
async function main() {
    var _a, _b;
    loadEnvLocal();
    if (!process.env.OPENAI_API_KEY) {
        throw new Error("OPENAI_API_KEY is missing. Set it in .env.local");
    }
    const { embed, embedBatch } = await Promise.resolve().then(() => require("./lib/embeddings"));
    // Test single embed
    const v1 = await embed("I love pizza");
    const v2 = await embed("I enjoy pizza");
    const v3 = await embed("The stock market crashed");
    console.log('Dimensions:', v1.length); // should be 1536
    // Manually compute cosine similarity so you can SEE it working
    // cosine similarity measures the angle between them, closer to zero - more similar 
    // cosine similarity = (A · B) / (|A| × |B|)
    function cosineSimilarity(a, b) {
        const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
        const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
        const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
        return dot / (magA * magB);
    }
    console.log('pizza vs pizza:  ', cosineSimilarity(v1, v2).toFixed(3)); // high ~0.95
    console.log('pizza vs stocks: ', cosineSimilarity(v1, v3).toFixed(3)); // low ~0.1
    const batch = await embedBatch(["I love pizza", "I enjoy pizza", "The stock market crashed"]);
    console.log("Batch vectors:", batch.length);
    console.log("Batch dimensions:", (_b = (_a = batch[0]) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0);
}
main().catch((error) => {
    console.error("Embedding test failed:", error);
    process.exitCode = 1;
});
