import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { toast } from 'react-toastify'
import Loading from '../student/Loading'

const AdminGuard = ({ children }) => {
  const { user, isLoaded } = useUser()
  const navigate = useNavigate()
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    if (!isLoaded) return

    if (user?.publicMetadata?.role === 'admin') {
      setAuthorized(true)
      return
    }

    toast.error('Bạn không có quyền truy cập trang này')
    navigate('/')
  }, [isLoaded, user, navigate])

  if (!isLoaded) return <Loading />
  if (!authorized) return null

  return children
}

export default AdminGuard
