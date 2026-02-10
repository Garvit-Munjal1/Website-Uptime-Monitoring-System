import mongoose from 'mongoose';

const incidentSchema = new mongoose.Schema(
  {
    monitorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Monitor', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    startedAt: { type: Date, required: true },
    endedAt: Date,
    rootCauseGuess: String,
    timeline: [
      {
        at: Date,
        message: String
      }
    ]
  },
  { timestamps: true }
);

incidentSchema.index({ monitorId: 1, startedAt: -1 });

export const Incident = mongoose.model('Incident', incidentSchema);
