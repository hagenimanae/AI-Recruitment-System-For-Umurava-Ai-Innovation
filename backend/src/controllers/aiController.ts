import { Request, Response } from 'express';
import { screenApplicants } from '../services/aiService';
import Screening from '../models/Screening';

export const triggerScreening = async (req: Request, res: Response): Promise<void> => {
  console.log(`[AI] POST /api/ai/${req.params.jobId}/screen`);
  try {
    const jobId = req.params.jobId as string;
    const results = await screenApplicants(jobId);
    res.status(200).json(results);
  } catch (error: any) {
    res.status(500).json({ message: 'Screening failed', error: error.message });
  }
};

export const getScreeningResults = async (req: Request, res: Response): Promise<void> => {
  console.log(`[AI] GET /api/ai/${req.params.jobId}/results`);
  try {
    const jobId = req.params.jobId as string;
    const results = await Screening.find({ jobId }).sort({ rank: 1 }).populate('applicantId', 'name email skills resumeText');
    res.status(200).json(results);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch screening results', error: error.message });
  }
};
