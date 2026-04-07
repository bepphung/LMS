import React, { useState, useContext } from 'react'
import { AppContext } from '../../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'

// Lesson Summary Component
export const AILessonSummary = ({ courseId, chapterIndex, lectureIndex, onClose }) => {
  const { backendUrl, getToken } = useContext(AppContext)
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(false)

  const generateSummary = async () => {
    setLoading(true)
    try {
      const token = await getToken()
      const { data } = await axios.post(`${backendUrl}/api/ai/summarize`, {
        courseId,
        chapterIndex,
        lectureIndex
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (data.success) {
        setSummary(data)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi tóm tắt bài học')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden'>
        <div className='p-6 border-b bg-gradient-to-r from-purple-600 to-purple-700 text-white'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div className='w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center'>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h3 className='font-semibold text-lg'>Tóm tắt bài học</h3>
                <p className='text-sm text-purple-100'>Được tạo bởi AI</p>
              </div>
            </div>
            <button onClick={onClose} className='p-2 hover:bg-white/20 rounded-lg transition-colors'>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className='p-6 overflow-y-auto max-h-[60vh]'>
          {!summary && !loading && (
            <div className='text-center py-12'>
              <div className='w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h4 className='text-lg font-semibold text-gray-800 mb-2'>Tóm tắt nội dung bài học</h4>
              <p className='text-gray-500 mb-6'>AI sẽ phân tích và tóm tắt các ý chính của bài học</p>
              <button
                onClick={generateSummary}
                className='bg-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-purple-700 transition-colors'
              >
                Tạo tóm tắt
              </button>
            </div>
          )}
          
          {loading && (
            <div className='text-center py-12'>
              <div className='w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4'></div>
              <p className='text-gray-600'>Đang tạo tóm tắt...</p>
            </div>
          )}
          
          {summary && (
            <div className='prose prose-purple max-w-none'>
              <h4 className='text-lg font-semibold text-gray-800 mb-4'>
                {summary.chapterTitle} - {summary.lectureTitle}
              </h4>
              <div 
                className='text-gray-700 leading-relaxed'
                dangerouslySetInnerHTML={{ __html: summary.summary.replace(/\n/g, '<br/>') }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Quiz Generator Component
export const AIQuizGenerator = ({ courseId, chapterIndex, onClose }) => {
  const { backendUrl, getToken } = useContext(AppContext)
  const [quiz, setQuiz] = useState(null)
  const [loading, setLoading] = useState(false)
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(null)

  const generateQuiz = async () => {
    setLoading(true)
    setAnswers({})
    setSubmitted(false)
    setScore(null)
    
    try {
      const token = await getToken()
      const { data } = await axios.post(`${backendUrl}/api/ai/generate-quiz`, {
        courseId,
        chapterIndex,
        numberOfQuestions: 5
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (data.success) {
        setQuiz(data.quiz)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi tạo quiz')
    } finally {
      setLoading(false)
    }
  }

  const handleAnswer = (questionIdx, answerIdx) => {
    if (submitted) return
    setAnswers(prev => ({ ...prev, [questionIdx]: answerIdx }))
  }

  const submitQuiz = () => {
    if (Object.keys(answers).length < quiz.length) {
      toast.warning('Vui lòng trả lời tất cả câu hỏi')
      return
    }
    
    let correct = 0
    quiz.forEach((q, idx) => {
      if (answers[idx] === q.correctAnswer) correct++
    })
    
    setScore({ correct, total: quiz.length })
    setSubmitted(true)
  }

  return (
    <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden'>
        <div className='p-6 border-b bg-gradient-to-r from-green-600 to-emerald-600 text-white'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div className='w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center'>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <div>
                <h3 className='font-semibold text-lg'>Quiz trắc nghiệm</h3>
                <p className='text-sm text-green-100'>Được tạo bởi AI</p>
              </div>
            </div>
            <button onClick={onClose} className='p-2 hover:bg-white/20 rounded-lg transition-colors'>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className='p-6 overflow-y-auto max-h-[70vh]'>
          {!quiz && !loading && (
            <div className='text-center py-12'>
              <div className='w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h4 className='text-lg font-semibold text-gray-800 mb-2'>Quiz trắc nghiệm tự động</h4>
              <p className='text-gray-500 mb-6'>AI sẽ tạo 5 câu hỏi trắc nghiệm dựa trên nội dung chương học</p>
              <button
                onClick={generateQuiz}
                className='bg-green-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-green-700 transition-colors'
              >
                Tạo Quiz
              </button>
            </div>
          )}
          
          {loading && (
            <div className='text-center py-12'>
              <div className='w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4'></div>
              <p className='text-gray-600'>Đang tạo câu hỏi...</p>
            </div>
          )}
          
          {quiz && (
            <div className='space-y-6'>
              {/* Score display */}
              {score && (
                <div className={`p-4 rounded-xl text-center ${
                  score.correct >= score.total * 0.7 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  <p className='text-lg font-semibold'>
                    Kết quả: {score.correct}/{score.total} câu đúng
                  </p>
                  <p className='text-sm'>
                    {score.correct >= score.total * 0.7 
                      ? 'Tuyệt vời! Bạn đã nắm vững kiến thức!' 
                      : 'Hãy xem lại bài học và thử lại nhé!'}
                  </p>
                </div>
              )}
              
              {quiz.map((q, qIdx) => (
                <div key={qIdx} className='bg-gray-50 rounded-xl p-5'>
                  <p className='font-medium text-gray-800 mb-4'>
                    <span className='inline-flex items-center justify-center w-8 h-8 bg-green-100 text-green-700 rounded-lg mr-3 text-sm font-bold'>
                      {qIdx + 1}
                    </span>
                    {q.question}
                  </p>
                  <div className='space-y-2 ml-11'>
                    {q.options.map((opt, oIdx) => {
                      const isSelected = answers[qIdx] === oIdx
                      const isCorrect = q.correctAnswer === oIdx
                      
                      let optionClass = 'border-gray-200 hover:border-green-300 hover:bg-green-50'
                      if (submitted) {
                        if (isCorrect) {
                          optionClass = 'border-green-500 bg-green-50 text-green-800'
                        } else if (isSelected && !isCorrect) {
                          optionClass = 'border-red-500 bg-red-50 text-red-800'
                        }
                      } else if (isSelected) {
                        optionClass = 'border-green-500 bg-green-50'
                      }
                      
                      return (
                        <button
                          key={oIdx}
                          onClick={() => handleAnswer(qIdx, oIdx)}
                          disabled={submitted}
                          className={`w-full text-left p-3 rounded-lg border-2 transition-all ${optionClass}`}
                        >
                          {opt}
                        </button>
                      )
                    })}
                  </div>
                  {submitted && q.explanation && (
                    <div className='mt-3 ml-11 p-3 bg-blue-50 rounded-lg text-sm text-blue-800'>
                      <strong>Giải thích:</strong> {q.explanation}
                    </div>
                  )}
                </div>
              ))}
              
              <div className='flex justify-center gap-4 pt-4'>
                {!submitted ? (
                  <button
                    onClick={submitQuiz}
                    className='bg-green-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-green-700 transition-colors'
                  >
                    Nộp bài
                  </button>
                ) : (
                  <button
                    onClick={generateQuiz}
                    className='bg-blue-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors'
                  >
                    Tạo Quiz mới
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Course Recommendations Component
export const AICourseRecommendations = ({ onClose }) => {
  const { backendUrl, getToken, currency, navigate } = useContext(AppContext)
  const [recommendations, setRecommendations] = useState(null)
  const [loading, setLoading] = useState(true)

  React.useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const token = await getToken()
        const { data } = await axios.get(`${backendUrl}/api/ai/recommendations`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        
        if (data.success) {
          setRecommendations(data.recommendations)
        }
      } catch (error) {
        console.error('Recommendations error:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchRecommendations()
  }, [])

  return (
    <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden'>
        <div className='p-6 border-b bg-gradient-to-r from-orange-500 to-amber-500 text-white'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div className='w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center'>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h3 className='font-semibold text-lg'>Gợi ý khóa học</h3>
                <p className='text-sm text-orange-100'>Dựa trên lịch sử học tập của bạn</p>
              </div>
            </div>
            <button onClick={onClose} className='p-2 hover:bg-white/20 rounded-lg transition-colors'>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className='p-6 overflow-y-auto max-h-[60vh]'>
          {loading && (
            <div className='text-center py-12'>
              <div className='w-16 h-16 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mx-auto mb-4'></div>
              <p className='text-gray-600'>Đang phân tích...</p>
            </div>
          )}
          
          {!loading && recommendations?.length === 0 && (
            <div className='text-center py-12 text-gray-500'>
              <p>Bạn đã đăng ký tất cả các khóa học!</p>
            </div>
          )}
          
          {!loading && recommendations?.length > 0 && (
            <div className='space-y-4'>
              {recommendations.map((rec, idx) => (
                <div 
                  key={idx}
                  className='bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors cursor-pointer'
                  onClick={() => rec.courseId && navigate(`/course/${rec.courseId}`)}
                >
                  <div className='flex items-start justify-between'>
                    <div className='flex-1'>
                      <h4 className='font-semibold text-gray-800 mb-1'>{rec.title}</h4>
                      <p className='text-sm text-gray-600'>{rec.reason}</p>
                    </div>
                    {rec.coursePrice && (
                      <span className='text-green-600 font-medium ml-4'>
                        {currency}{rec.coursePrice}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default { AILessonSummary, AIQuizGenerator, AICourseRecommendations }
