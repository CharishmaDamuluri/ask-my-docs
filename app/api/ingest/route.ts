import { chunkText } from "@/lib/chunker";
import { insertChunk } from "@/lib/db";
import { embedBatch } from "@/lib/embeddings";
import { NextRequest, NextResponse } from "next/server";
import { extractText } from 'unpdf'; 

export async function POST(req: NextRequest) {
    try {
        // Get the file from form data 
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        // Get the file name and type
        const fileName = file.name;
        const fileType = file.type;
    
        // extracting raw text based on file type
        let rawText = '';
        if (fileType === 'application/pdf') {
            // PDF — converting binary to text using pdf-parse
            const arrayBuffer = await file.arrayBuffer();
            const { text } = await extractText(new Uint8Array(arrayBuffer), { mergePages: true });
            rawText = text;
        } else {
            // Plain text or markdown — just read directly
            rawText = await file.text();
        }

        if (!rawText || rawText.trim().length === 0) {
            return NextResponse.json({ error: 'Could not extract text from file' }, { status: 400 });
        }

        // Splitting text into chunks
        // Each chunk is ~1000 chars with 150 char overlap
        const chunks = chunkText(rawText);

        if (chunks.length === 0) {
            return NextResponse.json({ error: 'No chunks created from file' }, { status: 400 });
        }

        // embedding all chunks in batch 
        const embeddings = await embedBatch(chunks.map(c => c.content));

        // inserting the embeddings along with chunk in pgvector 
        for (let i = 0; i < chunks.length; i++) {
            await insertChunk({
                content: chunks[i].content,
                source: fileName,
                chunkIndex: chunks[i].index,
                embedding: embeddings[i],
            });
        }
        // return response with the success status
        return NextResponse.json({
            success: true,
            fileName,
            chunksCreated: chunks.length,
            message: `Successfully ingested ${chunks.length} chunks from ${fileName}`,
        });
    } catch(error) {
        return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : String(error),
        }, { status: 500 });
    }
}