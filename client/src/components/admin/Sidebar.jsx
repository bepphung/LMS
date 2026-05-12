import React from 'react'
import { NavLink } from 'react-router-dom'
import { assets } from '../../assets/assets'

const menuItems = [
  { name: 'Dashboard', path: '/admin', icon: assets.home_icon, end: true },
  { name: 'Duyệt giảng viên', path: '/admin/applications', icon: assets.add_icon },
  { name: 'Quản lý người dùng', path: '/admin/users', icon: assets.person_tick_icon },
  { name: 'Quản lý khóa học', path: '/admin/courses', icon: assets.my_course_icon }
]

const Sidebar = () => {
  return (
    <div className='md:w-64 w-16 border-r min-h-[calc(100vh-64px)] text-base border-gray-200 py-3 flex flex-col bg-white'>
      {menuItems.map((item) => (
        <NavLink
          to={item.path}
          key={item.path}
          end={item.end}
          className={({ isActive }) =>
            `flex items-center md:flex-row flex-col md:justify-start justify-center py-3.5 md:px-8 gap-3 ${
              isActive
                ? 'bg-indigo-50 border-r-[6px] border-indigo-500/90'
                : 'hover:bg-gray-100/90 border-r-[6px] border-white hover:border-gray-100/90'
            }`
          }
        >
          <img src={item.icon} alt='' className='w-6 h-6' />
          <p className='md:block hidden text-left w-full'>{item.name}</p>
        </NavLink>
      ))}
    </div>
  )
}

export default Sidebar
