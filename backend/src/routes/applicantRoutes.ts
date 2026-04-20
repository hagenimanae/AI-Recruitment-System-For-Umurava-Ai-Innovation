import express from 'express';
import multer from 'multer';
import { uploadApplicant, getApplicantsByJobId, bulkUploadApplicants, deleteApplicant, applyForJob, getMyApplications, getAllApplicants } from '../controllers/applicantController';

const router = express.Router();

// Configure multer to use in-memory storage so we can process buffers immediately
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Get my applications (for recruiters) - MUST be before /:jobId
router.route('/my-applications')
  .get(getMyApplications);

// Get all applicants (for candidate pool) - MUST be before /:jobId
router.route('/all')
  .get(getAllApplicants);

router.route('/:jobId')
  .get(getApplicantsByJobId)
  .post(upload.any(), uploadApplicant); // `any()` allows handling different form data files gracefully

router.route('/:jobId/bulk')
  .post(upload.single('file'), bulkUploadApplicants);

// Delete single applicant by ID
router.route('/single/:applicantId')
  .delete(deleteApplicant);

// Recruiter applies for a job
router.route('/:jobId/apply')
  .post(applyForJob);

export default router;
