import mongoose from 'mongoose';

const monitorSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    url: { type: String, required: true },
    intervalSeconds: { type: Number, default: 60, min: 30, max: 900 },
    adaptiveIntervalSeconds: { type: Number, default: 60, min: 30, max: 900 },
    expectedStatusCodes: { type: [Number], default: [200, 201, 202, 204, 301, 302] },
    isActive: { type: Boolean, default: true },
    currentStatus: { type: String, enum: ['up', 'down', 'unknown'], default: 'unknown' },
    uptimePercent30d: { type: Number, default: 100 },
    lastCheckedAt: Date,
    nextCheckAt: { type: Date, default: Date.now },
    downSince: Date,
    resilienceScore: { type: Number, default: 100 },
    outageFingerprint: { type: String, default: 'stable' },
    outageFingerprintDetails: { type: String, default: 'Insufficient signal for classification.' },
    outageFingerprintConfidence: { type: Number, default: 0 },
    outageFingerprintUpdatedAt: Date,
    riskWindowScore: { type: Number, default: 0 },
    smartPriority: { type: String, default: 'normal' },
    stabilityScore: { type: Number, default: 100 },
    failureDensity: { type: Number, default: 0 },
    responseVarianceMs: { type: Number, default: 0 },
    lastRecoveredAt: Date,
    adaptiveIntervalReason: { type: String, default: 'Using configured base interval.' }
  },
  { timestamps: true }
);

monitorSchema.index({ userId: 1, nextCheckAt: 1 });
export const Monitor = mongoose.model('Monitor', monitorSchema);
