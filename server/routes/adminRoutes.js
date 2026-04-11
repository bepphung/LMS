import express from 'express'
import {
  getAdminDashboard,
  getEducatorApplications,
  getApplicationDetails,
  downloadApplicationCv,
  approveApplication,
  rejectApplication,
  getAllUsers,
  banUserAccount,
  unbanUserAccount,
  getAllCoursesAdmin,
  deleteCourseAdmin,
  toggleCourseVisibilityAdmin,
} from '../controllers/adminController.js'
import { protectAdmin } from '../middlewares/authMiddleware.js'

const adminRouter = express.Router()

// All admin routes require admin role
adminRouter.use(protectAdmin)

// Dashboard
adminRouter.get('/dashboard', getAdminDashboard)

// Educator Applications
adminRouter.get('/applications', getEducatorApplications)
adminRouter.get('/applications/:applicationId', getApplicationDetails)
adminRouter.get('/applications/:applicationId/cv-download', downloadApplicationCv)
adminRouter.post('/applications/:applicationId/approve', approveApplication)
adminRouter.post('/applications/:applicationId/reject', rejectApplication)

// User Management
adminRouter.get('/users', getAllUsers)
adminRouter.patch('/users/:userId/ban', banUserAccount)
adminRouter.patch('/users/:userId/unban', unbanUserAccount)

// Course Management
adminRouter.get('/courses', getAllCoursesAdmin)
adminRouter.delete('/courses/:courseId', deleteCourseAdmin)
adminRouter.patch('/courses/:courseId/toggle-visibility', toggleCourseVisibilityAdmin)

export default adminRouter
