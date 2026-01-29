import mongoose from "mongoose"

// Connect to MongoDB
const connectDB = async () => {
  console.log('connectDB function called');
  mongoose.connection.on('connected', () => console.log('MongoDB connected successfully'));
  mongoose.connection.on('error', (err) => console.error('MongoDB connection error:', err));
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/lms`);
    console.log('Mongoose connect called with URI:', `${process.env.MONGODB_URI}/lms`);
  } catch (err) {
    console.error('MongoDB initial connection error:', err);
  }
}

export default connectDB