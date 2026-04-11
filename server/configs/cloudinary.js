import { v2 as cloudinary } from 'cloudinary'

const getCloudinaryConfig = () => {
  const cloud_name = process.env.CLOUDINARY_NAME || process.env.CLOUDINARY_CLOUD_NAME
  const api_key = process.env.CLOUDINARY_API_KEY
  const api_secret = process.env.CLOUDINARY_SECRET_KEY || process.env.CLOUDINARY_API_SECRET

  return { cloud_name, api_key, api_secret }
}

const isCloudinaryConfigured = () => {
  const { cloud_name, api_key, api_secret } = getCloudinaryConfig()
  return Boolean(cloud_name && api_key && api_secret)
}

export const assertCloudinaryConfigured = () => {
  if (!isCloudinaryConfigured()) {
    throw new Error(
      'Missing Cloudinary configuration. Set CLOUDINARY_API_KEY and either CLOUDINARY_NAME/CLOUDINARY_CLOUD_NAME and CLOUDINARY_SECRET_KEY/CLOUDINARY_API_SECRET.'
    )
  }
}

const connectCloudinary = async () => {
  const config = getCloudinaryConfig()
  if (!isCloudinaryConfigured()) {
    console.warn('Cloudinary is not fully configured. Upload endpoints will fail until env vars are set.')
    return
  }

  cloudinary.config(config)
}

export default connectCloudinary
