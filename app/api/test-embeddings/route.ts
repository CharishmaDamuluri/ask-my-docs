import { embedSingle, embedBatch } from '@/lib/embeddings';
import { NextResponse } from 'next/server';

function cosineSimilarity(a: number[], b: number[]) {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dot / (magA * magB);
}

export async function GET() {
  try {
    // Test single embed
    const v1 = await embedSingle('I love pizza');
    const v2 = await embedSingle('I enjoy pizza');
    const v3 = await embedSingle('The stock market crashed');

    // Test batch embed
    const batch = await embedBatch(['Hello world', 'Goodbye world', 'Machine learning']);

    return NextResponse.json({
      success: true,
      single_embed: {
        dimensions: v1.length,
        similarities: {
          'pizza vs pizza (should be high ~0.95)': cosineSimilarity(v1, v2).toFixed(3),
          'pizza vs stocks (should be low ~0.1)': cosineSimilarity(v1, v3).toFixed(3),
        }
      },
      batch_embed: {
        count: batch.length,
        dimensions_each: batch[0].length,
      }
    });
  } catch (error) {
    // Show the exact error in the browser so we can debug it
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}