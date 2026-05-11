/**
 * Jina AI Embedding Service
 */

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export async function createEmbedding(text, retries = 5, delay = 2000) {
  const apiKey = process.env.JINA_API_KEY;
  if (!apiKey) {
    console.warn("JINA_API_KEY not found, skipping embedding generation.");
    return null;
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch("https://api.jina.ai/v1/embeddings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "jina-embeddings-v2-base-en",
          input: [text],
        }),
      });

      const data = await response.json();
      
      if (response.status === 429 || (data.detail && data.detail.includes("Concurrency limit exceeded"))) {
        if (attempt < retries) {
          const waitTime = delay * Math.pow(2, attempt);
          console.warn(`[Jina] Rate limit/Concurrency hit, retrying in ${waitTime}ms... (Attempt ${attempt + 1}/${retries})`);
          await sleep(waitTime);
          continue;
        }
      }

      if (!response.ok) throw new Error(data.detail || `Jina AI Error: ${response.status}`);

      return data.data[0].embedding;
    } catch (error) {
      if (attempt === retries) {
        console.error("Jina Embedding Error after retries:", error.message);
        return null;
      }
      const waitTime = delay * Math.pow(2, attempt);
      console.warn(`[Jina] Error occurred, retrying in ${waitTime}ms...: ${error.message}`);
      await sleep(waitTime);
    }
  }
  return null;
}
