import React from 'react'
import { Outlet } from 'react-router-dom'
import Footer from '../../components/educator/Footer'
import Navbar from '../../components/admin/Navbar'
import Sidebar from '../../components/admin/Sidebar'
import AdminGuard from '../../components/admin/AdminGuard'

const Admin = () => {
  return (
    <AdminGuard>
      <div className='text-default min-h-screen bg-white'>
        <Navbar />
        <div className='flex bg-slate-50'>
          <Sidebar />
          <main className='flex-1 min-h-[calc(100vh-64px)] px-4 py-4 md:px-6 md:py-6 lg:px-8'>
            <div className='max-w-[1400px] mx-auto'>
              <Outlet />
            </div>
          </main>
        </div>
        <Footer />
      </div>
    </AdminGuard>
  )
}

export default Admin
