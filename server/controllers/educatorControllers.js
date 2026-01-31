import { clerkClient } from '@clerk/express'
import { v2 as cloudinary } from 'cloudinary'
import Course from '../models/Course.js'
import { Purchase } from '../models/Purchases.js'
import User from '../models/User.js'

export const updateRoleEducator = async (req, res) => {
  try {
    const userId = req.auth.userId
    await clerkClient.users.updateUser(userId, {
      publicMetadata: {
        role: 'educator',
      }
    })

    res.json({success: true, message: 'You can now create courses'})
  } catch (error) {
    res.json({success: false, message: error.message} )
  }
}

export const addCourse = async (req, res) => {
  try {
    const { courseData } = req.body
    const imageFile = req.file
    const userId = req.auth.userId

    if (!imageFile) {
      return res.json({ success: false, message: 'Thumbnail not attached' });
    }

    const parseCourseData = await JSON.parse(courseData)
    parseCourseData.educator = userId
    const newCourse = await Course.create(parseCourseData)
    const imageUpload = await cloudinary.uploader.upload(imageFile.path)
    newCourse.courseThumbnail = imageUpload.secure_url
    await newCourse.save()

    res.json({ success: true, message: 'Course created successfully'})

  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

// Get educator courses
export const getEducatorCourses = async (req, res) => {
  try {
    const educator = req.auth.userId
    const courses = await Course.find({ educator })
    res.json({ success: true, courses })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

// Get educator dashboard data
export const educatorDashboardData = async (req, res) => {
  try {
    const educator = req.auth.userId
    const courses = await Course.find({ educator })
    const totalCourses = courses.length
    const courseIds = courses.map(course => course._id)

    // Calculate total earnings from purchases
    const purchases = await Purchase.find({
      courseId: { $in: courseIds },
      status: 'completed'
    })

    const totalEarnings = purchases.reduce((sum, purchase) => sum + purchase.amount, 0)

    // Collect unique enrolled students IDs with their course titles
    const enrolledStudentsData = []
    for (const course of courses) {
      const students = await User.find({
        _id: { $in: course.enrolledStudents }
      }, 'name imageUrl')
      students.forEach(student => {
        enrolledStudentsData.push({
          student,
          courseTitle: course.courseTitle
        })
      })
    }
    res.json({ success: true, data: {
      totalEarnings,
      enrolledStudentsData,
      totalCourses
    }})
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}

// Get enrolled students data with purchase data
export const getEnrolledStudentsData = async (req, res) => {
  try {
    const educator = req.auth.userId
    const courses = await Course.find({ educator })
    const courseIds = courses.map(course => course._id)
    const purchases = await Purchase.find({
      courseId: { $in: courseIds },
      status: 'completed'
    }).populate('userId', 'name imageUrl').populate('courseId', 'courseTitle')
    const enrolledStudents = purchases.map(purchase => ({
      student: purchase.userId,
      courseTitle: purchase.courseId.courseTitle,
      purchaseDate: purchase.createdAt
    }))
    res.json({ success: true, enrolledStudents })
  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}