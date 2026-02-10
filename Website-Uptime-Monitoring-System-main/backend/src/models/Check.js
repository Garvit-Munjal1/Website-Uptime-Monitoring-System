import mongoose from 'mongoose';

const checkSchema = new mongoose.Schema(
  {
    monitorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Monitor', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: { type: String, enum: ['up', 'down'], required: true },
    responseTimeMs: Number,
    statusCode: Number,
    reason: String,
    checkedAt: { type: Date, default: Date.now, index: true }
  },
  { timestamps: true }
);

export const Check = mongoose.model('Check', checkSchema);
