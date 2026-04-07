import express from 'express'
import { requireAuth } from '../middlewares/authMiddleware.js'
import {
  chatWithAI,
  summarizeLesson,
  generateQuiz,
  getRecommendations,
  generateCourseDescription,
  checkAIStatus
} from '../controllers/aiController.js'

const aiRouter = express.Router()

// Check AI availability
aiRouter.get('/status', checkAIStatus)

// AI Chatbot - requires authentication
aiRouter.post('/chat', requireAuth, chatWithAI)

// Summarize lesson content
aiRouter.post('/summarize', requireAuth, summarizeLesson)

// Generate quiz questions
aiRouter.post('/generate-quiz', requireAuth, generateQuiz)

// Get course recommendations
aiRouter.get('/recommendations', requireAuth, getRecommendations)

// Generate course description (for educators)
aiRouter.post('/generate-description', requireAuth, generateCourseDescription)

export default aiRouter
