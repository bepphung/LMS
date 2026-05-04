let extractorPromise = null

const MODEL_NAME = import.meta.env.VITE_EMBEDDING_MODEL || 'Xenova/paraphrase-multilingual-MiniLM-L12-v2'

const getExtractor = async () => {
  if (!extractorPromise) {
    extractorPromise = (async () => {
      const { pipeline, env } = await import('@xenova/transformers')
      env.allowLocalModels = false
      return pipeline('feature-extraction', MODEL_NAME)
    })()
  }

  return extractorPromise
}

export const generateQueryEmbedding = async (query = '') => {
  const normalizedQuery = String(query).trim()
  if (!normalizedQuery) return []

  const extractor = await getExtractor()
  const output = await extractor(normalizedQuery, {
    pooling: 'mean',
    normalize: true
  })

  return Array.from(output.data, (value) => Number(value))
}
