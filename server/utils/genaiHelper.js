import { GoogleGenAI } from '@google/genai'

export const AI_BUSY_MESSAGE = 'AI đang bận, vui lòng thử lại sau giây lát.'

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export const createGenAIClient = (apiKey) => {
  if (!apiKey) return null
  return new GoogleGenAI({ apiKey })
}

export const extractGenAIText = (response) => {
  if (typeof response?.text === 'string' && response.text.trim().length > 0) {
    return response.text.trim()
  }

  const candidates = Array.isArray(response?.candidates) ? response.candidates : []
  const parts = Array.isArray(candidates[0]?.content?.parts) ? candidates[0].content.parts : []
  const textPart = parts.find((part) => typeof part?.text === 'string' && part.text.trim().length > 0)

  return textPart?.text?.trim() || ''
}

export const isRateLimitError = (error) => {
  const status = Number(error?.status || error?.code || 0)
  const message = String(error?.message || '').toLowerCase()

  return status === 429
    || message.includes('429')
    || message.includes('rate limit')
    || message.includes('resource_exhausted')
}
