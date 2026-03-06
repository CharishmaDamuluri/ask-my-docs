// test-embeddings.ts
import { embedSingle, embedBatch } from './lib/embeddings';

async function main() {
  console.log('Testing single embed...');
  const v1 = await embedSingle('I love pizza');
  const v2 = await embedSingle('I enjoy pizza');
  const v3 = await embedSingle('The stock market crashed');

  console.log('Dimensions:', v1.length); // should be 1536

  function cosineSimilarity(a: number[], b: number[]) {
    const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dot / (magA * magB);
  }

  console.log('pizza vs pizza: ', cosineSimilarity(v1, v2).toFixed(3)); // ~0.95
  console.log('pizza vs stocks:', cosineSimilarity(v1, v3).toFixed(3)); // ~0.1

  console.log('\nTesting batch embed...');
  const batch = await embedBatch(['Hello world', 'Goodbye world', 'Machine learning']);
  console.log('Batch count:', batch.length);   // 3
  console.log('Each dimension:', batch[0].length); // 1536
}

main();