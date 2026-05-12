import React from 'react'
import { Link } from 'react-router-dom'
import { UserButton, useUser } from '@clerk/clerk-react'
import { assets } from '../../assets/assets'

const Navbar = () => {
  const { user } = useUser()

  return (
    <div className='flex items-center justify-between px-4 md:px-8 border-b border-gray-500 py-3 bg-white'>
      <Link to='/admin'>
        <img src={assets.logo} alt="Logo" className='w-28 lg:w-32' />
      </Link>
      <div className='flex items-center gap-5 text-gray-500'>
        <p>Hi! {user?.fullName || 'Admin'}</p>
        <UserButton />
      </div>
    </div>
  )
}

export default Navbar
