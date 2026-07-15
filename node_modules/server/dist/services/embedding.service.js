function generateMockEmbedding(text) {
    const dimensions = 384;
    const vector = new Array(dimensions).fill(0);
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        hash = text.charCodeAt(i) + ((hash << 5) - hash);
    }
    let seed = Math.abs(hash) || 1;
    const lcg = () => {
        seed = (seed * 1664525 + 1013904223) % 4294967296;
        return seed / 4294967296;
    };
    let magnitude = 0;
    for (let i = 0; i < dimensions; i++) {
        const charCode = text.charCodeAt(i % text.length) || 0;
        vector[i] = (lcg() - 0.5) * 2.0 + (charCode / 255.0 - 0.5);
        magnitude += vector[i] * vector[i];
    }
    magnitude = Math.sqrt(magnitude);
    if (magnitude > 0) {
        for (let i = 0; i < dimensions; i++) {
            vector[i] = vector[i] / magnitude;
        }
    }
    return vector;
}
export async function getEmbedding(text) {
    const cleanText = text.trim().replace(/\s+/g, ' ');
    if (!cleanText) {
        return new Array(384).fill(0);
    }
    try {
        const response = await fetch('https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(process.env.HF_TOKEN ? { Authorization: `Bearer ${process.env.HF_TOKEN}` } : {}),
            },
            body: JSON.stringify({ inputs: cleanText, options: { wait_for_model: true } }),
        });
        if (response.ok) {
            const result = await response.json();
            if (Array.isArray(result) && typeof result[0] === 'number') {
                return result;
            }
            if (Array.isArray(result) && Array.isArray(result[0])) {
                return result[0];
            }
        }
    }
    catch (err) {
        // Suppress console spam, just fall back
    }
    return generateMockEmbedding(cleanText);
}
