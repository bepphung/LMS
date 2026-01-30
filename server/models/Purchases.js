import mongoose from "mongoose"

const PurchaseSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Course' },
  userId: { type: String, required: true, ref: 'User' },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
}, { timestamps: true })

export const Purchase = mongoose.model('Purchase', PurchaseSchema)