# Ask My Docs

A RAG (Retrieval-Augmented Generation) app I built to learn how AI systems actually work under the hood — not just calling an API, but understanding the full pipeline from document ingestion to semantic search to grounded responses.

You upload a PDF or text file, and then chat with it. The AI only answers from what's in your document — if the answer isn't there, it says so instead of making something up.

**Live demo:** https://ask-my-docs-seven.vercel.app/

---

## Why I built this

I kept seeing "RAG" everywhere in AI engineering job descriptions and wanted to actually understand what it means beyond the buzzword. So I built it from scratch — chunking, embeddings, vector search, retrieval, the whole thing — instead of just dropping a LangChain abstraction on top of everything.

The goal was to understand every line of code, not just make it work.

---

## What it does

Upload any PDF or text file, then ask questions about it. The app finds the most relevant parts of your document and uses those as context when generating the answer. If you ask something that isn't in the document, it tells you rather than guessing.

I tested it with a resume, a legal contract, and plain text files. The legal contract was the most interesting — it handles specific clause lookups really well but struggles with questions that require math across multiple sections, which taught me a lot about where RAG actually breaks down.

---

## How it works

There are two pipelines running under the hood:

**When you upload a file:**
1. Extract raw text from the PDF or text file
2. Split the text into overlapping chunks (~1000 characters each, with 150 character overlap so context doesn't get cut at boundaries)
3. Send all chunks to OpenAI's embedding model in one batch call — this converts each chunk into an array of 1536 numbers that represents its meaning
4. Store those chunks and their vectors in Postgres using the pgvector extension

**When you ask a question:**
1. Embed your question using the same model
2. Run a cosine similarity search in pgvector to find the 5 most relevant chunks
3. Inject those chunks into the system prompt as context
4. Stream the response back using GPT-4o-mini

The key insight is that similar meaning produces similar vectors — so searching for "automobile" correctly matches a chunk about "cars" even though the words are different. That's what makes this fundamentally different from keyword search.

---

## Tech stack

- **Next.js 15** with TypeScript for the frontend and API routes
- **Vercel AI SDK v6** for streaming chat and the `useChat` hook
- **OpenAI text-embedding-3-small** for generating embeddings (via Vercel AI Gateway)
- **GPT-4o-mini** for generating answers
- **pgvector on Neon Postgres** for storing and searching vectors
- **unpdf** for extracting text from PDF files
- **Tailwind CSS** for styling

---

## Project structure

```
ask-my-docs/
├── app/
│   ├── api/
│   │   ├── chat/route.ts       ← retrieval + streaming response
│   │   ├── ingest/route.ts     ← upload, chunk, embed, store
│   │   ├── setup-db/route.ts   ← creates table + vector index
│   │   └── clear/route.ts      ← wipes stored chunks
│   └── page.tsx                ← chat UI
├── lib/
│   ├── chunker.ts              ← sliding window text splitter
│   ├── embeddings.ts           ← OpenAI embedding calls
│   └── db.ts                   ← pgvector queries
```

---

## Running it locally

You'll need a Vercel account for the AI Gateway credits and a Neon Postgres database. Both have free tiers that are more than enough for this.

```bash
git clone https://github.com/yourusername/ask-my-docs.git
cd ask-my-docs
npm install
```

Create a `.env.local` file:

```bash
AI_GATEWAY_API_KEY=vai_...       # from vercel.com/account/ai/api-keys
POSTGRES_URL=postgresql://...    # from your Neon database dashboard
POSTGRES_URL_NON_POOLING=...
POSTGRES_USER=...
POSTGRES_HOST=...
POSTGRES_PASSWORD=...
POSTGRES_DATABASE=...
```

Then initialize the database by visiting this URL once after starting the dev server:

```
http://localhost:3000/api/setup-db
```

Then run:

```bash
npm run dev
```

---

## What I actually learned

**Chunking strategy matters more than I expected.** The size and overlap of chunks directly affects retrieval quality. Too large and a chunk covers too many topics so the similarity score gets diluted. Too small and you lose the surrounding context that makes an answer make sense.

**Embeddings are conceptually simple but powerful.** Converting text to a list of numbers sounds abstract until you see that "I love pizza" and "I enjoy pizza" produce nearly identical vectors while "stock market crash" produces something completely different. That similarity is measurable and searchable.

**RAG has real limits worth knowing.** Multi-step reasoning across chunks is hard — asking "what is the total contract value" requires the model to find the monthly fee, multiply by the contract length, and get the math right. It often doesn't. Knowing this is as important as knowing how to build the system.

**Batch embedding is a big deal.** Embedding 50 chunks one-by-one means 50 API round trips. Batching them into one call is much faster and cheaper. Small thing to implement, big difference at scale.

**pgvector is underrated.** I expected to need a dedicated vector database like Pinecone. Running vector search directly in Postgres keeps the architecture simple and the cost near zero for a project at this scale.

---

## Known limitations

- Math-heavy questions (calculating totals across clauses) are unreliable — the model retrieves the right numbers but often miscalculates
- Questions that need today's date require the date to be injected into the prompt explicitly
- Very large documents may need a higher topK value to retrieve all relevant context
- All uploaded documents share the same vector space — filtering by source is possible but not yet implemented

---

## What I'd add next

- Filter retrieval by document source so multiple documents can be queried separately
- Hybrid search combining vector search with keyword search for better precision
- Show which chunks were used to generate each answer so the user can verify the source
- A job matching version — ingest a resume and job descriptions, match them by semantic similarity

---

Built by Charishma Damuluri (https://github.com/CharishmaDamuluri)
