import express from 'express'
import { getAllCourses, getCourseId, getSemanticOverview } from '../controllers/courseController.js'

const courseRouter = express.Router()

courseRouter.get('/all', getAllCourses)
courseRouter.get('/semantic-overview', getSemanticOverview)
courseRouter.post('/semantic-overview', getSemanticOverview)
courseRouter.get('/:id', getCourseId)

export default courseRouter