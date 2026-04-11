import React, { useContext, useEffect, useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { AppContext } from '../../context/AppContext'
import Loading from '../../components/student/Loading'
import Footer from '../../components/student/Footer'
import axios from 'axios'
import { toast } from 'react-toastify'
import { assets } from '../../assets/assets'

// Icons for Admin Sidebar
const DashboardIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
)

const ApplicationsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
)

const UsersIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
)

const CoursesIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
)

const HomeIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
)

// Admin Layout Component
const AdminLayout = () => {
  const { user } = useUser()
  const navigate = useNavigate()
  const location = useLocation()
  const { backendUrl, getToken } = useContext(AppContext)
  const [authorized, setAuthorized] = useState(false)
  const [checking, setChecking] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => {
    if (user) {
      if (user.publicMetadata?.role === 'admin') {
        setAuthorized(true)
      } else {
        toast.error('Bạn không có quyền truy cập trang này')
        navigate('/')
      }
      setChecking(false)
    }
  }, [user])

  if (checking) return <Loading />
  if (!authorized) return null

  const menuItems = [
    { path: '/admin', label: 'Dashboard', icon: <DashboardIcon />, exact: true },
    { path: '/admin/applications', label: 'Duyệt giảng viên', icon: <ApplicationsIcon /> },
    { path: '/admin/users', label: 'Quản lý người dùng', icon: <UsersIcon /> },
    { path: '/admin/courses', label: 'Quản lý khóa học', icon: <CoursesIcon /> },
  ]

  const isActive = (path, exact = false) => {
    if (exact) return location.pathname === path
    return location.pathname.startsWith(path)
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 to-blue-50'>
      {/* Header */}
      <header className='bg-white shadow-sm border-b sticky top-0 z-30'>
        <div className='flex items-center justify-between px-4 md:px-6 h-16'>
          <div className='flex items-center gap-4'>
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className='p-2 hover:bg-gray-100 rounded-lg md:hidden'
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <Link to='/' className='flex items-center gap-2'>
              <img src={assets.logo} alt="Logo" className='h-8 w-auto' />
            </Link>
            <div className='hidden sm:flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg'>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className='text-sm font-medium'>Quản trị viên</span>
            </div>
          </div>
          <div className='flex items-center gap-3'>
            <Link 
              to='/' 
              className='flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm px-3 py-1.5 hover:bg-gray-100 rounded-lg transition-colors'
            >
              <HomeIcon />
              <span className='hidden sm:inline'>Về trang chủ</span>
            </Link>
            <div className='flex items-center gap-3 pl-3 border-l'>
              <div className='hidden md:block text-right'>
                <p className='text-sm font-medium text-gray-800'>{user?.fullName}</p>
                <p className='text-xs text-gray-500'>Admin</p>
              </div>
              <img 
                src={user?.imageUrl} 
                alt="" 
                className='w-9 h-9 rounded-full ring-2 ring-blue-100'
              />
            </div>
          </div>
        </div>
      </header>

      <div className='flex'>
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed md:relative md:translate-x-0 z-20 w-64 bg-white min-h-[calc(100vh-64px)] border-r transition-transform duration-200 ease-in-out`}>
          <nav className='p-4 space-y-1'>
            {menuItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive(item.path, item.exact)
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {item.icon}
                <span className='font-medium'>{item.label}</span>
              </Link>
            ))}
          </nav>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div 
            className='fixed inset-0 bg-black/20 z-10 md:hidden'
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className='flex-1 p-4 md:p-6'>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

// Admin Dashboard Component
export const AdminDashboard = () => {
  const { backendUrl, getToken, currency } = useContext(AppContext)
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
  }, [])

  if (loading) return <Loading />

  return (
    <div>
      <h1 className='text-2xl font-bold text-gray-800 mb-6'>Tổng quan hệ thống</h1>
      
      {/* Stats Cards */}
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

      {/* Revenue Card */}
      <div className='bg-gradient-to-r from-emerald-500 to-teal-500 p-6 rounded-xl shadow-lg mb-8 text-white'>
        <div className='flex items-center justify-between'>
          <div>
            <p className='text-emerald-100 text-sm mb-1'>Tổng doanh thu</p>
            <p className='text-4xl font-bold'>
              {currency}{data?.totalRevenue?.toFixed(2) || '0.00'}
            </p>
          </div>
          <div className='w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center'>
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Recent Enrollments */}
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
                  <td className='px-5 py-4 text-sm text-gray-500'>
                    {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                  </td>
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

// Applications Management
export const AdminApplications = () => {
  const { backendUrl, getToken } = useContext(AppContext)
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [selectedApp, setSelectedApp] = useState(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [processing, setProcessing] = useState(false)

  const fetchApplications = async () => {
    try {
      const token = await getToken()
      const { data } = await axios.get(`${backendUrl}/api/admin/applications?status=${filter}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (data.success) {
        setApplications(data.applications)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchApplications()
  }, [filter])

  const handleApprove = async (appId) => {
    if (!confirm('Bạn có chắc muốn duyệt đơn đăng ký này?')) return
    
    setProcessing(true)
    try {
      const token = await getToken()
      const { data } = await axios.post(`${backendUrl}/api/admin/applications/${appId}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (data.success) {
        toast.success(data.message)
        fetchApplications()
        setSelectedApp(null)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message)
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async (appId) => {
    if (!rejectionReason.trim()) {
      toast.error('Vui lòng nhập lý do từ chối')
      return
    }
    
    setProcessing(true)
    try {
      const token = await getToken()
      const { data } = await axios.post(`${backendUrl}/api/admin/applications/${appId}/reject`, 
        { reason: rejectionReason },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (data.success) {
        toast.success(data.message)
        fetchApplications()
        setSelectedApp(null)
        setRejectionReason('')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message)
    } finally {
      setProcessing(false)
    }
  }

  const handleDownloadCv = async (appId) => {
    try {
      const token = await getToken()
      const response = await axios.get(`${backendUrl}/api/admin/applications/${appId}/cv-download`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      })

      const contentDisposition = response.headers?.['content-disposition'] || ''
      const fileNameFromHeaderMatch = contentDisposition.match(/filename="?([^";]+)"?/i)
      const fileNameFromHeader = fileNameFromHeaderMatch?.[1]

      const mimeType = response.data?.type || ''
      const extensionByMime = mimeType.includes('pdf')
        ? 'pdf'
        : mimeType.includes('wordprocessingml')
          ? 'docx'
          : mimeType.includes('msword')
            ? 'doc'
            : 'pdf'

      const objectUrl = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = objectUrl
      link.download = fileNameFromHeader || `cv-${appId}.${extensionByMime}`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(objectUrl)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể tải CV')
    }
  }

  if (loading) return <Loading />

  return (
    <div>
      <h1 className='text-2xl font-bold text-gray-800 mb-6'>Duyệt đơn đăng ký giảng viên</h1>
      
      {/* Filter Tabs */}
      <div className='flex flex-wrap gap-2 mb-6'>
        {[
          { value: 'pending', label: 'Chờ duyệt' },
          { value: 'approved', label: 'Đã duyệt' },
          { value: 'rejected', label: 'Đã từ chối' },
          { value: 'all', label: 'Tất cả' }
        ].map(tab => (
          <button
            key={tab.value}
            onClick={() => { setFilter(tab.value); setLoading(true) }}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              filter === tab.value
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                : 'bg-white text-gray-600 hover:bg-gray-50 border hover:border-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Applications List */}
      <div className='bg-white rounded-xl shadow-sm border overflow-hidden'>
        <table className='w-full'>
          <thead className='bg-gray-50 border-b'>
            <tr>
              <th className='px-4 py-3 text-left text-sm font-medium text-gray-600'>Ứng viên</th>
              <th className='px-4 py-3 text-left text-sm font-medium text-gray-600'>Chuyên môn</th>
              <th className='px-4 py-3 text-left text-sm font-medium text-gray-600'>Ngày nộp</th>
              <th className='px-4 py-3 text-left text-sm font-medium text-gray-600'>Trạng thái</th>
              <th className='px-4 py-3 text-center text-sm font-medium text-gray-600'>Thao tác</th>
            </tr>
          </thead>
          <tbody className='divide-y'>
            {applications.map(app => (
              <tr key={app._id} className='hover:bg-gray-50'>
                <td className='px-4 py-3'>
                  <div className='flex items-center gap-3'>
                    <img src={app.userId?.imageUrl} alt="" className='w-10 h-10 rounded-full' />
                    <div>
                      <p className='font-medium text-gray-800'>{app.fullName}</p>
                      <p className='text-sm text-gray-500'>{app.email}</p>
                    </div>
                  </div>
                </td>
                <td className='px-4 py-3 text-sm text-gray-600'>{app.expertise}</td>
                <td className='px-4 py-3 text-sm text-gray-500'>
                  {new Date(app.createdAt).toLocaleDateString('vi-VN')}
                </td>
                <td className='px-4 py-3'>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    app.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    app.status === 'approved' ? 'bg-green-100 text-green-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {app.status === 'pending' ? 'Chờ duyệt' :
                     app.status === 'approved' ? 'Đã duyệt' : 'Đã từ chối'}
                  </span>
                </td>
                <td className='px-4 py-3 text-center'>
                  <button
                    onClick={() => setSelectedApp(app)}
                    className='text-blue-600 hover:text-blue-700 text-sm font-medium'
                  >
                    Xem chi tiết
                  </button>
                </td>
              </tr>
            ))}
            {applications.length === 0 && (
              <tr>
                <td colSpan={5} className='px-4 py-8 text-center text-gray-500'>
                  Không có đơn đăng ký nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Application Detail Modal */}
      {selectedApp && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto'>
            <div className='p-6 border-b sticky top-0 bg-white'>
              <div className='flex items-center justify-between'>
                <h2 className='text-xl font-bold'>Chi tiết đơn đăng ký</h2>
                <button onClick={() => setSelectedApp(null)} className='text-gray-400 hover:text-gray-600'>
                  ✕
                </button>
              </div>
            </div>
            
            <div className='p-6 space-y-6'>
              {/* Personal Info */}
              <div>
                <h3 className='font-semibold text-gray-800 mb-3'>Thông tin cá nhân</h3>
                <div className='grid grid-cols-2 gap-4 text-sm'>
                  <div>
                    <p className='text-gray-500'>Họ tên</p>
                    <p className='font-medium'>{selectedApp.fullName}</p>
                  </div>
                  <div>
                    <p className='text-gray-500'>Email</p>
                    <p className='font-medium'>{selectedApp.email}</p>
                  </div>
                  <div>
                    <p className='text-gray-500'>Điện thoại</p>
                    <p className='font-medium'>{selectedApp.phone}</p>
                  </div>
                </div>
              </div>

              {/* Professional Info */}
              <div>
                <h3 className='font-semibold text-gray-800 mb-3'>Thông tin chuyên môn</h3>
                <div className='space-y-3 text-sm'>
                  <div>
                    <p className='text-gray-500'>Lĩnh vực chuyên môn</p>
                    <p className='font-medium'>{selectedApp.expertise}</p>
                  </div>
                  <div>
                    <p className='text-gray-500'>Kinh nghiệm</p>
                    <p className='whitespace-pre-wrap'>{selectedApp.experience}</p>
                  </div>
                  <div>
                    <p className='text-gray-500'>Bằng cấp / Chứng chỉ</p>
                    <p className='whitespace-pre-wrap'>{selectedApp.qualification}</p>
                  </div>
                  {selectedApp.linkedinUrl && (
                    <div>
                      <p className='text-gray-500'>LinkedIn</p>
                      <a href={selectedApp.linkedinUrl} target='_blank' className='text-blue-600 hover:underline'>
                        {selectedApp.linkedinUrl}
                      </a>
                    </div>
                  )}
                  {selectedApp.portfolioUrl && (
                    <div>
                      <p className='text-gray-500'>Portfolio</p>
                      <a href={selectedApp.portfolioUrl} target='_blank' className='text-blue-600 hover:underline'>
                        {selectedApp.portfolioUrl}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Teaching Info */}
              <div>
                <h3 className='font-semibold text-gray-800 mb-3'>Kế hoạch giảng dạy</h3>
                <div className='space-y-3 text-sm'>
                  <div>
                    <p className='text-gray-500'>Chủ đề muốn dạy</p>
                    <p className='whitespace-pre-wrap'>{selectedApp.courseTopics}</p>
                  </div>
                  <div>
                    <p className='text-gray-500'>Phương pháp giảng dạy</p>
                    <p className='whitespace-pre-wrap'>{selectedApp.teachingApproach}</p>
                  </div>
                  {selectedApp.sampleVideoUrl && (
                    <div>
                      <p className='text-gray-500'>Video mẫu</p>
                      <a href={selectedApp.sampleVideoUrl} target='_blank' className='text-blue-600 hover:underline'>
                        Xem video →
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Documents */}
              {(selectedApp.cvUrl || selectedApp.certificatesUrl?.length > 0) && (
                <div>
                  <h3 className='font-semibold text-gray-800 mb-3'>Tài liệu đính kèm</h3>
                  <div className='flex flex-wrap gap-2'>
                    {selectedApp.cvUrl && (
                      <button
                        type='button'
                        onClick={() => handleDownloadCv(selectedApp._id)}
                        className='inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200 transition-colors'
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Tải CV
                      </button>
                    )}
                    {selectedApp.certificatesUrl?.map((url, idx) => (
                      <a 
                        key={idx}
                        href={url} 
                        target='_blank'
                        className='inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200 transition-colors'
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                        Chứng chỉ {idx + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions for pending applications */}
              {selectedApp.status === 'pending' && (
                <div className='border-t pt-6'>
                  <div className='mb-4'>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Lý do từ chối (nếu từ chối)
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={3}
                      className='w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                      placeholder='Nhập lý do nếu muốn từ chối...'
                    />
                  </div>
                  <div className='flex gap-3'>
                    <button
                      onClick={() => handleApprove(selectedApp._id)}
                      disabled={processing}
                      className='flex-1 inline-flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-xl font-medium hover:bg-green-700 disabled:bg-green-400 transition-colors'
                    >
                      {processing ? (
                        <span className='animate-pulse'>Đang xử lý...</span>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Duyệt đơn
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleReject(selectedApp._id)}
                      disabled={processing}
                      className='flex-1 inline-flex items-center justify-center gap-2 bg-red-600 text-white py-3 rounded-xl font-medium hover:bg-red-700 disabled:bg-red-400 transition-colors'
                    >
                      {processing ? (
                        <span className='animate-pulse'>Đang xử lý...</span>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Từ chối
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Show rejection reason for rejected applications */}
              {selectedApp.status === 'rejected' && selectedApp.rejectionReason && (
                <div className='bg-red-50 p-4 rounded-xl border border-red-100'>
                  <p className='font-medium text-red-800 mb-1'>Lý do từ chối:</p>
                  <p className='text-red-700'>{selectedApp.rejectionReason}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Users Management
export const AdminUsers = () => {
  const { backendUrl, getToken } = useContext(AppContext)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  const fetchUsers = async () => {
    try {
      const token = await getToken()
      const { data } = await axios.get(`${backendUrl}/api/admin/users?role=${filter}&search=${search}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (data.success) {
        setUsers(data.users)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [filter])

  const handleUnbanUser = async (userId, userName) => {
    if (!confirm(`Bạn có chắc muốn bỏ cấm tài khoản "${userName}"?`)) return

    try {
      const token = await getToken()
      const { data } = await axios.patch(`${backendUrl}/api/admin/users/${userId}/unban`, 
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (data.success) {
        toast.success(data.message)
        fetchUsers()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message)
    }
  }

  const handleBanUser = async (userId, userName) => {
    if (!confirm(`Bạn có chắc muốn cấm tài khoản "${userName}"?`)) return
    
    try {
      const token = await getToken()
      const { data } = await axios.patch(`${backendUrl}/api/admin/users/${userId}/ban`, 
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (data.success) {
        toast.success(data.message)
        fetchUsers()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setLoading(true)
    fetchUsers()
  }

  if (loading) return <Loading />

  return (
    <div>
      <h1 className='text-2xl font-bold text-gray-800 mb-6'>Quản lý người dùng</h1>
      
      {/* Filters */}
      <div className='flex flex-wrap gap-4 mb-6'>
        <div className='flex gap-2'>
          {[
            { value: 'all', label: 'Tất cả' },
            { value: 'student', label: 'Học viên' },
            { value: 'educator', label: 'Giảng viên' },
            { value: 'admin', label: 'Admin' }
          ].map(tab => (
            <button
              key={tab.value}
              onClick={() => { setFilter(tab.value); setLoading(true) }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === tab.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        <form onSubmit={handleSearch} className='flex gap-2'>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder='Tìm kiếm theo tên hoặc email...'
            className='px-4 py-2 border rounded-lg w-64'
          />
          <button type='submit' className='px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200'>
            Tìm
          </button>
        </form>
      </div>

      {/* Users Table */}
      <div className='bg-white rounded-lg shadow-sm border'>
        <table className='w-full'>
          <thead className='bg-gray-50 border-b'>
            <tr>
              <th className='px-4 py-3 text-left text-sm font-medium text-gray-600'>Người dùng</th>
              <th className='px-4 py-3 text-left text-sm font-medium text-gray-600'>Email</th>
              <th className='px-4 py-3 text-left text-sm font-medium text-gray-600'>Vai trò</th>
              <th className='px-4 py-3 text-left text-sm font-medium text-gray-600'>Trạng thái</th>
              <th className='px-4 py-3 text-left text-sm font-medium text-gray-600'>Ngày tham gia</th>
              <th className='px-4 py-3 text-center text-sm font-medium text-gray-600'>Thao tác</th>
            </tr>
          </thead>
          <tbody className='divide-y'>
            {users.map(user => (
              <tr key={user._id} className='hover:bg-gray-50'>
                <td className='px-4 py-3'>
                  <div className='flex items-center gap-3'>
                    <img src={user.imageUrl} alt="" className='w-10 h-10 rounded-full' />
                    <span className='font-medium text-gray-800'>{user.name}</span>
                  </div>
                </td>
                <td className='px-4 py-3 text-sm text-gray-600'>{user.email}</td>
                <td className='px-4 py-3'>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    user.role === 'admin' ? 'bg-red-100 text-red-700' :
                    user.role === 'educator' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {user.role === 'admin' ? 'Admin' :
                     user.role === 'educator' ? 'Giảng viên' : 'Học viên'}
                  </span>
                </td>
                <td className='px-4 py-3'>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    user.isBanned ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {user.isBanned ? 'Đã bị cấm' : 'Đang hoạt động'}
                  </span>
                </td>
                <td className='px-4 py-3 text-sm text-gray-500'>
                  {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                </td>
                <td className='px-4 py-3 text-center'>
                  {['student', 'educator'].includes(user.role) ? (
                    user.isBanned ? (
                      <button
                        onClick={() => handleUnbanUser(user._id, user.name)}
                        className='text-sm font-medium px-3 py-1.5 rounded-lg transition-colors bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      >
                        Bỏ cấm
                      </button>
                    ) : (
                      <button
                        onClick={() => handleBanUser(user._id, user.name)}
                        className='text-sm font-medium px-3 py-1.5 rounded-lg transition-colors bg-red-50 text-red-600 hover:bg-red-100'
                      >
                        Cấm tài khoản
                      </button>
                    )
                  ) : (
                    <span className='text-sm text-gray-400'>Không áp dụng</span>
                  )}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={6} className='px-4 py-8 text-center text-gray-500'>
                  Không tìm thấy người dùng
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Courses Management
export const AdminCourses = () => {
  const { backendUrl, getToken, currency } = useContext(AppContext)
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  const fetchCourses = async () => {
    try {
      const token = await getToken()
      const { data } = await axios.get(`${backendUrl}/api/admin/courses?isPublished=${filter}&search=${search}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (data.success) {
        setCourses(data.courses)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCourses()
  }, [filter])

  const handleDelete = async (courseId, courseTitle) => {
    if (!confirm(`Bạn có chắc muốn xóa khóa học "${courseTitle}"?\n\nHành động này không thể hoàn tác!`)) return
    
    try {
      const token = await getToken()
      const { data } = await axios.delete(`${backendUrl}/api/admin/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (data.success) {
        toast.success(data.message)
        setCourses(courses.filter(c => c._id !== courseId))
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message)
    }
  }

  const handleToggleVisibility = async (courseId, isPublished, courseTitle) => {
    const actionLabel = isPublished ? 'ẩn' : 'bỏ ẩn'
    if (!confirm(`Bạn có chắc muốn ${actionLabel} khóa học "${courseTitle}"?`)) return

    try {
      const token = await getToken()
      const { data } = await axios.patch(
        `${backendUrl}/api/admin/courses/${courseId}/toggle-visibility`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (data.success) {
        toast.success(data.message)
        setCourses(prev => prev.map(course => (
          course._id === courseId ? { ...course, isPublished: data.isPublished } : course
        )))
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setLoading(true)
    fetchCourses()
  }

  if (loading) return <Loading />

  return (
    <div>
      <h1 className='text-2xl font-bold text-gray-800 mb-6'>Quản lý khóa học</h1>
      
      {/* Filters */}
      <div className='flex flex-wrap gap-4 mb-6'>
        <div className='flex gap-2'>
          {[
            { value: 'all', label: 'Tất cả' },
            { value: 'true', label: 'Đang hiển thị' },
            { value: 'false', label: 'Đã ẩn' }
          ].map(tab => (
            <button
              key={tab.value}
              onClick={() => { setFilter(tab.value); setLoading(true) }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === tab.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        <form onSubmit={handleSearch} className='flex gap-2'>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder='Tìm kiếm theo tên khóa học...'
            className='px-4 py-2 border rounded-lg w-64'
          />
          <button type='submit' className='px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200'>
            Tìm
          </button>
        </form>
      </div>

      {/* Courses Table */}
      <div className='bg-white rounded-lg shadow-sm border'>
        <table className='w-full'>
          <thead className='bg-gray-50 border-b'>
            <tr>
              <th className='px-4 py-3 text-left text-sm font-medium text-gray-600'>Khóa học</th>
              <th className='px-4 py-3 text-left text-sm font-medium text-gray-600'>Giảng viên</th>
              <th className='px-4 py-3 text-left text-sm font-medium text-gray-600'>Giá</th>
              <th className='px-4 py-3 text-left text-sm font-medium text-gray-600'>Học viên</th>
              <th className='px-4 py-3 text-left text-sm font-medium text-gray-600'>Trạng thái</th>
              <th className='px-4 py-3 text-center text-sm font-medium text-gray-600'>Thao tác</th>
            </tr>
          </thead>
          <tbody className='divide-y'>
            {courses.map(course => (
              <tr key={course._id} className='hover:bg-gray-50'>
                <td className='px-4 py-3'>
                  <div className='flex items-center gap-3'>
                    <img src={course.courseThumbnail} alt="" className='w-16 h-10 object-cover rounded' />
                    <div>
                      <p className='font-medium text-gray-800 line-clamp-1'>{course.courseTitle}</p>
                      <p className='text-xs text-gray-500'>
                        {new Date(course.createdAt).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  </div>
                </td>
                <td className='px-4 py-3'>
                  <div className='flex items-center gap-2'>
                    <img src={course.educator?.imageUrl} alt="" className='w-6 h-6 rounded-full' />
                    <span className='text-sm text-gray-600'>{course.educator?.name}</span>
                  </div>
                </td>
                <td className='px-4 py-3 text-sm'>
                  {course.discount > 0 ? (
                    <div>
                      <span className='text-gray-400 line-through'>{currency}{course.coursePrice}</span>
                      <span className='ml-2 text-green-600 font-medium'>
                        {currency}{(course.coursePrice - course.coursePrice * course.discount / 100).toFixed(0)}
                      </span>
                    </div>
                  ) : (
                    <span>{currency}{course.coursePrice}</span>
                  )}
                </td>
                <td className='px-4 py-3 text-sm text-gray-600'>
                  {course.enrolledStudents?.length || 0}
                </td>
                <td className='px-4 py-3'>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    course.isPublished ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {course.isPublished ? 'Đang hiển thị' : 'Đã ẩn'}
                  </span>
                </td>
                <td className='px-4 py-3 text-center'>
                  <div className='flex items-center justify-center gap-3'>
                    <button
                      onClick={() => handleToggleVisibility(course._id, course.isPublished, course.courseTitle)}
                      className='text-sm font-medium text-amber-600 hover:text-amber-700'
                    >
                      {course.isPublished ? 'Ẩn' : 'Bỏ ẩn'}
                    </button>
                    <button
                      onClick={() => handleDelete(course._id, course.courseTitle)}
                      className='text-red-600 hover:text-red-700 text-sm font-medium'
                    >
                      Xóa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {courses.length === 0 && (
              <tr>
                <td colSpan={6} className='px-4 py-8 text-center text-gray-500'>
                  Không tìm thấy khóa học
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AdminLayout
