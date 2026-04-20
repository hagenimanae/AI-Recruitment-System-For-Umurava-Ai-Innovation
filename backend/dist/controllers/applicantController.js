"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllApplicants = exports.getMyApplications = exports.applyForJob = exports.deleteApplicant = exports.bulkUploadApplicants = exports.uploadApplicant = exports.getApplicantsByJobId = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Applicant_1 = __importDefault(require("../models/Applicant"));
const Job_1 = __importDefault(require("../models/Job"));
const stream_1 = require("stream");
const pdfParse = require('pdf-parse');
const csvParser = require('csv-parser');
const safeString = (value) => {
    if (value === null || typeof value === 'undefined')
        return '';
    return String(value);
};
const parseList = (value) => {
    if (Array.isArray(value))
        return value.map((v) => safeString(v).trim()).filter(Boolean);
    if (typeof value === 'string')
        return value.split(',').map((v) => v.trim()).filter(Boolean);
    return [];
};
const parseJsonProfile = (profile) => {
    if (!profile)
        return null;
    if (typeof profile === 'object')
        return profile;
    if (typeof profile === 'string') {
        const trimmed = profile.trim();
        if (!trimmed)
            return null;
        return JSON.parse(trimmed);
    }
    return null;
};
const extractPdfText = async (buffer) => {
    const parsed = await pdfParse(buffer);
    return typeof parsed?.text === 'string' ? parsed.text : '';
};
const bufferToCsvRows = async (buffer) => {
    const rows = [];
    await new Promise((resolve, reject) => {
        const stream = stream_1.Readable.from(buffer.toString('utf8'));
        stream
            .pipe(csvParser())
            .on('data', (data) => rows.push(data))
            .on('end', () => resolve())
            .on('error', (err) => reject(err));
    });
    return rows;
};
const getApplicantsByJobId = async (req, res) => {
    try {
        const { jobId } = req.params;
        const applicants = await Applicant_1.default.find({ jobId }).sort({ createdAt: -1 });
        res.status(200).json(applicants);
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to fetch applicants', error: error.message });
    }
};
exports.getApplicantsByJobId = getApplicantsByJobId;
const uploadApplicant = async (req, res) => {
    try {
        const { jobId } = req.params;
        console.log(`[Upload] Received upload request for job: ${jobId}`);
        console.log(`[Upload] Content-Type: ${req.headers['content-type']}`);
        console.log(`[Upload] req.body:`, req.body);
        console.log(`[Upload] req.files:`, req.files);
        console.log(`[Upload] req.file:`, req.file);
        const job = await Job_1.default.findById(jobId);
        if (!job) {
            res.status(404).json({ message: 'Job not found' });
            return;
        }
        const profile = parseJsonProfile(req.body?.profile);
        if (profile) {
            const name = safeString(profile.name || profile.fullName || 'Unknown').trim() || 'Unknown';
            const email = safeString(profile.email || `${name.replace(/\s+/g, '.').toLowerCase()}@example.com`).trim();
            const phone = safeString(profile.phone || profile.mobile).trim();
            const skills = parseList(profile.skills);
            const experience = Array.isArray(profile.experience) ? profile.experience : [];
            const education = Array.isArray(profile.education) ? profile.education : [];
            const resumeText = safeString(profile.resumeText || profile.summary || JSON.stringify(profile)).trim() || 'N/A';
            const created = await Applicant_1.default.create({
                jobId,
                name,
                email,
                phone: phone || undefined,
                resumeText,
                skills,
                experience,
                education,
                structuredData: profile,
            });
            res.status(201).json(created);
            return;
        }
        const files = (req.files || []);
        if (!files || files.length === 0) {
            res.status(400).json({ message: 'No profile JSON or files provided' });
            return;
        }
        const createdApplicants = [];
        for (const file of files) {
            const mimetype = safeString(file.mimetype).toLowerCase();
            const originalname = safeString(file.originalname);
            const baseName = originalname.replace(/\.[^.]+$/, '') || 'Candidate';
            if (mimetype.includes('pdf') || originalname.toLowerCase().endsWith('.pdf')) {
                const resumeText = await extractPdfText(file.buffer);
                const created = await Applicant_1.default.create({
                    jobId,
                    name: baseName,
                    email: `${baseName.replace(/\s+/g, '.').toLowerCase()}@example.com`,
                    resumeText: resumeText || 'N/A',
                    skills: [],
                    experience: [],
                    education: [],
                });
                createdApplicants.push(created);
                continue;
            }
            if (mimetype.includes('csv') || originalname.toLowerCase().endsWith('.csv')) {
                const rows = await bufferToCsvRows(file.buffer);
                for (const row of rows) {
                    const name = safeString(row.name || row.fullName || 'Unknown').trim() || 'Unknown';
                    const email = safeString(row.email || `${name.replace(/\s+/g, '.').toLowerCase()}@example.com`).trim();
                    const resumeText = safeString(row.resumeText || row.summary || '').trim() || 'N/A';
                    const skills = parseList(row.skills);
                    const created = await Applicant_1.default.create({
                        jobId,
                        name,
                        email,
                        resumeText,
                        skills,
                        experience: [],
                        education: [],
                        structuredData: row,
                    });
                    createdApplicants.push(created);
                }
                continue;
            }
            // Support text files (.txt, .doc as plain text)
            if (mimetype.includes('text') ||
                originalname.toLowerCase().endsWith('.txt') ||
                originalname.toLowerCase().endsWith('.doc') ||
                originalname.toLowerCase().endsWith('.docx')) {
                const textContent = file.buffer.toString('utf8');
                const created = await Applicant_1.default.create({
                    jobId,
                    name: baseName,
                    email: `${baseName.replace(/\s+/g, '.').toLowerCase()}@example.com`,
                    resumeText: textContent || 'N/A',
                    skills: [],
                    experience: [],
                    education: [],
                });
                createdApplicants.push(created);
                continue;
            }
            // Unsupported file type
            res.status(400).json({ message: `Unsupported file type: ${originalname}. Please upload PDF, CSV, TXT, or DOC files.` });
            return;
        }
        res.status(201).json(createdApplicants.length === 1 ? createdApplicants[0] : createdApplicants);
    }
    catch (error) {
        console.error('[Upload] Error:', error);
        res.status(400).json({ message: 'Failed to upload applicant', error: error.message, stack: error.stack });
    }
};
exports.uploadApplicant = uploadApplicant;
const bulkUploadApplicants = async (req, res) => {
    try {
        const { jobId } = req.params;
        const job = await Job_1.default.findById(jobId);
        if (!job) {
            res.status(404).json({ message: 'Job not found' });
            return;
        }
        const file = req.file;
        if (!file) {
            res.status(400).json({ message: 'No file provided' });
            return;
        }
        const rows = await bufferToCsvRows(file.buffer);
        const createdApplicants = await Applicant_1.default.insertMany(rows.map((row) => {
            const name = safeString(row.name || row.fullName || 'Unknown').trim() || 'Unknown';
            const email = safeString(row.email || `${name.replace(/\s+/g, '.').toLowerCase()}@example.com`).trim();
            const resumeText = safeString(row.resumeText || row.summary || '').trim() || 'N/A';
            const skills = parseList(row.skills);
            return {
                jobId,
                name,
                email,
                resumeText,
                skills,
                experience: [],
                education: [],
                structuredData: row,
            };
        }), { ordered: false });
        res.status(201).json(createdApplicants);
    }
    catch (error) {
        res.status(400).json({ message: 'Failed to bulk upload applicants', error: error.message });
    }
};
exports.bulkUploadApplicants = bulkUploadApplicants;
const deleteApplicant = async (req, res) => {
    try {
        const { applicantId } = req.params;
        const deleted = await Applicant_1.default.findByIdAndDelete(applicantId);
        if (!deleted) {
            res.status(404).json({ message: 'Applicant not found' });
            return;
        }
        res.status(200).json({ message: 'Applicant deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to delete applicant', error: error.message });
    }
};
exports.deleteApplicant = deleteApplicant;
// Recruiter applies for a job
const applyForJob = async (req, res) => {
    try {
        const { jobId } = req.params;
        const userId = req.user?.userId; // From auth middleware
        if (!userId) {
            res.status(401).json({ message: 'Not authenticated' });
            return;
        }
        const job = await Job_1.default.findById(jobId);
        if (!job) {
            res.status(404).json({ message: 'Job not found' });
            return;
        }
        // Check if user already applied
        const existingApplication = await Applicant_1.default.findOne({ jobId, userId });
        if (existingApplication) {
            res.status(400).json({ message: 'You have already applied for this job' });
            return;
        }
        const { name, email, phone, skills, experience, education, resumeText } = req.body;
        const applicant = await Applicant_1.default.create({
            jobId,
            userId,
            name,
            email,
            phone: phone || undefined,
            resumeText: resumeText || 'N/A',
            skills: parseList(skills),
            experience: experience || [],
            education: education || [],
        });
        res.status(201).json({ message: 'Application submitted successfully', applicant });
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to submit application', error: error.message });
    }
};
exports.applyForJob = applyForJob;
// Get recruiter's applications with screening results
const getMyApplications = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ message: 'Not authenticated' });
            return;
        }
        // Get all applications by this user
        const applications = await Applicant_1.default.find({ userId }).populate('jobId', 'title department location');
        // Get screening results for these applications
        const Screening = mongoose_1.default.model('Screening');
        const screeningResults = await Screening.find({
            applicantId: { $in: applications.map(a => a._id) }
        }).populate('jobId', 'title');
        // Combine applications with their screening results
        const applicationsWithResults = applications.map(app => {
            const result = screeningResults.find((r) => r.applicantId?.toString() === app._id.toString());
            return {
                ...app.toObject(),
                screeningResult: result || null
            };
        });
        res.status(200).json(applicationsWithResults);
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to fetch applications', error: error.message });
    }
};
exports.getMyApplications = getMyApplications;
// Get all applicants across all jobs (for candidate pool)
const getAllApplicants = async (req, res) => {
    try {
        const applicants = await Applicant_1.default.find()
            .populate('jobId', 'title department location')
            .sort({ createdAt: -1 });
        res.status(200).json(applicants);
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to fetch applicants', error: error.message });
    }
};
exports.getAllApplicants = getAllApplicants;
