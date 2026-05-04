import 'dotenv/config'
import { pipeline, env } from '@xenova/transformers'
import connectDB from '../configs/mongodb.js'
import Course from '../models/Course.js'

const MODEL_NAME = process.env.EMBEDDING_MODEL || 'Xenova/paraphrase-multilingual-MiniLM-L12-v2'
const BATCH_SIZE = Number(process.env.EMBEDDING_BATCH_SIZE || 20)
const FORCE = process.argv.includes('--force')

env.allowLocalModels = false

env.useBrowserCache = false

const stripHtml = (html = '') => String(html).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()

const buildCourseEmbeddingText = (course) => {
  const tags = Array.isArray(course.courseTags) ? course.courseTags.join(', ') : ''

  return [
    `Tieu de: ${course.courseTitle || ''}`,
    `Chu de: ${course.courseTopic || ''}`,
    `Trinh do: ${course.courseLevel || ''}`,
    `Tu khoa: ${tags}`,
    `Mo ta: ${stripHtml(course.courseDescription || '')}`
  ].join('\n')
}

const toVector = async (extractor, text) => {
  const output = await extractor(text, {
    pooling: 'mean',
    normalize: true
  })

  return Array.from(output.data, (value) => Number(value))
}

const run = async () => {
  await connectDB()
  const extractor = await pipeline('feature-extraction', MODEL_NAME)

  const targetCourses = await Course.find({
    ...(FORCE ? {} : {
      $or: [
        { aiEmbedding: { $exists: false } },
        { aiEmbedding: { $size: 0 } },
        { aiEmbeddingModel: { $ne: MODEL_NAME } }
      ]
    })
  }).select('_id courseTitle courseDescription courseTopic courseLevel courseTags aiEmbedding aiEmbeddingModel')

  if (targetCourses.length === 0) {
    console.log('Khong co khoa hoc nao can cap nhat embedding.')
    return
  }

  console.log(`Bat dau tao embedding cho ${targetCourses.length} khoa hoc voi model ${MODEL_NAME}`)

  let processed = 0
  for (let i = 0; i < targetCourses.length; i += BATCH_SIZE) {
    const batch = targetCourses.slice(i, i + BATCH_SIZE)

    for (const course of batch) {
      const text = buildCourseEmbeddingText(course)
      const vector = await toVector(extractor, text)

      await Course.updateOne(
        { _id: course._id },
        {
          $set: {
            aiEmbedding: vector,
            aiEmbeddingModel: MODEL_NAME,
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
