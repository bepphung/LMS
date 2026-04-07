import mongoose from "mongoose"

// Connect to MongoDB
const connectDB = async () => {
  mongoose.connection.on('connected', () => console.log('MongoDB connected successfully'));
  mongoose.connection.on('error', (err) => console.error('MongoDB connection error:', err));
  try {
    const mongoUri = process.env.MONGODB_URI
    if (!mongoUri) {
      throw new Error('Missing MONGODB_URI environment variable')
    }
    await mongoose.connect(`${mongoUri}/lms`)
  } catch (err) {
    console.error('MongoDB initial connection error:', err);
    throw err
  }
}

export default connectDB
