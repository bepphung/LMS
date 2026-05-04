import Course from '../models/Course.js'

if (typeof fetch !== 'function') {
  throw new Error('Global fetch is not available. Please run server on Node.js 18+')
}

// ─── Gemini Configuration ────────────────────────────────────────────
const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_DEFAULT_MODELS = [
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
]

const GEMINI_RETRY_ATTEMPTS = Math.max(1, Number(process.env.GEMINI_RETRY_ATTEMPTS || 3))
const MAX_TRANSCRIPT_CONTEXT = 8000 // characters

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const isGeminiTransientError = ({ status = '', message = '' } = {}) => {
  const normalizedStatus = String(status).toUpperCase()
  const normalizedMessage = String(message).toLowerCase()

  return [
    'RESOURCE_EXHAUSTED',
    'UNAVAILABLE',
    'DEADLINE_EXCEEDED',
    'INTERNAL'
  ].includes(normalizedStatus)
    || normalizedMessage.includes('high demand')
    || normalizedMessage.includes('try again later')
    || normalizedMessage.includes('temporar')
    || normalizedMessage.includes('resource_exhausted')
}

const getGeminiModels = () => {
  const configured = process.env.GEMINI_MODEL
  if (!configured) return GEMINI_DEFAULT_MODELS

  return configured
    .split(',')
    .map(m => m.trim())
    .filter(Boolean)
}

// ─── Core AI Call (Gemini Only) ──────────────────────────────────────
const callGemini = async (prompt, systemPrompt = '') => {
  if (!GEMINI_API_KEY) {
    throw new Error('Thiếu GEMINI_API_KEY trong .env. Vui lòng cấu hình để sử dụng tính năng AI.')
  }

  const models = getGeminiModels()
  let lastErrorMessage = 'Unknown Gemini error'
  let encounteredTransientError = false

  for (const model of models) {
    for (let attempt = 1; attempt <= GEMINI_RETRY_ATTEMPTS; attempt += 1) {
      let data
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [{ text: `${systemPrompt}\n\n${prompt}` }]
              }]
            })
          }
        )
        data = await response.json()
      } catch (networkError) {
        data = {
          error: {
            status: 'UNAVAILABLE',
            message: networkError.message || 'Gemini network error'
          }
        }
      }

      if (!data.error && data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        return data.candidates[0].content.parts[0].text
      }

      const currentError = {
        status: data?.error?.status,
        message: data?.error?.message || `Gemini model ${model} failed`
      }
      lastErrorMessage = currentError.message

      const isTransient = isGeminiTransientError(currentError)
      if (isTransient) {
        encounteredTransientError = true
      }

      if (!isTransient || attempt === GEMINI_RETRY_ATTEMPTS) {
        break
      }

      // Exponential backoff: 800ms, 1600ms, 3200ms...
      const backoffMs = 800 * (2 ** (attempt - 1))
      await sleep(backoffMs)
    }
  }

  if (encounteredTransientError) {
    throw new Error('AI đang quá tải tạm thời, vui lòng thử lại sau vài giây.')
  }

  throw new Error(lastErrorMessage)
}

// Alias for clarity
const callAI = callGemini

// ─── Helpers ─────────────────────────────────────────────────────────
const parseJSONFromAI = (rawText) => {
  const cleaned = rawText.replace(/```json\n?|```/g, '').trim()
  return JSON.parse(cleaned)
}

const stripHtmlTags = (html = '') => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()

const sanitizeHtml = (html = '') => {
  let cleaned = html
    .replace(/```html\n?|```/gi, '')
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .trim()

  const firstTagIndex = cleaned.search(/<[^>]+>/)
  if (firstTagIndex >= 0) {
    const lastTagEnd = cleaned.lastIndexOf('>')
    if (lastTagEnd > firstTagIndex) {
      cleaned = cleaned.slice(firstTagIndex, lastTagEnd + 1)
    }
  }

  if (!cleaned.includes('<')) {
    cleaned = `<p>${cleaned}</p>`
  }

  return cleaned
}

const truncateText = (text = '', maxLen = MAX_TRANSCRIPT_CONTEXT) => {
  if (text.length <= maxLen) return text
  return text.slice(0, maxLen) + '...'
}

/**
 * Find a specific lecture within a course document by chapterIndex + lectureIndex.
 * Returns { chapter, lecture } or null.
 */
const findLecture = (course, chapterIndex, lectureIndex) => {
  const chapter = course?.courseContent?.[chapterIndex]
  if (!chapter) return null
  const lecture = chapter.chapterContent?.[lectureIndex]
  if (!lecture) return null
  return { chapter, lecture }
}

/**
 * Find a specific lecture by its lectureId across all chapters.
 * Returns { chapter, lecture, chapterIndex, lectureIndex } or null.
 */
const findLectureById = (course, lectureId) => {
  if (!lectureId || !course?.courseContent) return null
  for (let ci = 0; ci < course.courseContent.length; ci++) {
    const chapter = course.courseContent[ci]
    if (!Array.isArray(chapter.chapterContent)) continue
    for (let li = 0; li < chapter.chapterContent.length; li++) {
      if (chapter.chapterContent[li].lectureId === lectureId) {
        return {
          chapter,
          lecture: chapter.chapterContent[li],
          chapterIndex: ci,
          lectureIndex: li
        }
      }
    }
  }
  return null
}

/**
 * Build a context string for a lecture, preferring transcript content.
 */
const buildLectureContext = (lecture, chapter, course) => {
  const parts = [
    `Khóa học: ${course.courseTitle}`,
    `Chương: ${chapter.chapterTitle}`,
    `Bài: ${lecture.lectureTitle}`
  ]

  const transcript = (lecture.lectureContent || '').trim()
  if (transcript) {
    parts.push(`\nNỘI DUNG VĂN BẢN THỰC TẾ CỦA BÀI HỌC:\n${truncateText(transcript)}`)
  } else {
    parts.push(`\n(Bài học này chưa có transcript. Hãy trả lời dựa trên tiêu đề bài học và kiến thức chung của bạn, nhưng hãy ghi chú rằng câu trả lời là dựa trên kiến thức chung.)`)
  }

  return parts.join('\n')
}

const buildFallbackDescription = ({ courseTitle, topics, targetAudience, courseLevel }) => {
  const topicsList = (topics || '')
    .split(',')
    .map(t => t.trim())
    .filter(Boolean)
    .slice(0, 5)

  const topicItems = topicsList.length
    ? topicsList.map(topic => `<li>${topic}</li>`).join('')
    : '<li>Nội dung thực chiến, bám sát bài toán thực tế trong dự án IT</li><li>Kết hợp lý thuyết nền tảng và bài tập ứng dụng</li><li>Định hướng kỹ năng để sẵn sàng làm việc trong môi trường chuyên nghiệp</li>'

  return `
<div class="course-description">
  <p><strong>${courseTitle}</strong> là khóa học được thiết kế ngắn gọn, thực tế và dễ tiếp cận, giúp học viên nắm chắc kiến thức cốt lõi và áp dụng ngay vào dự án. Khóa học tập trung vào tư duy giải quyết vấn đề, quy trình làm việc bài bản và kỹ năng triển khai hiệu quả trong môi trường phát triển phần mềm hiện đại.</p>
  <ul>
    ${topicItems}
  </ul>
  <p>${targetAudience ? `Phù hợp cho ${targetAudience}.` : 'Phù hợp cho sinh viên IT và người mới đi làm muốn xây nền tảng vững chắc.'} ${courseLevel ? `Mức độ: ${courseLevel}.` : ''} Sau khóa học, bạn có thể tự tin xây dựng sản phẩm chất lượng, làm việc nhóm hiệu quả và nâng cao năng lực nghề nghiệp theo lộ trình rõ ràng.</p>
</div>`.trim()
}

// ─── API Controllers ─────────────────────────────────────────────────

// AI Chatbot - Learning Assistant (RAG-enabled)
export const chatWithAI = async (req, res) => {
  try {
    const { message, courseId, lectureId, lessonContext } = req.body
    const userId = req.auth.userId

    if (!message) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập câu hỏi' })
    }

    // Build context from actual lecture content (RAG)
    let contextInfo = ''
    if (courseId) {
      const course = await Course.findById(courseId)
      if (course) {
        // Try to find lecture by ID first, then fallback to lessonContext title
        const found = lectureId ? findLectureById(course, lectureId) : null

        if (found) {
          contextInfo = buildLectureContext(found.lecture, found.chapter, course)
        } else {
          // Fallback: use course description + lessonContext (title)
          contextInfo = `
Bối cảnh: Học viên đang học khóa "${course.courseTitle}".
Mô tả khóa học: ${stripHtmlTags(course.courseDescription || '').substring(0, 500)}
${lessonContext ? `Bài học hiện tại: ${lessonContext}` : ''}`
        }
      }
    }

    const systemPrompt = `Bạn là trợ lý học tập AI trong hệ thống e-learning.
Nhiệm vụ của bạn:
- Trả lời câu hỏi dựa trên NỘI DUNG THỰC TẾ của bài học (nếu có transcript bên dưới)
- Giải thích khái niệm một cách dễ hiểu
- Đưa ra ví dụ minh họa
- Hướng dẫn thực hành
- Khuyến khích và động viên học viên

${contextInfo}

Trả lời bằng tiếng Việt, ngắn gọn nhưng đầy đủ thông tin.`

    const aiResponse = await callAI(message, systemPrompt)

    res.json({ 
      success: true, 
      response: aiResponse 
    })
  } catch (error) {
    console.error('AI Chat Error:', error)
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Lỗi khi xử lý yêu cầu AI'
    })
  }
}

// Summarize Lesson Content (RAG-enabled)
export const summarizeLesson = async (req, res) => {
  try {
    const { courseId, chapterIndex, lectureIndex, lectureId } = req.body

    const course = await Course.findById(courseId)
    if (!course) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy khóa học' })
    }

    // Find lecture: prefer lectureId, fallback to indices
    let found = lectureId ? findLectureById(course, lectureId) : null
    if (!found) {
      found = findLecture(course, chapterIndex, lectureIndex)
    }
    if (!found) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bài học' })
    }

    const { chapter, lecture } = found
    const transcript = (lecture.lectureContent || '').trim()
    const hasTranscript = transcript.length > 0

    const prompt = hasTranscript
      ? `Dựa trên NỘI DUNG VĂN BẢN THỰC TẾ của bài học sau đây, hãy tóm tắt thành các ý chính:

Khóa học: ${course.courseTitle}
Chương: ${chapter.chapterTitle}
Bài: ${lecture.lectureTitle}

NỘI DUNG BÀI HỌC:
${truncateText(transcript)}

Hãy tóm tắt thành:
1. Các khái niệm chính (3-5 ý)
2. Những điểm quan trọng cần nhớ
3. Ứng dụng thực tế

Format output dưới dạng markdown với heading và bullet points.`
      : `Tóm tắt nội dung bài học sau thành các ý chính (lưu ý: bài học này chưa có transcript, hãy dựa trên tiêu đề và kiến thức chung):

Khóa học: ${course.courseTitle}
Chương: ${chapter.chapterTitle}
Bài: ${lecture.lectureTitle}

Hãy tóm tắt thành:
1. Các khái niệm chính (3-5 ý)
2. Những điểm quan trọng cần nhớ
3. Ứng dụng thực tế

Format output dưới dạng markdown với heading và bullet points.`

    const summary = await callAI(prompt)

    res.json({ 
      success: true, 
      summary,
      lectureTitle: lecture.lectureTitle,
      chapterTitle: chapter.chapterTitle,
      hasTranscript
    })
  } catch (error) {
    console.error('Summarize Error:', error)
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Lỗi khi tóm tắt bài học'
    })
  }
}

// Generate Quiz Questions (RAG-enabled)
export const generateQuiz = async (req, res) => {
  try {
    const { courseId, chapterIndex, numberOfQuestions = 5 } = req.body

    const course = await Course.findById(courseId)
    if (!course) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy khóa học' })
    }

    const chapter = course.courseContent[chapterIndex]
    if (!chapter) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy chương' })
    }

    // Collect transcript content from all lectures in the chapter
    const lectureContextParts = chapter.chapterContent.map((lecture, idx) => {
      const transcript = (lecture.lectureContent || '').trim()
      if (transcript) {
        return `Bài ${idx + 1} - ${lecture.lectureTitle}:\n${truncateText(transcript, 2000)}`
      }
      return `Bài ${idx + 1} - ${lecture.lectureTitle} (chưa có nội dung chi tiết)`
    })

    const hasAnyTranscript = chapter.chapterContent.some(l => (l.lectureContent || '').trim().length > 0)

    const contextBlock = hasAnyTranscript
      ? `NỘI DUNG THỰC TẾ CÁC BÀI HỌC TRONG CHƯƠNG:\n${lectureContextParts.join('\n\n')}`
      : `Các bài học:\n- ${chapter.chapterContent.map(l => l.lectureTitle).join('\n- ')}`

    const prompt = `Tạo ${numberOfQuestions} câu hỏi trắc nghiệm cho chương học sau:

Khóa học: ${course.courseTitle}
Chương: ${chapter.chapterTitle}

${contextBlock}

Yêu cầu:
- Mỗi câu hỏi có 4 đáp án (A, B, C, D)
- Chỉ có 1 đáp án đúng
- ${hasAnyTranscript ? 'Câu hỏi phải dựa trên NỘI DUNG THỰC TẾ của bài học, không bịa đặt' : 'Các câu hỏi đa dạng về mức độ khó'}
- Bao gồm câu hỏi lý thuyết và ứng dụng

Trả về JSON với format:
{
  "questions": [
    {
      "question": "Nội dung câu hỏi",
      "options": ["A. Đáp án A", "B. Đáp án B", "C. Đáp án C", "D. Đáp án D"],
      "correctAnswer": 0,
      "explanation": "Giải thích ngắn gọn vì sao đáp án đúng"
    }
  ]
}

Chỉ trả về JSON, không có text khác.`

    const response = await callAI(prompt)
    
    // Parse JSON from response
    let quiz
    try {
      quiz = parseJSONFromAI(response)
    } catch (parseError) {
      console.error('Quiz parse error:', parseError)
      return res.status(500).json({ 
        success: false, 
        message: 'Lỗi xử lý dữ liệu quiz'
      })
    }

    res.json({ 
      success: true, 
      quiz: quiz.questions,
      chapterTitle: chapter.chapterTitle,
      hasTranscript: hasAnyTranscript
    })
  } catch (error) {
    console.error('Generate Quiz Error:', error)
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Lỗi khi tạo câu hỏi trắc nghiệm'
    })
  }
}

// Generate Course Description for Educators
export const generateCourseDescription = async (req, res) => {
  try {
    const { courseTitle, topics, targetAudience, courseLevel } = req.body

    if (!courseTitle) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập tên khóa học' })
    }

    const prompt = `Bạn là chuyên gia viết nội dung cho nền tảng e-learning.
Nhiệm vụ: tạo mô tả khóa học NGẮN GỌN, chuyên nghiệp, dễ đọc và đúng định dạng.

Thông tin khóa học:

Tên khóa học: ${courseTitle}
${topics ? `Các chủ đề chính: ${topics}` : ''}
${targetAudience ? `Đối tượng học viên: ${targetAudience}` : ''}
${courseLevel ? `Trình độ: ${courseLevel}` : ''}

Yêu cầu:
1. Mô tả hấp dẫn, chuyên nghiệp (120-220 từ)
2. Nêu rõ lợi ích khi học
3. Liệt kê các kỹ năng sẽ đạt được
4. Phù hợp cho nền tảng e-learning
5. Không thêm giải thích, không markdown, không code fence, không tiêu đề ngoài nội dung mô tả

Trả về DUY NHẤT JSON hợp lệ theo format:
{
  "descriptionHtml": "<div class=\\"course-description\\">...</div>"
}

descriptionHtml chỉ được dùng các thẻ HTML sau: <div>, <p>, <ul>, <li>, <strong>.`

    const aiRaw = await callAI(prompt)

    let description = ''
    try {
      const parsed = parseJSONFromAI(aiRaw)
      description = sanitizeHtml(parsed?.descriptionHtml || '')
    } catch {
      description = sanitizeHtml(aiRaw)
    }

    const wordCount = stripHtmlTags(description).split(' ').filter(Boolean).length
    if (wordCount < 70) {
      description = buildFallbackDescription({ courseTitle, topics, targetAudience, courseLevel })
    }

    res.json({ 
      success: true, 
      description 
    })
  } catch (error) {
    console.error('Generate Description Error:', error)
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Lỗi khi tạo mô tả khóa học'
    })
  }
}

// Check AI availability
export const checkAIStatus = async (req, res) => {
  try {
    const isAvailable = !!GEMINI_API_KEY
    
    res.json({ 
      success: true, 
      available: isAvailable,
      provider: isAvailable ? 'Google Gemini' : 'None'
    })
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      available: false,
      message: error.message 
    })
  }
}
