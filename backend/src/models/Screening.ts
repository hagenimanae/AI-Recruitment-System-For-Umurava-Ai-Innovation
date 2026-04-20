import mongoose, { Schema, Document } from 'mongoose';

export interface IScreening extends Document {
  jobId: mongoose.Types.ObjectId;
  applicantId: mongoose.Types.ObjectId;
  score: number;
  rank: number;
  strengths: string[];
  gaps: string[];
  recommendation: string;
  reasoningText: string;
  createdAt: Date;
  updatedAt: Date;
}

const ScreeningSchema: Schema = new Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  applicantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Applicant', required: true },
  score: { type: Number, required: true, min: 0, max: 100 },
  rank: { type: Number, default: 0 },
  strengths: { type: [String], required: true },
  gaps: { type: [String], required: true },
  recommendation: { type: String, required: true }, // e.g. "Highly Recommended", "Interview", "Reject"
  reasoningText: { type: String, required: true }
}, {
  timestamps: true
});

export default mongoose.models.Screening || mongoose.model<IScreening>('Screening', ScreeningSchema);
