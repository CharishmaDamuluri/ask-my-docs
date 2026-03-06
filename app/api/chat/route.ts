import { createGateway } from "@ai-sdk/gateway";
import { streamText, convertToModelMessages, UIMessage } from "ai";
import { NextRequest } from "next/server";
import { embedSingle } from "@/lib/embeddings";
import { similaritySearch } from "@/lib/db";

const gateway = createGateway({
  apiKey: process.env.AI_GATEWAY_API_KEY,
});

export async function POST(req: NextRequest) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  // RAG - Step 1
  const lastUserMessage = messages.filter((m) => m.role === "user").at(-1);

  let systemPrompt = "You are a helpful assistant.";

  if (lastUserMessage) {
    // Step 2 - Embed the user's question into a vector

    const messageText = lastUserMessage.parts
      .filter((p) => p.type === "text")
      .map((p) => p.text)
      .join(" ");

    const queryEmbedding = await embedSingle(messageText);

    // Step 3 - Search pgvector for top 5 most similar chunks
    const relevantChunks = await similaritySearch(queryEmbedding, 5);
    console.log(
      "Found chunks:",
      relevantChunks.length,
      relevantChunks.map((c) => c.similarity),
    );

    if (relevantChunks.length > 0) {
      // Step 4 - Ingest retrieved chunks as context into the system prompt
      const context = relevantChunks
        .map(
          (chunk, i) => `[Source ${i + 1}: ${chunk.source}]\n${chunk.content}`,
        )
        .join("\n\n");
      systemPrompt = `You are a helpful assistant. Answer the user's question using only the context below.
                Today's date is ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}.
                When calculating years of experience, use the earliest start date from all roles listed and today's date for current roles.
                If the answer is not in the context, say "I don't have enough information in the uploaded documents to answer that."

                CONTEXT:
                ${context}`;
    }
  }
  const result = streamText({
    model: gateway("openai/gpt-4o-mini"),
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
