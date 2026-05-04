import Course from '../models/Course.js'

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
  if (!Array.isArray(a) || !Array.isArray(b) || a.length === 0 || b.length === 0 || a.length !== b.length) {
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

  if (normA === 0 || normB === 0) return null
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
  tokens.forEach((token) => {
    if (title.includes(token)) score += 3
    if (topic.includes(token)) score += 2.5
    if (tags.includes(token)) score += 2
    if (description.includes(token)) score += 1
  })

  return score
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY

const callGeminiForAdvice = async (query) => {
  if (!GEMINI_API_KEY) return null

  try {
    const prompt = `Người dùng đang tìm kiếm chủ đề "${query}" trên nền tảng e-learning. Hãy đóng vai trò chuyên gia tư vấn học tập, đưa ra một lời khuyên ngắn gọn về lộ trình hoặc lý do nên học chủ đề này (tối đa 3 câu). Đừng liệt kê khóa học. Trả lời bằng tiếng Việt.`

    const models = (process.env.GEMINI_MODEL || 'gemini-2.0-flash,gemini-1.5-flash')
      .split(',').map(m => m.trim()).filter(Boolean)

    for (const model of models) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }]
            })
          }
        )
        const data = await response.json()
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
        if (text) return text.trim()
      } catch {
        continue
      }
    }
  } catch (error) {
    console.warn('[AI Advice] Gemini call failed:', error.message)
  }

  return null
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
    const queryEmbedding = Array.isArray(source.queryEmbedding)
      ? source.queryEmbedding.map(Number).filter(num => Number.isFinite(num))
      : []

    if (!query) {
      return res.json({
        success: true,
        query,
        advice: null,
        recommendations: []
      })
    }

    // Run AI advice and course search in parallel
    const [aiAdvice, courses] = await Promise.all([
      callGeminiForAdvice(query),
      Course.find({ isPublished: true })
        .select('courseTitle courseDescription courseThumbnail coursePrice discount educator courseTopic courseLevel courseTags estimatedDurationHours courseContent aiEmbedding')
        .populate({ path: 'educator' })
        .lean()
    ])

    const ranked = courses
      .map((course) => {
        const embeddingScore = cosineSimilarity(queryEmbedding, course.aiEmbedding || [])
        const lexical = lexicalScore(query, course)
        const combinedScore = embeddingScore !== null ? (embeddingScore * 100 + lexical) : lexical

        return {
          ...mapCourseForSearch(course),
          _score: combinedScore
        }
      })
      .filter(item => item._score > 0)
      .sort((a, b) => b._score - a._score)
      .slice(0, limit)

    res.json({
      success: true,
      query,
      advice: aiAdvice,
      recommendations: ranked
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

