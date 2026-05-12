import React, { useContext, useEffect, useState } from 'react'
import { AppContext } from './../../context/AppContext'
import { assets } from '../../assets/assets'
import Loading from '../../components/student/Loading'
import axios from 'axios'
import { toast } from 'react-toastify'


const Dashboard = () => {

  const [dashboardData, setDashboardData] = useState(null)
  const { backendUrl, getToken, isEducator, userData } = useContext(AppContext)
  const hasEducatorAccess = Boolean(isEducator || userData?.role === 'educator' || userData?.role === 'admin')

  const fetchDashboardData = async () => {
    try {
      const token = await getToken()
      const { data } = await axios.get(backendUrl + '/api/educator/dashboard', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      if (data.success) {
        setDashboardData(data.data || data.dashboardData)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  useEffect(() => {
    if (hasEducatorAccess) {
      fetchDashboardData()
    }
  }, [hasEducatorAccess])

  return dashboardData ? (
    <div className='md:p-8 p-4 pt-8 pb-0'>
      <div className='w-full max-w-4xl text-gray-700 space-y-8 pb-8'>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
          <div className='bg-white border border-gray-200 rounded-xl p-5 shadow-sm'>
            <div className='flex items-center gap-3'>
              <img src={assets.appointments_icon} alt="" />
              <div>
                <p className='text-2xl font-medium text-gray-700'>{dashboardData.totalCourses}</p>
                <p className='text-base text-gray-500'>Tổng số khóa học</p>
              </div>
            </div>
          </div>

          <div className='bg-white border border-gray-200 rounded-xl p-5 shadow-sm'>
            <div className='flex items-center gap-3'>
              <img src={assets.patients_icon} alt="" />
              <div>
                <p className='text-2xl font-medium text-gray-700'>{dashboardData.enrolledStudentsData.length}</p>
                <p className='text-base text-gray-500'>Tổng lượt đăng ký</p>
              </div>
            </div>
          </div>

          <div className='bg-white border border-gray-200 rounded-xl p-5 shadow-sm'>
            <div className='flex items-center gap-3'>
              <img src={assets.earning_icon} alt="" />
              <div>
                <p className='text-2xl font-medium text-gray-700'>{dashboardData.totalEarnings}</p>
                <p className='text-base text-gray-500'>Tổng doanh thu</p>
              </div>
            </div>
          </div>
        </div>

        <div className='bg-white border border-gray-200 rounded-xl p-5 md:p-6 shadow-sm'>
          <h2 className='pb-4 text-lg font-medium text-gray-800'>Đăng ký mới nhất</h2>
          <div className='overflow-x-auto rounded-lg border border-gray-100'>
            <table className='table-fixed md:table-auto w-full overflow-hidden'>
              <thead className='text-gray-900 border-b border-gray-200 text-sm text-left bg-gray-50'>
                <tr>
                  <th className='px-4 py-3 font-semibold text-center hidden sm:table-cell'>#</th>
                  <th className='px-4 py-3 font-semibold'>Tên học viên</th>
                  <th className='px-4 py-3 font-semibold'>Tên khóa học</th>
                </tr>
              </thead>
              <tbody className='text-sm text-gray-500'>
                {dashboardData.enrolledStudentsData.map((item, index) => (
                  <tr key={index} className='border-b border-gray-100 last:border-b-0'>
                    <td className='px-4 py-3 text-center hidden sm:table-cell'>{index + 1}</td>
                    <td className='md:px-4 px-2 py-3 flex items-center space-x-3'>
                      <img src={item.student.imageUrl} alt="Profile" className='w-9 h-9 rounded-full' />
                      <span className='truncate'>{item.student.name}</span>
                    </td>
                    <td className='px-4 py-3 truncate'>{item.courseTitle}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  ) : <Loading />
}

export default Dashboard
