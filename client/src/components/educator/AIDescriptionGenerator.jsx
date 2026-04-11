import React, { useState, useContext } from 'react'
import { AppContext } from '../../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'

const AIDescriptionGenerator = ({ onGenerate, currentTitle }) => {
  const { backendUrl, getToken } = useContext(AppContext)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    courseTitle: currentTitle || '',
    topics: '',
    targetAudience: '',
    courseLevel: 'beginner'
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const generateDescription = async () => {
    if (!formData.courseTitle) {
      toast.error('Vui lòng nhập tên khóa học')
      return
    }

    setLoading(true)
    try {
      const token = await getToken()
      const { data } = await axios.post(`${backendUrl}/api/ai/generate-description`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (data.success) {
        const description = typeof data.description === 'string' ? data.description.trim() : ''
        if (!description) {
          toast.error('AI không tạo được mô tả hợp lệ, vui lòng thử lại')
          return
        }

        onGenerate(description)
        setIsOpen(false)
        toast.success('Đã tạo mô tả thành công!')
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi tạo mô tả')
    } finally {
      setLoading(false)
    }
  }

  // Update title when prop changes
  React.useEffect(() => {
    if (currentTitle) {
      setFormData(prev => ({ ...prev, courseTitle: currentTitle }))
    }
  }, [currentTitle])

  return (
    <>
      <button
        type='button'
        onClick={() => setIsOpen(true)}
        className='inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all'
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        Tạo mô tả bằng AI
      </button>

      {isOpen && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-2xl max-w-lg w-full overflow-hidden'>
            <div className='p-6 border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  <div className='w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center'>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className='font-semibold text-lg'>Tạo mô tả khóa học</h3>
                    <p className='text-sm text-blue-100'>Được hỗ trợ bởi AI</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className='p-2 hover:bg-white/20 rounded-lg transition-colors'
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className='p-6 space-y-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Tên khóa học <span className='text-red-500'>*</span>
                </label>
                <input
                  type='text'
                  name='courseTitle'
                  value={formData.courseTitle}
                  onChange={handleChange}
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  placeholder='VD: Lập trình React từ cơ bản đến nâng cao'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Các chủ đề chính
                </label>
                <textarea
                  name='topics'
                  value={formData.topics}
                  onChange={handleChange}
                  rows={2}
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  placeholder='VD: React Hooks, State Management, API Integration...'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Đối tượng học viên
                </label>
                <input
                  type='text'
                  name='targetAudience'
                  value={formData.targetAudience}
                  onChange={handleChange}
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  placeholder='VD: Sinh viên IT, người mới học lập trình'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Trình độ
                </label>
                <select
                  name='courseLevel'
                  value={formData.courseLevel}
                  onChange={handleChange}
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                >
                  <option value='beginner'>Người mới bắt đầu</option>
                  <option value='intermediate'>Trung cấp</option>
                  <option value='advanced'>Nâng cao</option>
                  <option value='all'>Tất cả trình độ</option>
                </select>
              </div>
            </div>

            <div className='p-6 border-t bg-gray-50 flex justify-end gap-3'>
              <button
                type='button'
                onClick={() => setIsOpen(false)}
                className='px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors'
              >
                Hủy
              </button>
              <button
                type='button'
                onClick={generateDescription}
                disabled={loading}
                className='px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 transition-all flex items-center gap-2'
              >
                {loading ? (
                  <>
                    <div className='w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin'></div>
                    Đang tạo...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Tạo mô tả
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default AIDescriptionGenerator
