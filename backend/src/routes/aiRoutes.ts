import express from 'express';
import { triggerScreening, getScreeningResults } from '../controllers/aiController';

const router = express.Router();

router.route('/:jobId/screen').post(triggerScreening);
router.route('/:jobId/results').get(getScreeningResults);

export default router;
