import Course from '../models/Course.js'
import {
  createGenAIClient,
  extractGenAIText,
  isRateLimitError
} from '../utils/genaiHelper.js'
import { generateQueryEmbeddingVector } from '../utils/embeddingHelper.js'
import { getCachedEmbedding, setCachedEmbedding } from '../utils/embeddingCache.js'

const normalizeText = (value = '') => {
  return String(value)
    .replace(/<[^>]*>/g, ' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const tokenize = (value = '') => normalizeText(value).split(' ').filter(Boolean)

const computeEstimatedDurationHours = (course = {}) => {
  if (Number(course.estimatedDurationHours) > 0) {
    return Number(course.estimatedDurationHours)
  }

  const totalMinutes = (course.courseContent || []).reduce((chapterTotal, chapter) => {
    const chapterMinutes = (chapter.chapterContent || []).reduce((lectureTotal, lecture) => {
      return lectureTotal + Number(lecture.lectureDuration || 0)
    }, 0)
    return chapterTotal + chapterMinutes
  }, 0)

  return Number((totalMinutes / 60).toFixed(1))
}

const cosineSimilarity = (a = [], b = []) => {
  if (!Array.isArray(a) || !Array.isArray(b)) {
    console.warn('[SemanticSearch] Invalid embedding format. Expected arrays for queryEmbedding and aiEmbedding.')
    return null
  }

  if (a.length === 0 || b.length === 0) {
    console.warn(`[SemanticSearch] Empty embedding detected (queryEmbedding=${a.length}, courseEmbedding=${b.length}).`)
    return null
  }

  if (a.length !== b.length) {
    console.warn(`[SemanticSearch] Embedding dimension mismatch (query=${a.length}, course=${b.length}).`)
    return null
  }

  let dot = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i += 1) {
    const av = Number(a[i] || 0)
    const bv = Number(b[i] || 0)
    dot += av * bv
    normA += av * av
    normB += bv * bv
  }

  if (normA === 0 || normB === 0) {
    console.warn('[SemanticSearch] Zero-vector embedding detected; cosine similarity cannot be computed.')
    return null
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}

const lexicalScore = (query = '', course = {}) => {
  const tokens = tokenize(query)
  if (tokens.length === 0) return 0

  const title = normalizeText(course.courseTitle)
  const topic = normalizeText(course.courseTopic)
  const description = normalizeText(course.courseDescription)
  const tags = normalizeText((course.courseTags || []).join(' '))

  let score = 0

  // Exact phrase match bonus — heavily rewards title containing full query
  const normalizedQuery = normalizeText(query)
  if (title.includes(normalizedQuery)) score += 5

  tokens.forEach((token) => {
    if (title.includes(token)) score += 3
    if (topic.includes(token)) score += 2.5
    if (tags.includes(token)) score += 2
    if (description.includes(token)) score += 1
  })

  // Normalize to 0–1 range for fair weighting with semantic score
  const maxPossible = 5 + tokens.length * (3 + 2.5 + 2 + 1)
  return maxPossible > 0 ? Math.min(1, score / maxPossible) : 0
}

/**
 * Compute an adaptive semantic guard threshold based on score distribution.
 * Instead of a fixed 0.7 cutoff (which drops valid results when query is short/vague),
 * we use 60% of the top score as threshold, with a hard floor.
 */
const RELEVANCE_FLOOR = 0.25
const computeAdaptiveThreshold = (semanticScores = []) => {
  if (semanticScores.length === 0) return RELEVANCE_FLOOR
  const topScore = Math.max(...semanticScores)
  return Math.max(RELEVANCE_FLOOR, topScore * 0.6)
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_ADVICE_MODELS = ['gemini-3-flash-preview', 'gemini-3-flash']
const SEMANTIC_WEIGHT = 0.75
const LEXICAL_WEIGHT = 0.25

const callGeminiForAdvice = async (query) => {
  const hasGeminiApiKey = Boolean(GEMINI_API_KEY)
  console.log(`[AI Advice] GEMINI_API_KEY configured: ${hasGeminiApiKey}`)
  if (!hasGeminiApiKey) {
    return 'Hiện tại hệ thống AI tư vấn đang bận, bạn hãy tham khảo lộ trình trong các khóa học bên dưới.'
  }

  const ai = createGenAIClient(GEMINI_API_KEY)

  try {
    const prompt = `Hãy đưa ra lời khuyên lộ trình học tập ngắn gọn (khoảng 2-3 câu) cho từ khóa: '${query}'.

YÊU CẦU NGHIÊM NGẶT:

Bắt đầu nội dung lời khuyên ngay lập tức. KHÔNG giới thiệu bản thân (Ví dụ: KHÔNG dùng 'Dưới vai trò...', 'Chào bạn...', 'Tôi đề xuất...').

KHÔNG sử dụng bất kỳ định dạng Markdown nào (không dùng dấu ** để in đậm, không gạch đầu dòng). Chỉ trả về văn bản thuần (Plain Text).

Trả lời bằng tiếng Việt.`
    const models = (process.env.GEMINI_MODEL || GEMINI_ADVICE_MODELS.join(','))
      .split(',').map(m => m.trim()).filter(Boolean)
    console.log(`[AI Advice] Models configured: ${models.join(', ')}`)

    for (const model of models) {
      try {
        console.log(`[AI Advice] Calling Gemini model: ${model}`)
        const response = await ai.models.generateContent({
          model,
          contents: prompt
        })
        const text = extractGenAIText(response) || ''
        const sanitizedText = text.replace(/\*/g, '').trim()
        if (sanitizedText) return sanitizedText
        console.warn(`[AI Advice] Empty/invalid Gemini response structure from model ${model}`)
      } catch (modelError) {
        if (isRateLimitError(modelError)) {
          console.warn(`[AI Advice] Rate limit detected on ${model}, trying next model`)
          continue
        }
        console.warn(`[AI Advice] Failed calling model ${model}:`, modelError.message)
        continue
      }
    }
  } catch (error) {
    console.warn('[AI Advice] Gemini call failed:', error.message)
  }

  console.warn('[AI Advice] All models failed, returning fallback advice')
  return 'Hiện tại hệ thống AI tư vấn đang bận, bạn hãy tham khảo lộ trình trong các khóa học bên dưới.'
}

const mapCourseForSearch = (course = {}) => ({
  _id: course._id,
  courseTitle: course.courseTitle,
  courseDescription: course.courseDescription,
  courseThumbnail: course.courseThumbnail,
  coursePrice: course.coursePrice,
  discount: course.discount,
  educator: course.educator,
  courseTopic: course.courseTopic || 'Tổng quát',
  courseLevel: course.courseLevel || 'beginner',
  courseTags: Array.isArray(course.courseTags) ? course.courseTags : [],
  estimatedDurationHours: computeEstimatedDurationHours(course)
})

export const getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find({ isPublished: true })
      .select(['-courseContent', '-enrolledStudents', '-aiEmbedding'])
      .populate({ path: 'educator' })
      .lean()

    res.json({
      success: true,
      courses: courses.map(mapCourseForSearch)
    })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

export const getSemanticOverview = async (req, res) => {
  try {
    const source = req.method === 'GET' ? req.query : req.body
    const query = String(source.query || source.q || '').trim()
    const limit = Math.min(10, Math.max(1, Number(source.limit || 6)))

    if (!query) {
      return res.json({
        success: true,
        query,
        advice: null,
        recommendations: [],
        meta: { totalMatches: 0, searchMethod: 'none' }
      })
    }

    // Check cache for query embedding
    let queryEmbedding = getCachedEmbedding(query)
    const embeddingCached = queryEmbedding !== null

    // Run AI advice and course search in parallel
    const [aiAdvice, courses] = await Promise.all([
      callGeminiForAdvice(query),
      Course.find({ isPublished: true })
        .select('courseTitle courseDescription courseThumbnail coursePrice discount educator courseTopic courseLevel courseTags estimatedDurationHours courseContent aiEmbedding')
        .populate({ path: 'educator' })
        .lean()
    ])

    // Generate query embedding using dedicated function (no CORE/TOPIC/DESC noise)
    if (!queryEmbedding) {
      queryEmbedding = await generateQueryEmbeddingVector(query)
      setCachedEmbedding(query, queryEmbedding)
    }

    const scoredCourses = courses
      .map((course) => {
        const embeddingScore = cosineSimilarity(queryEmbedding, course.aiEmbedding || [])
        const lexical = lexicalScore(query, course)
        const semanticScore = embeddingScore !== null ? embeddingScore : 0
        const weightedScore = (semanticScore * SEMANTIC_WEIGHT) + (lexical * LEXICAL_WEIGHT)

        if (embeddingScore === null) {
          console.warn(`[SemanticSearch] embeddingScore=null for courseId=${course._id}. Verify aiEmbedding data/model consistency.`)
        }

        return {
          ...mapCourseForSearch(course),
          _score: weightedScore,
          _semanticScore: semanticScore,
          _embeddingScore: embeddingScore,
          _lexicalScore: lexical
        }
      })

    const ranked = scoredCourses
      .sort((a, b) => b._score - a._score)

    // Adaptive threshold based on score distribution
    const allSemanticScores = ranked.map(c => c._semanticScore)
    const adaptiveThreshold = computeAdaptiveThreshold(allSemanticScores)

    console.log(
      `[SemanticSearch] Query: "${query}" | Threshold: ${adaptiveThreshold.toFixed(3)} (adaptive) | Cache: ${embeddingCached ? 'HIT' : 'MISS'}`
    )
    console.log(
      `[SemanticSearch] Raw scores:`,
      ranked.slice(0, 8).map(c => ({
        title: c.courseTitle,
        total: c._score.toFixed(3),
        semantic: c._semanticScore.toFixed(3),
        lexical: c._lexicalScore.toFixed(3)
      }))
    )

    const passed = ranked.filter((item) => item._semanticScore >= adaptiveThreshold)

    const recommendations = passed
      .slice(0, limit)
      .map(({ _semanticScore, _embeddingScore, _lexicalScore, ...item }) => item)

    // Extract related topics from results for frontend suggestions
    const relatedTopics = [...new Set(
      passed.map(c => c.courseTopic).filter(Boolean)
    )].slice(0, 5)

    console.log(
      '[SemanticSearch] Final Recommendations:',
      recommendations.map((item) => ({
        title: item.courseTitle,
        score: item._score.toFixed(3)
      }))
    )

    res.json({
      success: true,
      query,
      advice: aiAdvice,
      recommendations,
      meta: {
        totalMatches: passed.length,
        searchMethod: 'hybrid',
        adaptiveThreshold: Number(adaptiveThreshold.toFixed(3)),
        weights: { semantic: SEMANTIC_WEIGHT, lexical: LEXICAL_WEIGHT },
        relatedTopics,
        embeddingCached
      }
    })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

export const getCourseId = async (req, res) => {
  const { id } = req.params

  try {
    const courseData = await Course.findById(id).populate({ path: 'educator' })

    courseData.courseContent.forEach(chapter => {
      chapter.chapterContent.forEach(lecture => {
        if (!lecture.isPreviewFree) {
          lecture.lectureUrl = ''
        }
      })
    })

    res.json({ success: true, courseData })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

