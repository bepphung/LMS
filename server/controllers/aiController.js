import Course from '../models/Course.js'
import {
  AI_BUSY_MESSAGE,
  createGenAIClient,
  extractGenAIText,
  isRateLimitError,
  sleep
} from '../utils/genaiHelper.js'

// ─── Gemini Configuration ────────────────────────────────────────────
const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_DEFAULT_MODELS = ['gemini-3-flash']
const GEMINI_RETRY_ATTEMPTS = Math.max(1, Number(process.env.GEMINI_RETRY_ATTEMPTS || 2))
const GEMINI_RATE_LIMIT_DELAY_MS = Math.max(800, Number(process.env.GEMINI_RATE_LIMIT_DELAY_MS || 1500))

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

  const ai = createGenAIClient(GEMINI_API_KEY)
  const models = getGeminiModels()
  let lastErrorMessage = 'Unknown Gemini error'
  let encounteredRateLimit = false
  const composedPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt

  for (const model of models) {
    for (let attempt = 1; attempt <= GEMINI_RETRY_ATTEMPTS; attempt += 1) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: composedPrompt
        })
        const text = extractGenAIText(response)
        if (text) return text
        lastErrorMessage = `Gemini model ${model} returned empty content`
      } catch (error) {
        lastErrorMessage = error.message || `Gemini model ${model} failed`
        if (isRateLimitError(error)) {
          encounteredRateLimit = true
          await sleep(GEMINI_RATE_LIMIT_DELAY_MS * attempt)
          continue
        }
        break
      }
    }
  }

  if (encounteredRateLimit) {
    throw new Error(AI_BUSY_MESSAGE)
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

const isBusyAIError = (error) => String(error?.message || '') === AI_BUSY_MESSAGE

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
    parts.push(`\nNỘI DUNG VĂN BẢN THỰC TẾ CỦA BÀI HỌC:\n${transcript}`)
  } else {
    const courseDescription = stripHtmlTags(course.courseDescription || '').trim()
    parts.push('\n(Bài học này chưa có transcript.)')
    parts.push(`MÔ TẢ KHÓA HỌC (ngữ cảnh dự phòng): ${courseDescription || 'Không có mô tả khóa học.'}`)
    parts.push('Hãy trả lời dựa trên ngữ cảnh tổng quát của khóa học và nêu rõ đây là suy luận tổng quát.')
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
          const fallbackDescription = stripHtmlTags(course.courseDescription || '').trim()
          contextInfo = `
Bối cảnh: Học viên đang học khóa "${course.courseTitle}".
Mô tả khóa học (ngữ cảnh dự phòng): ${fallbackDescription || 'Không có mô tả khóa học.'}
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
    if (isBusyAIError(error)) {
      return res.status(429).json({
        success: false,
        message: AI_BUSY_MESSAGE
      })
    }
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
${transcript}

Hãy tóm tắt thành:
1. Các khái niệm chính (3-5 ý)
2. Những điểm quan trọng cần nhớ
3. Ứng dụng thực tế

Format output dưới dạng markdown với heading và bullet points.`
      : `Tóm tắt nội dung bài học sau thành các ý chính (lưu ý: bài học này chưa có transcript, hãy dựa trên mô tả khóa học và kiến thức tổng quát):

Khóa học: ${course.courseTitle}
Chương: ${chapter.chapterTitle}
Bài: ${lecture.lectureTitle}
Mô tả khóa học (ngữ cảnh dự phòng): ${stripHtmlTags(course.courseDescription || '') || 'Không có mô tả khóa học.'}

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
    if (isBusyAIError(error)) {
      return res.status(429).json({
        success: false,
        message: AI_BUSY_MESSAGE
      })
    }
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
        return `Bài ${idx + 1} - ${lecture.lectureTitle}:\n${transcript}`
      }
      return `Bài ${idx + 1} - ${lecture.lectureTitle} (chưa có nội dung chi tiết)`
    })

    const hasAnyTranscript = chapter.chapterContent.some(l => (l.lectureContent || '').trim().length > 0)

    const contextBlock = hasAnyTranscript
      ? `NỘI DUNG THỰC TẾ CÁC BÀI HỌC TRONG CHƯƠNG:\n${lectureContextParts.join('\n\n')}`
      : `CHƯƠNG NÀY CHƯA CÓ TRANSCRIPT. DÙNG NGỮ CẢNH DỰ PHÒNG:
Mô tả khóa học: ${stripHtmlTags(course.courseDescription || '') || 'Không có mô tả khóa học.'}
Danh sách bài học:
- ${chapter.chapterContent.map(l => l.lectureTitle).join('\n- ')}`

    const prompt = `Tạo ${numberOfQuestions} câu hỏi trắc nghiệm cho chương học sau:

Khóa học: ${course.courseTitle}
Chương: ${chapter.chapterTitle}

${contextBlock}

Yêu cầu:
- Mỗi câu hỏi có 4 đáp án (A, B, C, D)
- Chỉ có 1 đáp án đúng
- ${hasAnyTranscript ? 'Câu hỏi phải dựa trên NỘI DUNG THỰC TẾ của bài học, không bịa đặt' : 'Câu hỏi phải dựa trên mô tả khóa học và ngữ cảnh tổng quát, không bịa chi tiết không có trong dữ liệu'}
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
    if (isBusyAIError(error)) {
      return res.status(429).json({
        success: false,
        message: AI_BUSY_MESSAGE
      })
    }
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
    if (isBusyAIError(error)) {
      return res.status(429).json({
        success: false,
        message: AI_BUSY_MESSAGE
      })
    }
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
