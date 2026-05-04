import React, { useContext } from 'react'
import { assets } from './../../assets/assets'
import { Link } from 'react-router-dom'
import { useClerk, UserButton, useUser } from '@clerk/clerk-react'
import { AppContext } from '../../context/AppContext'

const Navbar = () => {

  const { navigate, isEducator } = useContext(AppContext)
  const isCourseListPage = location.pathname.includes('/course-list')

  const { openSignIn } = useClerk()
  const { user } = useUser()

  const isAdmin = user?.publicMetadata?.role === 'admin'

  const handleEducatorClick = () => {
    if (isEducator) {
      navigate('/my-enrollments')
    } else {
      navigate('/become-educator')
    }
  }

  return (
    <div className={`flex items-center justify-between px-4 sm:px-10 md:px-14 lg:px-36 border-b border-gray-500 py-4 ${isCourseListPage ? 'bg-white' : 'bg-cyan-100/70'}`}>
      <img onClick={() => navigate('/')} src={assets.logo} alt='Logo' className='w-28.75 h-8.5 cursor-pointer'/>
      <div className='hidden md:flex items-center gap-5 text-gray-500 '>
        <div className='flex items-center gap-5 '>
          { user && 
          <>
          {isAdmin && (
            <>
            <Link to='/admin' className='text-red-600 font-medium hover:text-red-700'>Admin</Link>
            |
            </>
          )}
          <button className='cursor-pointer hover:text-gray-700' onClick={handleEducatorClick}>
            {isEducator ? 'Lớp học của tôi' : 'Trở thành giảng viên'}
          </button>
          | <Link to={isEducator ? '/educator' : '/my-enrollments'} className='hover:text-gray-700'>{isEducator ? 'Trang giảng viên' : 'Lớp học của tôi'}</Link>
          </>
          }
        </div>
        { user ? <UserButton /> 
        : <button onClick={() => openSignIn()} className='bg-blue-600 text-white px-5 py-2 rounded-full cursor-pointer hover:bg-blue-700'>Đăng ký/Đăng nhập</button>}
      </div>

      {/* For phone screen */}
      <div className='md:hidden flex items-center gap-2 sm:gap-0.5 text-gray-500'>
        <div className='flex items-center gap-1 sm:gap-2 max-sm:text-xs'>
          { user && 
          <>
          {isAdmin && (
            <>
            <Link to='/admin' className='text-red-600 font-medium'>Admin</Link>
            |
            </>
          )}
          <button className='cursor-pointer' onClick={handleEducatorClick}>
            {isEducator ? 'Lớp học' : 'Trở thành GV'}
          </button>
          | <Link to={isEducator ? '/educator' : '/my-enrollments'}>{isEducator ? 'Giảng viên' : 'Lớp học'}</Link>
          </>
          }
        </div>
        {
          user ? <UserButton /> : <button onClick={() => openSignIn()} className='cursor-pointer'><img src={assets.user_icon} alt="User Icon" /></button>
        }
        
      </div>
    </div>
  )
}

export default Navbar