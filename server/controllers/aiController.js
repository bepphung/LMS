import Course from '../models/Course.js'
import User from '../models/User.js'
import { Purchase } from '../models/Purchases.js'

if (typeof fetch !== 'function') {
  throw new Error('Global fetch is not available. Please run server on Node.js 18+')
}

// Configuration for AI API
const AI_CONFIG = {
  apiKey: process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY,
  useOpenAI: !!process.env.OPENAI_API_KEY,
  useGemini: !!process.env.GEMINI_API_KEY
}

const GEMINI_DEFAULT_MODELS = [
  'gemini-1.5-flash',
  'gemini-1.5-pro',
  'gemini-2.0-flash',
  'gemini-3-flash-preview'
]

const GEMINI_RETRY_ATTEMPTS = Math.max(1, Number(process.env.GEMINI_RETRY_ATTEMPTS || 3))

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

const callGemini = async (prompt, systemPrompt = '') => {
  const models = getGeminiModels()
  let lastErrorMessage = 'Unknown Gemini error'
  let encounteredTransientError = false

  for (const model of models) {
    for (let attempt = 1; attempt <= GEMINI_RETRY_ATTEMPTS; attempt += 1) {
      let data
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
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

// Helper function to call AI API
const callAI = async (prompt, systemPrompt = '') => {
  // If OpenAI key is available
  if (AI_CONFIG.useOpenAI) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt || 'Bạn là trợ lý học tập thông minh, hỗ trợ học viên trong hệ thống e-learning. Trả lời bằng tiếng Việt.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 2000,
        temperature: 0.7
      })
    })
    const data = await response.json()
    if (data.error) throw new Error(data.error.message)
    return data.choices[0].message.content
  }
  
  // If Gemini key is available
  if (AI_CONFIG.useGemini) {
    return await callGemini(prompt, systemPrompt)
  }
  
  throw new Error('No AI API key configured. Please add OPENAI_API_KEY or GEMINI_API_KEY to .env')
}

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

// AI Chatbot - Learning Assistant
export const chatWithAI = async (req, res) => {
  try {
    const { message, courseId, lessonContext } = req.body
    const userId = req.auth.userId

    if (!message) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập câu hỏi' })
    }

    // Get course context if provided
    let contextInfo = ''
    if (courseId) {
      const course = await Course.findById(courseId)
      if (course) {
        contextInfo = `
Bối cảnh: Học viên đang học khóa "${course.courseTitle}".
Mô tả khóa học: ${course.courseDescription?.substring(0, 500) || 'Không có mô tả'}
`
        if (lessonContext) {
          contextInfo += `\nNội dung bài học hiện tại: ${lessonContext}`
        }
      }
    }

    const systemPrompt = `Bạn là trợ lý học tập AI trong hệ thống e-learning.
Nhiệm vụ của bạn:
- Trả lời câu hỏi về nội dung bài học
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

// Summarize Lesson Content
export const summarizeLesson = async (req, res) => {
  try {
    const { courseId, chapterIndex, lectureIndex } = req.body

    const course = await Course.findById(courseId)
    if (!course) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy khóa học' })
    }

    const chapter = course.courseContent[chapterIndex]
    if (!chapter) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy chương' })
    }

    const lecture = chapter.chapterContent[lectureIndex]
    if (!lecture) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bài học' })
    }

    const prompt = `Tóm tắt nội dung bài học sau thành các ý chính:

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
      chapterTitle: chapter.chapterTitle
    })
  } catch (error) {
    console.error('Summarize Error:', error)
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Lỗi khi tóm tắt bài học'
    })
  }
}

// Generate Quiz Questions
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

    // Collect all lecture titles from the chapter
    const lecturesList = chapter.chapterContent.map(l => l.lectureTitle).join('\n- ')

    const prompt = `Tạo ${numberOfQuestions} câu hỏi trắc nghiệm cho chương học sau:

Khóa học: ${course.courseTitle}
Chương: ${chapter.chapterTitle}
Các bài học:
- ${lecturesList}

Yêu cầu:
- Mỗi câu hỏi có 4 đáp án (A, B, C, D)
- Chỉ có 1 đáp án đúng
- Các câu hỏi đa dạng về mức độ khó
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
      chapterTitle: chapter.chapterTitle
    })
  } catch (error) {
    console.error('Generate Quiz Error:', error)
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Lỗi khi tạo câu hỏi trắc nghiệm'
    })
  }
}

// Course Recommendations
export const getRecommendations = async (req, res) => {
  try {
    const userId = req.auth.userId

    // Get user's enrolled courses
    const user = await User.findById(userId).populate('enrolledCourses')
    const enrolledCourseIds = user?.enrolledCourses?.map(c => c._id.toString()) || []

    // Get all available courses
    const allCourses = await Course.find({ isPublished: true })
      .select('courseTitle courseDescription coursePrice category')
      .lean()

    // Filter out enrolled courses
    const availableCourses = allCourses.filter(c => !enrolledCourseIds.includes(c._id.toString()))

    if (availableCourses.length === 0) {
      return res.json({ 
        success: true, 
        recommendations: [],
        message: 'Bạn đã đăng ký tất cả các khóa học!'
      })
    }

    // Build context about enrolled courses
    const enrolledInfo = user?.enrolledCourses?.map(c => c.courseTitle).join(', ') || 'Chưa đăng ký khóa học nào'

    const prompt = `Dựa trên các khóa học đã đăng ký: "${enrolledInfo}"

Hãy đề xuất 3-5 khóa học phù hợp từ danh sách sau:
${availableCourses.map(c => `- ${c.courseTitle}: ${c.courseDescription?.substring(0, 100) || 'Không có mô tả'}`).join('\n')}

Trả về JSON với format:
{
  "recommendations": [
    {
      "title": "Tên khóa học",
      "reason": "Lý do đề xuất (1-2 câu)"
    }
  ]
}

Chỉ trả về JSON, không có text khác.`

    const response = await callAI(prompt)
    
    let recommendations
    try {
      recommendations = parseJSONFromAI(response)
    } catch (parseError) {
      // Fallback: return random courses
      const randomCourses = availableCourses.slice(0, 5).map(c => ({
        title: c.courseTitle,
        reason: 'Khóa học phổ biến phù hợp với bạn',
        courseId: c._id
      }))
      return res.json({ success: true, recommendations: randomCourses })
    }

    // Match recommendations with actual course data
    const matchedRecommendations = recommendations.recommendations.map(rec => {
      const course = availableCourses.find(c => 
        c.courseTitle.toLowerCase().includes(rec.title.toLowerCase()) ||
        rec.title.toLowerCase().includes(c.courseTitle.toLowerCase())
      )
      return {
        ...rec,
        courseId: course?._id || null,
        coursePrice: course?.coursePrice || null
      }
    }).filter(r => r.courseId)

    res.json({ 
      success: true, 
      recommendations: matchedRecommendations 
    })
  } catch (error) {
    console.error('Recommendations Error:', error)
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Lỗi khi lấy đề xuất khóa học'
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
  "descriptionHtml": "<div class=\"course-description\">...</div>"
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
    const isAvailable = AI_CONFIG.useOpenAI || AI_CONFIG.useGemini
    const provider = AI_CONFIG.useOpenAI ? 'OpenAI' : AI_CONFIG.useGemini ? 'Google Gemini' : 'None'
    
    res.json({ 
      success: true, 
      available: isAvailable,
      provider
    })
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      available: false,
      message: error.message 
    })
  }
}
