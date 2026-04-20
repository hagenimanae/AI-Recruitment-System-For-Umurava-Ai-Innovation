"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteJob = exports.updateJob = exports.createJob = exports.getJobById = exports.getJobs = void 0;
const Job_1 = __importDefault(require("../models/Job"));
// @desc    Get all jobs
// @route   GET /api/jobs
// @access  Public
const getJobs = async (req, res) => {
    try {
        const jobs = await Job_1.default.find().sort({ createdAt: -1 });
        res.status(200).json(jobs);
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to fetch jobs', error: error.message });
    }
};
exports.getJobs = getJobs;
// @desc    Get single job
// @route   GET /api/jobs/:id
// @access  Public
const getJobById = async (req, res) => {
    try {
        const job = await Job_1.default.findById(req.params.id);
        if (!job) {
            res.status(404).json({ message: 'Job not found' });
            return;
        }
        res.status(200).json(job);
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to fetch job', error: error.message });
    }
};
exports.getJobById = getJobById;
// @desc    Create a new job
// @route   POST /api/jobs
// @access  Public
const createJob = async (req, res) => {
    try {
        const { title, department, location, description, requirements, skills, experienceLevel } = req.body;
        // Convert strings if they are comma-separated and remove empty items
        const parseList = (value) => {
            if (Array.isArray(value)) {
                return value.map((item) => String(item).trim()).filter(Boolean);
            }
            if (typeof value === 'string') {
                return value.split(',').map((item) => item.trim()).filter(Boolean);
            }
            return [];
        };
        const newJob = await Job_1.default.create({
            title,
            department,
            location,
            description,
            requirements: parseList(requirements),
            skills: parseList(skills),
            experienceLevel: typeof experienceLevel === 'string' && experienceLevel.trim()
                ? experienceLevel.trim()
                : 'Not specified'
        });
        res.status(201).json(newJob);
    }
    catch (error) {
        res.status(400).json({ message: 'Failed to create job', error: error.message });
    }
};
exports.createJob = createJob;
// @desc    Update job
// @route   PUT /api/jobs/:id
// @access  Public
const updateJob = async (req, res) => {
    try {
        const { title, department, location, description, requirements, skills, experienceLevel } = req.body;
        const parseList = (value) => {
            if (Array.isArray(value)) {
                return value.map((item) => String(item).trim()).filter(Boolean);
            }
            if (typeof value === 'string') {
                return value.split(',').map((item) => item.trim()).filter(Boolean);
            }
            return [];
        };
        const updatePayload = {};
        if (typeof title !== 'undefined')
            updatePayload.title = title;
        if (typeof department !== 'undefined')
            updatePayload.department = department;
        if (typeof location !== 'undefined')
            updatePayload.location = location;
        if (typeof description !== 'undefined')
            updatePayload.description = description;
        if (typeof requirements !== 'undefined')
            updatePayload.requirements = parseList(requirements);
        if (typeof skills !== 'undefined')
            updatePayload.skills = parseList(skills);
        if (typeof experienceLevel !== 'undefined') {
            updatePayload.experienceLevel =
                typeof experienceLevel === 'string' && experienceLevel.trim()
                    ? experienceLevel.trim()
                    : 'Not specified';
        }
        const updatedJob = await Job_1.default.findByIdAndUpdate(req.params.id, updatePayload, { new: true, runValidators: true });
        if (!updatedJob) {
            res.status(404).json({ message: 'Job not found' });
            return;
        }
        res.status(200).json(updatedJob);
    }
    catch (error) {
        res.status(400).json({ message: 'Failed to update job', error: error.message });
    }
};
exports.updateJob = updateJob;
// @desc    Delete job
// @route   DELETE /api/jobs/:id
// @access  Public
const deleteJob = async (req, res) => {
    try {
        const job = await Job_1.default.findByIdAndDelete(req.params.id);
        if (!job) {
            res.status(404).json({ message: 'Job not found' });
            return;
        }
        res.status(200).json({ message: 'Job deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to delete job', error: error.message });
    }
};
exports.deleteJob = deleteJob;
