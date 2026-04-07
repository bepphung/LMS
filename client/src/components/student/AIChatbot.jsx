import React, { useState, useRef, useEffect, useContext } from 'react'
import { AppContext } from '../../context/AppContext'
import axios from 'axios'

const AIChatbot = ({ courseId, lessonContext, isOpen, onClose }) => {
  const { backendUrl, getToken } = useContext(AppContext)
  const [messages, setMessages] = useState([
    { 
      role: 'assistant', 
      content: 'Xin chào! Tôi là trợ lý học tập AI. Bạn có thể hỏi tôi bất kỳ điều gì về nội dung bài học. 📚' 
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setLoading(true)

    try {
      const token = await getToken()
      const { data } = await axios.post(`${backendUrl}/api/ai/chat`, {
        message: userMessage,
        courseId,
        lessonContext
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (data.success) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
      } else {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: 'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau.' 
        }])
      }
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: error.response?.data?.message || 'Không thể kết nối với AI. Vui lòng kiểm tra cấu hình.' 
      }])
    } finally {
      setLoading(false)
    }
  }

  const quickQuestions = [
    'Giải thích khái niệm này',
    'Cho ví dụ minh họa',
    'Tóm tắt nội dung chính',
    'Hướng dẫn thực hành'
  ]

  if (!isOpen) return null

  return (
    <div className='fixed bottom-4 right-4 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border overflow-hidden'>
      {/* Header */}
      <div className='bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <div className='w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center'>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <div>
            <h3 className='font-semibold'>Trợ lý học tập AI</h3>
            <p className='text-xs text-blue-100'>Sẵn sàng hỗ trợ bạn</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className='w-8 h-8 rounded-lg hover:bg-white/20 flex items-center justify-center transition-colors'
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className='flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50'>
        {messages.map((msg, idx) => (
          <div 
            key={idx} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-br-md' 
                : 'bg-white text-gray-800 shadow-sm border rounded-bl-md'
            }`}>
              <p className='text-sm whitespace-pre-wrap'>{msg.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className='flex justify-start'>
            <div className='bg-white text-gray-800 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border'>
              <div className='flex items-center gap-2'>
                <div className='flex gap-1'>
                  <span className='w-2 h-2 bg-blue-400 rounded-full animate-bounce' style={{animationDelay: '0ms'}}></span>
                  <span className='w-2 h-2 bg-blue-400 rounded-full animate-bounce' style={{animationDelay: '150ms'}}></span>
                  <span className='w-2 h-2 bg-blue-400 rounded-full animate-bounce' style={{animationDelay: '300ms'}}></span>
                </div>
                <span className='text-sm text-gray-500'>Đang suy nghĩ...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick questions */}
      <div className='px-4 py-2 bg-white border-t flex gap-2 overflow-x-auto'>
        {quickQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => setInput(q)}
            className='whitespace-nowrap px-3 py-1.5 text-xs bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors'
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className='p-4 bg-white border-t'>
        <div className='flex gap-2'>
          <input
            type='text'
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='Nhập câu hỏi của bạn...'
            className='flex-1 px-4 py-3 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm'
            disabled={loading}
          />
          <button
            type='submit'
            disabled={loading || !input.trim()}
            className='w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 disabled:bg-blue-300 transition-colors'
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  )
}

// Floating AI Button
export const AIFloatingButton = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className='fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center z-40 transition-all hover:scale-105'
      title='Trợ lý AI'
    >
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    </button>
  )
}

export default AIChatbot
