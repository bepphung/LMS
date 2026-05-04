import React, { useContext, useEffect, useMemo, useState } from 'react'
import { AppContext } from '../../context/AppContext'
import SearchBar from '../../components/student/SearchBar'
import { useParams, useSearchParams } from 'react-router-dom'
import CourseCard from '../../components/student/CourseCard'
import { assets } from '../../assets/assets'
import Footer from '../../components/student/Footer'
import axios from 'axios'
import { toast } from 'react-toastify'
import { generateQueryEmbedding } from '../../utils/queryEmbedding'

const CoursesList = () => {

  const { navigate, allCourses, backendUrl } = useContext(AppContext)
  const { input } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const keyword = (searchParams.get('q') || input || '').trim()
  const [filteredCourse, setFilteredCourse] = useState([])
  const [aiAdvice, setAiAdvice] = useState(null)
  const [aiRecommendations, setAiRecommendations] = useState([])
  const [overviewLoading, setOverviewLoading] = useState(false)

  const [priceRange, setPriceRange] = useState({ min: '', max: '' })
  const [topicFilter, setTopicFilter] = useState('all')
  const [durationFilter, setDurationFilter] = useState('all')
  const [levelFilter, setLevelFilter] = useState('all')

  const availableTopics = useMemo(() => {
    const topics = allCourses.map(course => course.courseTopic).filter(Boolean)
    return [...new Set(topics)].sort((a, b) => a.localeCompare(b, 'vi'))
  }, [allCourses])

  const levelText = {
    beginner: 'Cơ bản',
    intermediate: 'Trung cấp',
    advanced: 'Nâng cao',
    'all-levels': 'Mọi trình độ'
  }

  const normalizeText = (value = '') => {
    return String(value)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
  }

  const matchDuration = (hours) => {
    if (durationFilter === 'all') return true
    const duration = Number(hours || 0)
    if (durationFilter === 'short') return duration > 0 && duration <= 4
    if (durationFilter === 'medium') return duration > 4 && duration <= 10
    if (durationFilter === 'long') return duration > 10
    return true
  }

  const matchKeyword = (course, searchKeyword) => {
    if (!searchKeyword) return true
    const key = normalizeText(searchKeyword)

    const haystacks = [
      course.courseTitle,
      course.courseDescription,
      course.courseTopic,
      course.courseLevel,
      ...(course.courseTags || [])
    ]

    return haystacks.some(item => normalizeText(item).includes(key))
  }

  const discountedPrice = (course) => {
    return Number((course.coursePrice - (course.discount * course.coursePrice) / 100).toFixed(2))
  }

  useEffect(() => {
    if (!allCourses || allCourses.length === 0) return

    const minPrice = Number(priceRange.min || 0)
    const maxPrice = Number(priceRange.max || Number.MAX_SAFE_INTEGER)

    const filtered = allCourses.filter((course) => {
      if (!matchKeyword(course, keyword)) return false
      if (topicFilter !== 'all' && course.courseTopic !== topicFilter) return false
      if (levelFilter !== 'all' && (course.courseLevel || 'beginner') !== levelFilter) return false
      if (!matchDuration(course.estimatedDurationHours)) return false

      const finalPrice = discountedPrice(course)
      if (Number.isFinite(minPrice) && finalPrice < minPrice) return false
      if (Number.isFinite(maxPrice) && finalPrice > maxPrice) return false

      return true
    })

    setFilteredCourse(filtered)
  }, [allCourses, keyword, topicFilter, levelFilter, durationFilter, priceRange])

  useEffect(() => {
    const fetchOverview = async () => {
      if (!keyword) {
        setAiAdvice(null)
        setAiRecommendations([])
        return
      }

      setOverviewLoading(true)
      try {
        let queryEmbedding = []
        try {
          queryEmbedding = await generateQueryEmbedding(keyword)
        } catch {
          // Fallback to lexical scoring when browser cannot load embedding model.
          queryEmbedding = []
        }

        const { data } = await axios.post(`${backendUrl}/api/course/semantic-overview`, {
          query: keyword,
          queryEmbedding,
          limit: 5
        })
        if (data.success) {
          setAiAdvice(data.advice || null)
          setAiRecommendations(data.recommendations || [])
        } else {
          setAiAdvice(null)
          setAiRecommendations([])
          toast.error(data.message || 'Không thể tạo AI Overview')
        }
      } catch (error) {
        setAiAdvice(null)
        setAiRecommendations([])
        toast.error(error.response?.data?.message || error.message)
      } finally {
        setOverviewLoading(false)
      }
    }

    fetchOverview()
  }, [backendUrl, keyword])

  const clearKeyword = () => {
    setSearchParams({})
  }

  const resetFilters = () => {
    setPriceRange({ min: '', max: '' })
    setTopicFilter('all')
    setDurationFilter('all')
    setLevelFilter('all')
  }

  return (
    <>
    <div className='relative md:px-36 px-8 pt-20 text-left min-h-[calc(100vh-72px)]'>
      <div className='flex md:flex-row flex-col gap-6 items-start justify-between w-full'>
        <div>
          <h1 className='text-4xl font-semibold text-gray-800'>Danh sách khóa học</h1>
          <p className='text-gray-500'>
          <span className='text-blue-600 cursor-pointer' onClick={() => navigate('/')}>Trang chủ </span> / <span>Danh sách khóa học</span></p>
        </div>
        <SearchBar data={keyword}/>
      </div>
      { keyword && <div className='inline-flex items-center gap-4 px-4 py-2 border mt-8 text-gray-600 bg-white rounded'>
        <p>Từ khóa: <span className='font-medium'>{keyword}</span></p>
        <img src={assets.cross_icon} alt="" className='cursor-pointer' onClick={clearKeyword} />
      </div>
      }

      {/* AI Overview */}
      {keyword && (
        <div className='mt-8 border rounded-2xl bg-linear-to-r from-cyan-50 to-blue-50 p-6'>
          <div className='flex items-center justify-between gap-4 flex-wrap'>
            <div>
              <p className='text-xs font-semibold tracking-wider text-blue-700 uppercase'>AI Overview</p>
              <h2 className='text-2xl font-semibold text-gray-800'>Gợi ý ngữ nghĩa cho từ khóa "{keyword}"</h2>
              <p className='text-sm text-gray-600 mt-1'>Hệ thống semantic search phân tích ý nghĩa truy vấn theo chủ đề, trình độ và ngữ cảnh nội dung khóa học.</p>
            </div>
          </div>

          <div className='mt-5 grid grid-cols-1 md:grid-cols-2 gap-4'>
            {overviewLoading && (
              <div className='col-span-full py-6 text-center text-gray-500'>Đang phân tích ngữ nghĩa truy vấn...</div>
            )}

            {!overviewLoading && !aiAdvice && aiRecommendations.length === 0 && (
              <div className='col-span-full py-6 text-center text-gray-500'>Chưa có gợi ý ngữ nghĩa phù hợp, hãy thử từ khóa cụ thể hơn.</div>
            )}

            {!overviewLoading && aiAdvice && (
              <div className='col-span-full bg-white border border-blue-100 rounded-xl p-5'>
                <div className='flex items-center gap-2 mb-3'>
                  <div className='w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center'>
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h3 className='text-lg font-semibold text-gray-800'>Lời khuyên từ AI Consultant</h3>
                </div>
                <p className='text-sm text-gray-700 leading-relaxed whitespace-pre-line'>{aiAdvice}</p>
              </div>
            )}

            {!overviewLoading && aiRecommendations.length > 0 && (
              <div className='col-span-full mt-2'>
                <h4 className='text-base font-semibold text-gray-800 mb-3'>Khóa học phù hợp cho bạn</h4>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  {aiRecommendations.map((course) => (
                    <div key={course._id} className='bg-white border border-blue-100 rounded-xl p-4 shadow-sm'>
                      <h3 className='font-semibold text-gray-800 mt-1'>{course.courseTitle}</h3>
                      <p className='text-sm text-gray-600 mt-2 line-clamp-3'>{course.courseDescription?.replace(/<[^>]*>/g, ' ')}</p>
                      <div className='mt-3 flex items-center gap-2 flex-wrap text-xs text-gray-500'>
                        <span className='px-2 py-1 bg-gray-100 rounded-full'>{course.courseTopic || 'Tổng quát'}</span>
                        <span className='px-2 py-1 bg-gray-100 rounded-full'>{levelText[course.courseLevel] || 'Cơ bản'}</span>
                        <span className='px-2 py-1 bg-gray-100 rounded-full'>{course.estimatedDurationHours || 0} giờ</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Search filters */}
      <div className='mt-8 border rounded-2xl bg-white p-5'>
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-xl font-semibold text-gray-800'>Bộ lọc tìm kiếm</h3>
          <button type='button' onClick={resetFilters} className='text-sm text-blue-600 hover:text-blue-700'>Đặt lại bộ lọc</button>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
          <div>
            <p className='text-sm text-gray-600 mb-1'>Giá từ</p>
            <input type='number' min='0' value={priceRange.min} onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))} className='w-full border rounded-lg px-3 py-2 outline-none' placeholder='0' />
          </div>
          <div>
            <p className='text-sm text-gray-600 mb-1'>Giá đến</p>
            <input type='number' min='0' value={priceRange.max} onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))} className='w-full border rounded-lg px-3 py-2 outline-none' placeholder='Không giới hạn' />
          </div>
          <div>
            <p className='text-sm text-gray-600 mb-1'>Chủ đề</p>
            <select value={topicFilter} onChange={(e) => setTopicFilter(e.target.value)} className='w-full border rounded-lg px-3 py-2 outline-none'>
              <option value='all'>Tất cả chủ đề</option>
              {availableTopics.map(topic => <option key={topic} value={topic}>{topic}</option>)}
            </select>
          </div>
          <div>
            <p className='text-sm text-gray-600 mb-1'>Trình độ</p>
            <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)} className='w-full border rounded-lg px-3 py-2 outline-none'>
              <option value='all'>Tất cả trình độ</option>
              <option value='beginner'>Cơ bản</option>
              <option value='intermediate'>Trung cấp</option>
              <option value='advanced'>Nâng cao</option>
              <option value='all-levels'>Mọi trình độ</option>
            </select>
          </div>
        </div>

        <div className='mt-4'>
          <p className='text-sm text-gray-600 mb-1'>Thời lượng</p>
          <div className='flex flex-wrap gap-3'>
            <button type='button' onClick={() => setDurationFilter('all')} className={`px-3 py-1.5 rounded-full border text-sm ${durationFilter === 'all' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600'}`}>Tất cả</button>
            <button type='button' onClick={() => setDurationFilter('short')} className={`px-3 py-1.5 rounded-full border text-sm ${durationFilter === 'short' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600'}`}>Dưới 4 giờ</button>
            <button type='button' onClick={() => setDurationFilter('medium')} className={`px-3 py-1.5 rounded-full border text-sm ${durationFilter === 'medium' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600'}`}>4 - 10 giờ</button>
            <button type='button' onClick={() => setDurationFilter('long')} className={`px-3 py-1.5 rounded-full border text-sm ${durationFilter === 'long' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600'}`}>Trên 10 giờ</button>
          </div>
        </div>
      </div>

      <div className='mt-8 mb-2 text-sm text-gray-600'>
        Tìm thấy <span className='font-semibold text-gray-800'>{filteredCourse.length}</span> khóa học phù hợp.
      </div>

      <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 my-16 gap-3 px-2 md:p-0'>
        {filteredCourse.map((course, index) => <CourseCard key={index} course={course} />)}
        {filteredCourse.length === 0 && (
          <div className='col-span-full py-12 text-center text-gray-500 border rounded-xl'>
            Không tìm thấy khóa học phù hợp với tiêu chí hiện tại.
          </div>
        )}
      </div>
    </div>
    <Footer />
    </>
  )
}

export default CoursesList