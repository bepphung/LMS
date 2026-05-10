import 'dotenv/config'
import connectDB from '../configs/mongodb.js'
import Course from '../models/Course.js'
import {
  EMBEDDING_MODEL_NAME,
  generateCourseEmbeddingVector,
  getEmbeddingExtractor
} from '../utils/embeddingHelper.js'

const BATCH_SIZE = Number(process.env.EMBEDDING_BATCH_SIZE || 20)
const FORCE = process.argv.includes('--force')

const run = async () => {
  await connectDB()
  const extractor = await getEmbeddingExtractor()

  const targetCourses = await Course.find({
    ...(FORCE ? {} : {
      $or: [
        { aiEmbedding: { $exists: false } },
        { aiEmbedding: { $size: 0 } },
        { aiEmbeddingModel: { $ne: EMBEDDING_MODEL_NAME } }
      ]
    })
  }).select('_id courseTitle courseDescription courseTopic courseLevel courseTags aiEmbedding aiEmbeddingModel')

  if (targetCourses.length === 0) {
    console.log('Khong co khoa hoc nao can cap nhat embedding.')
    return
  }

  console.log(`Bat dau tao embedding cho ${targetCourses.length} khoa hoc voi model ${EMBEDDING_MODEL_NAME}`)

  let processed = 0
  for (let i = 0; i < targetCourses.length; i += BATCH_SIZE) {
    const batch = targetCourses.slice(i, i + BATCH_SIZE)

    for (const course of batch) {
      const vector = await generateCourseEmbeddingVector(course, extractor)

      await Course.updateOne(
        { _id: course._id },
        {
          $set: {
            aiEmbedding: vector,
            aiEmbeddingModel: EMBEDDING_MODEL_NAME,
            aiEmbeddingUpdatedAt: new Date()
          }
        }
      )

      processed += 1
      console.log(`Da xu ly ${processed}/${targetCourses.length}: ${course.courseTitle}`)
    }
  }

  console.log('Hoan tat tao embedding cho tat ca khoa hoc.')
}

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Loi tao embedding:', error)
    process.exit(1)
  })
