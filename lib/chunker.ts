export interface Chunk {
  content: string;
  index: number;
}

// The overlap (repeating a little text between chunks) prevents important context from being cut in half at a boundary.
export function chunkText(
  text: string,
  chunkSize = 1000,  // characters per chunk
  overlap = 150      // characters shared with next chunk
): Chunk[] { 
    if (chunkSize <= 0) {
        throw new Error("chunkSize must be greater than 0");
    }
    if (overlap < 0) {
        throw new Error("overlap must be 0 or greater");
    }
    if (overlap >= chunkSize) {
        throw new Error("overlap must be smaller than chunkSize");
    }

    // Clean up excessive blank lines
    const clean = text.replace(/\n{3,}/g, '\n\n').trim();
    if (clean.length === 0) return [];

    // If the whole doc fits in one chunk, just return it as-is
    if (clean.length <= chunkSize) {
        return [{ content: clean, index: 0 }];
    }

    const chunks: Chunk[] = [];
    let start = 0;
    let index = 0;

    while (start < clean.length) {
        const end = Math.min(start + chunkSize, clean.length);
        let sliceEnd = end;
        // find a natural break point instead of breaking mis sentence
        if (end < clean.length) {
            const breakPoints = ['\n\n', '. ', '! ', '? ', '\n'];
            for (const bp of breakPoints) {
                const position = clean.lastIndexOf(bp, end);
                if (position > start + chunkSize * 0.5) {
                    sliceEnd = position + bp.length;
                    break;
                }
            }
        }
        const content = clean.slice(start, sliceEnd).trim();
        if (content.length > 0) {
            chunks.push({ content, index });
            index++;
        }
        if (sliceEnd >= clean.length) {
            break;
        }

        // Slide forward, but step back by `overlap` so chunks share context
        const nextStart = sliceEnd - overlap;
        start = nextStart > start ? nextStart : sliceEnd;
    }
    return chunks;
}
