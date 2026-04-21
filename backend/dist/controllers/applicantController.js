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
// Helper to check if string is valid ObjectId
const isValidObjectId = (id) => {
    return mongoose_1.default.Types.ObjectId.isValid(id);
};
// Import pdf-parse properly
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
// Map incoming profile to new Talent Profile Schema
const mapToTalentProfile = (profile) => {
    if (!profile)
        return null;
    // Handle both old and new schema formats
    const firstName = profile.firstName || profile.first_name || (profile.name ? profile.name.split(' ')[0] : '');
    const lastName = profile.lastName || profile.last_name || (profile.name ? profile.name.split(' ').slice(1).join(' ') : '');
    return {
        // 3.1 Basic Information
        firstName: firstName || 'Unknown',
        lastName: lastName || 'Candidate',
        email: profile.email || `${firstName?.toLowerCase()}.${lastName?.toLowerCase()}@example.com`,
        headline: profile.headline || profile.title || profile.role || 'Professional',
        bio: profile.bio || profile.summary || profile.about || '',
        location: profile.location || profile.city || profile.country || 'Remote',
        phone: profile.phone || profile.mobile || profile.telephone || '',
        // 3.2 Skills & Languages (new format)
        skills: Array.isArray(profile.skills)
            ? profile.skills.map((s) => ({
                name: typeof s === 'string' ? s : (s.name || ''),
                level: s.level || 'Intermediate',
                yearsOfExperience: s.yearsOfExperience || s.years || 0
            })).filter((s) => s.name)
            : parseList(profile.skills).map((name) => ({ name, level: 'Intermediate', yearsOfExperience: 0 })),
        languages: Array.isArray(profile.languages)
            ? profile.languages.map((l) => ({
                name: typeof l === 'string' ? l : (l.name || ''),
                proficiency: l.proficiency || 'Conversational'
            })).filter((l) => l.name)
            : [],
        // 3.3 Work Experience
        experience: Array.isArray(profile.experience)
            ? profile.experience.map((e) => ({
                company: e.company || e.organization || e.employer || 'Company',
                role: e.role || e.title || e.position || 'Role',
                startDate: e.startDate || e.start_date || e.from || '2020-01',
                endDate: e.endDate || e.end_date || e.to || '',
                description: e.description || e.summary || e.responsibilities || '',
                technologies: Array.isArray(e.technologies) ? e.technologies : parseList(e.technologies),
                isCurrent: e.isCurrent || e.is_current || e.current || (!e.endDate && !e.end_date) || false
            }))
            : [],
        // 3.4 Education
        education: Array.isArray(profile.education)
            ? profile.education.map((edu) => ({
                institution: edu.institution || edu.school || edu.university || 'Institution',
                degree: edu.degree || edu.title || 'Degree',
                fieldOfStudy: edu.fieldOfStudy || edu.field_of_study || edu.major || edu.field || 'Field',
                startYear: edu.startYear || edu.start_year || edu.year || 2020,
                endYear: edu.endYear || edu.end_year || undefined
            }))
            : [],
        // 3.5 Certifications
        certifications: Array.isArray(profile.certifications)
            ? profile.certifications.map((cert) => ({
                name: cert.name || cert.title || 'Certification',
                issuer: cert.issuer || cert.organization || cert.provider || 'Issuer',
                issueDate: cert.issueDate || cert.issue_date || cert.date || '2024-01'
            }))
            : [],
        // 3.6 Projects
        projects: Array.isArray(profile.projects)
            ? profile.projects.map((p) => ({
                name: p.name || p.title || 'Project',
                description: p.description || p.summary || '',
                technologies: Array.isArray(p.technologies) ? p.technologies : parseList(p.technologies),
                role: p.role || p.position || '',
                link: p.link || p.url || p.github || '',
                startDate: p.startDate || p.start_date || '',
                endDate: p.endDate || p.end_date || ''
            }))
            : [],
        // 3.7 Availability
        availability: {
            status: profile.availability?.status || profile.status || 'Available',
            type: profile.availability?.type || profile.type || 'Full-time',
            startDate: profile.availability?.startDate || profile.startDate || ''
        },
        // 3.8 Social Links
        socialLinks: {
            linkedin: profile.socialLinks?.linkedin || profile.linkedin || profile.linkedinUrl || '',
            github: profile.socialLinks?.github || profile.github || profile.githubUrl || '',
            portfolio: profile.socialLinks?.portfolio || profile.portfolio || profile.website || profile.url || ''
        }
    };
};
const extractPdfText = async (buffer) => {
    try {
        console.log('[PDF] Starting PDF parsing, buffer size:', buffer.length);
        // Validate buffer is not empty
        if (!buffer || buffer.length === 0) {
            console.error('[PDF] Empty buffer received');
            return 'Error: Empty PDF file';
        }
        // Check PDF magic number (PDF files start with %PDF)
        const pdfMagic = buffer.slice(0, 4).toString('ascii');
        if (!pdfMagic.includes('%PDF')) {
            console.error('[PDF] Invalid PDF format, magic bytes:', pdfMagic);
            return 'Error: Invalid PDF format';
        }
        // Use pdf-parse to extract text
        console.log('[PDF] Calling pdfParse...');
        const data = await pdfParse(buffer);
        const text = data?.text || '';
        console.log('[PDF] Extracted text length:', text.length);
        if (text && text.trim().length > 0) {
            return text;
        }
        console.log('[PDF] No text extracted, storing for manual review');
        return 'PDF uploaded successfully (text extraction limited). Resume stored for manual review.';
    }
    catch (error) {
        console.error('[PDF Parse Error]', error?.message || error);
        return `PDF uploaded (parsing error: ${error?.message || 'Unknown error'}). Resume stored.`;
    }
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
            // Map to new Talent Profile Schema
            const talentProfile = mapToTalentProfile(profile);
            const created = await Applicant_1.default.create({
                jobId,
                ...talentProfile,
                structuredData: profile, // Keep original for reference
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
                // Parse PDF content into structured profile if possible
                const pdfProfile = mapToTalentProfile({
                    firstName: baseName.split(' ')[0] || 'Candidate',
                    lastName: baseName.split(' ').slice(1).join(' ') || '',
                    email: `${baseName.replace(/\s+/g, '.').toLowerCase()}@example.com`,
                    headline: 'Professional',
                    location: 'Remote',
                    resumeText: resumeText || 'N/A',
                    skills: [],
                    experience: [],
                    education: []
                });
                const created = await Applicant_1.default.create({
                    jobId,
                    ...pdfProfile,
                    structuredData: { source: 'pdf', fileName: originalname }
                });
                createdApplicants.push(created);
                continue;
            }
            if (mimetype.includes('csv') || originalname.toLowerCase().endsWith('.csv')) {
                const rows = await bufferToCsvRows(file.buffer);
                for (const row of rows) {
                    // Map CSV row to Talent Profile Schema
                    const talentProfile = mapToTalentProfile(row);
                    const created = await Applicant_1.default.create({
                        jobId,
                        ...talentProfile,
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
                const txtProfile = mapToTalentProfile({
                    firstName: baseName.split(' ')[0] || 'Candidate',
                    lastName: baseName.split(' ').slice(1).join(' ') || '',
                    email: `${baseName.replace(/\s+/g, '.').toLowerCase()}@example.com`,
                    headline: 'Professional',
                    location: 'Remote',
                    resumeText: textContent || 'N/A',
                    skills: [],
                    experience: [],
                    education: []
                });
                const created = await Applicant_1.default.create({
                    jobId,
                    ...txtProfile,
                    structuredData: { source: 'text', fileName: originalname }
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
            const talentProfile = mapToTalentProfile(row);
            return {
                jobId,
                ...talentProfile,
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
// Recruiter applies for a job - FIXED: Uses authenticated user's name/email from DB
const applyForJob = async (req, res) => {
    try {
        const { jobId } = req.params;
        const userId = req.user?.userId; // From auth middleware
        console.log('[Apply] ===== STARTING APPLICATION =====');
        console.log('[Apply] JobId:', jobId);
        console.log('[Apply] UserId from JWT:', userId);
        if (!userId) {
            console.log('[Apply] ERROR: No userId found in request');
            res.status(401).json({ message: 'Not authenticated. Please login again.' });
            return;
        }
        // Ensure jobId is a string (req.params can return string | string[])
        const jobIdStr = Array.isArray(jobId) ? jobId[0] : jobId;
        // Validate jobId format
        if (!isValidObjectId(jobIdStr)) {
            console.log('[Apply] ERROR: Invalid jobId format:', jobIdStr);
            res.status(400).json({ message: 'Invalid job ID format' });
            return;
        }
        // Convert userId to ObjectId
        const userObjectId = isValidObjectId(userId) ? new mongoose_1.default.Types.ObjectId(userId) : userId;
        // Fetch the user from database to get their stored name and email
        const User = require('../models/User').default;
        const user = await User.findById(userObjectId).select('+name email');
        if (!user) {
            console.log('[Apply] ERROR: User not found in database for ID:', userId);
            res.status(404).json({ message: 'User not found in database' });
            return;
        }
        console.log('[Apply] Found user:', { name: user.name, email: user.email });
        // Split user's name into first and last name
        const nameParts = (user.name || '').split(' ').filter((n) => n.trim());
        const firstName = nameParts[0] || 'Unknown';
        const lastName = nameParts.slice(1).join(' ') || 'Candidate';
        const email = user.email || 'no-email@example.com';
        console.log('[Apply] Extracted from user:', { firstName, lastName, email });
        const job = await Job_1.default.findById(jobIdStr);
        if (!job) {
            res.status(404).json({ message: 'Job not found' });
            return;
        }
        // Check if user already applied
        const existingApplication = await Applicant_1.default.findOne({ jobId: jobIdStr, userId: userObjectId });
        if (existingApplication) {
            res.status(400).json({ message: 'You have already applied for this job' });
            return;
        }
        // Get optional data from request body (frontend can send these but they're not required)
        const body = req.body || {};
        console.log('[Apply] Optional body data:', JSON.stringify(body, null, 2));
        // Sanitize experience data - remove entries missing required fields
        const sanitizeExperience = (exp) => {
            if (!Array.isArray(exp))
                return [];
            return exp.filter((e) => e && e.company && e.company.trim() && e.role && e.role.trim() && e.startDate)
                .map((e) => ({
                company: e.company.trim(),
                role: e.role.trim(),
                startDate: e.startDate,
                endDate: e.endDate || '',
                description: e.description || '',
                technologies: Array.isArray(e.technologies) ? e.technologies : [],
                isCurrent: !!e.isCurrent
            }));
        };
        // Sanitize education data - remove entries missing required fields
        const sanitizeEducation = (edu) => {
            if (!Array.isArray(edu))
                return [];
            return edu.filter((e) => e && e.institution && e.institution.trim() && e.degree && e.degree.trim() &&
                e.fieldOfStudy && e.fieldOfStudy.trim() && e.startYear)
                .map((e) => ({
                institution: e.institution.trim(),
                degree: e.degree.trim(),
                fieldOfStudy: e.fieldOfStudy.trim(),
                startYear: Number(e.startYear) || new Date().getFullYear(),
                endYear: e.endYear ? Number(e.endYear) : undefined
            }));
        };
        // Sanitize skills
        const sanitizeSkills = (skills) => {
            if (!Array.isArray(skills))
                return [];
            return skills.filter((s) => s && s.name && s.name.trim())
                .map((s) => ({
                name: s.name.trim(),
                level: ['Beginner', 'Intermediate', 'Advanced', 'Expert'].includes(s.level) ? s.level : 'Intermediate',
                yearsOfExperience: Number(s.yearsOfExperience) || 0
            }));
        };
        // Use user's stored data as primary source, allow frontend to provide additional optional data
        const headline = body.headline?.trim() || `${firstName} ${lastName}`;
        const location = body.location?.trim() || 'Remote';
        // Build complete talent profile with GUARANTEED required fields from DB user
        const applicantData = {
            jobId: jobIdStr,
            userId: userObjectId,
            // REQUIRED fields from authenticated user (always present)
            firstName,
            lastName,
            email,
            headline,
            location,
            // Optional fields from request body
            phone: body.phone?.trim() || '',
            bio: body.bio?.trim() || body.resumeText?.trim() || '',
            skills: sanitizeSkills(body.skills),
            languages: [],
            experience: sanitizeExperience(body.experience),
            education: sanitizeEducation(body.education),
            certifications: [],
            projects: [],
            availability: { status: 'Available', type: 'Full-time' },
            socialLinks: {},
            // Store original body data
            structuredData: body,
            // These will be auto-generated by pre-save hooks
            name: `${firstName} ${lastName}`,
            resumeText: body.resumeText?.trim() || ''
        };
        console.log('[Apply] Creating applicant with data:', JSON.stringify(applicantData, null, 2));
        let applicant;
        try {
            applicant = await Applicant_1.default.create(applicantData);
            console.log('[Apply] ===== SUCCESS: Application created =====');
        }
        catch (dbError) {
            console.error('[Apply] ===== DATABASE ERROR =====');
            console.error('[Apply] Error:', dbError.message);
            console.error('[Apply] Validation errors:', dbError.errors);
            res.status(400).json({
                message: 'Database validation failed',
                error: dbError.message,
                validationErrors: dbError.errors
            });
            return;
        }
        res.status(201).json({ message: 'Application submitted successfully', applicant });
    }
    catch (error) {
        console.error('[Apply] ===== SERVER ERROR =====');
        console.error('[Apply] Error:', error.message);
        console.error('[Apply] Stack:', error.stack);
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
