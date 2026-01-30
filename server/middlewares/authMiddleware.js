import { clerkClient } from "@clerk/express"

// Middleware to protect routes for educators only

export const protectEducator = async (req, res, next) => {
  try {
    const userId = req.auth.userId
    const response = await clerkClient.users.getUser(userId)
    if (response.publicMetadata.role !== 'educator') {
      return res.status(403).json({ success: false, message: 'Access denied. Educators only.' })
    }
    next()
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}