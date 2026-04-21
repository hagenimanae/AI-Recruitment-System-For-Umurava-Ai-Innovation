"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const applicantController_1 = require("../controllers/applicantController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Configure multer to use in-memory storage so we can process buffers immediately
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({ storage });
// Get my applications (for recruiters) - MUST be before /:jobId
router.route('/my-applications')
    .get(applicantController_1.getMyApplications);
// Get all applicants (for candidate pool) - MUST be before /:jobId
router.route('/all')
    .get(applicantController_1.getAllApplicants);
router.route('/:jobId')
    .get(applicantController_1.getApplicantsByJobId)
    .post(upload.any(), applicantController_1.uploadApplicant); // `any()` allows handling different form data files gracefully
router.route('/:jobId/bulk')
    .post(upload.single('file'), applicantController_1.bulkUploadApplicants);
// Delete single applicant by ID
router.route('/single/:applicantId')
    .delete(applicantController_1.deleteApplicant);
// Recruiter applies for a job - allow both recruiters and admins
router.route('/:jobId/apply')
    .post(auth_1.recruiterOrAdmin, applicantController_1.applyForJob);
exports.default = router;
