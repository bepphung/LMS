import React, { useContext, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import { AppContext } from '../../context/AppContext'
import Loading from '../../components/student/Loading'

const AdminDashboard = () => {
  const { backendUrl, getToken, formatCurrency } = useContext(AppContext)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = await getToken()
        const { data: result } = await axios.get(`${backendUrl}/api/admin/dashboard`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (result.success) {
          setData(result.data)
        }
      } catch (error) {
        toast.error(error.response?.data?.message || error.message)
      } finally {
        setLoading(false)
      }
    }
    fetchDashboard()
  }, [backendUrl, getToken])

  if (loading) return <Loading />

  return (
    <div>
      <h1 className='text-2xl font-bold text-gray-800 mb-6'>Tổng quan hệ thống</h1>

      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8'>
        <div className='bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-gray-500 text-sm mb-1'>Tổng người dùng</p>
              <p className='text-3xl font-bold text-gray-800'>{data?.totalUsers || 0}</p>
            </div>
            <div className='w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center'>
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className='bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-gray-500 text-sm mb-1'>Tổng khóa học</p>
              <p className='text-3xl font-bold text-gray-800'>{data?.totalCourses || 0}</p>
            </div>
            <div className='w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center'>
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          </div>
        </div>

        <div className='bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-gray-500 text-sm mb-1'>Giảng viên</p>
              <p className='text-3xl font-bold text-gray-800'>{data?.totalEducators || 0}</p>
            </div>
            <div className='w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center'>
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className='bg-gradient-to-r from-amber-50 to-orange-50 p-6 rounded-xl shadow-sm border border-amber-200 hover:shadow-md transition-shadow'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-amber-700 text-sm mb-1'>Đơn chờ duyệt</p>
              <p className='text-3xl font-bold text-amber-800'>{data?.pendingApplications || 0}</p>
            </div>
            <Link
              to='/admin/applications'
              className='w-12 h-12 bg-amber-200 rounded-xl flex items-center justify-center hover:bg-amber-300 transition-colors'
            >
              <svg className="w-6 h-6 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      <div className='bg-gradient-to-r from-emerald-500 to-teal-500 p-6 rounded-xl shadow-lg mb-8 text-white'>
        <div className='flex items-center justify-between'>
          <div>
            <p className='text-emerald-100 text-sm mb-1'>Tổng doanh thu</p>
            <p className='text-4xl font-bold'>{formatCurrency(data?.totalRevenue || 0)}</p>
          </div>
          <div className='w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center'>
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      <div className='bg-white rounded-xl shadow-sm border overflow-hidden'>
        <div className='p-5 border-b bg-gray-50'>
          <h2 className='text-lg font-semibold text-gray-800'>Đăng ký gần đây</h2>
        </div>
        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead className='bg-gray-50 border-b'>
              <tr>
                <th className='px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider'>Học viên</th>
                <th className='px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider'>Khóa học</th>
                <th className='px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider'>Ngày</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-100'>
              {data?.recentEnrollments?.map((item, index) => (
                <tr key={index} className='hover:bg-gray-50 transition-colors'>
                  <td className='px-5 py-4'>
                    <div className='flex items-center gap-3'>
                      <img src={item.userId?.imageUrl} alt="" className='w-10 h-10 rounded-full object-cover' />
                      <span className='font-medium text-gray-800'>{item.userId?.name || 'N/A'}</span>
                    </div>
                  </td>
                  <td className='px-5 py-4 text-sm text-gray-600'>{item.courseId?.courseTitle || 'N/A'}</td>
                  <td className='px-5 py-4 text-sm text-gray-500'>{new Date(item.createdAt).toLocaleDateString('vi-VN')}</td>
                </tr>
              ))}
              {(!data?.recentEnrollments || data.recentEnrollments.length === 0) && (
                <tr>
                  <td colSpan={3} className='px-5 py-12 text-center'>
                    <div className='flex flex-col items-center text-gray-400'>
                      <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <p>Chưa có đăng ký nào</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
