import { Request, Response } from 'express';
import Job from '../models/Job';

// @desc    Get all jobs
// @route   GET /api/jobs
// @access  Public
export const getJobs = async (req: Request, res: Response): Promise<void> => {
  try {
    const jobs = await Job.find().sort({ createdAt: -1 });
    res.status(200).json(jobs);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch jobs', error: error.message });
  }
};

// @desc    Get single job
// @route   GET /api/jobs/:id
// @access  Public
export const getJobById = async (req: Request, res: Response): Promise<void> => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      res.status(404).json({ message: 'Job not found' });
      return;
    }
    res.status(200).json(job);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch job', error: error.message });
  }
};

// @desc    Create a new job
// @route   POST /api/jobs
// @access  Public
export const createJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, department, location, description, requirements, skills, experienceLevel } = req.body;
    
    // Convert strings if they are comma-separated and remove empty items
    const parseList = (value: unknown): string[] => {
      if (Array.isArray(value)) {
        return value.map((item) => String(item).trim()).filter(Boolean);
      }
      if (typeof value === 'string') {
        return value.split(',').map((item) => item.trim()).filter(Boolean);
      }
      return [];
    };

    const newJob = await Job.create({
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
  } catch (error: any) {
    res.status(400).json({ message: 'Failed to create job', error: error.message });
  }
};

// @desc    Update job
// @route   PUT /api/jobs/:id
// @access  Public
export const updateJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, department, location, description, requirements, skills, experienceLevel } = req.body;
    const parseList = (value: unknown): string[] => {
      if (Array.isArray(value)) {
        return value.map((item) => String(item).trim()).filter(Boolean);
      }
      if (typeof value === 'string') {
        return value.split(',').map((item) => item.trim()).filter(Boolean);
      }
      return [];
    };

    const updatePayload: Record<string, unknown> = {};

    if (typeof title !== 'undefined') updatePayload.title = title;
    if (typeof department !== 'undefined') updatePayload.department = department;
    if (typeof location !== 'undefined') updatePayload.location = location;
    if (typeof description !== 'undefined') updatePayload.description = description;
    if (typeof requirements !== 'undefined') updatePayload.requirements = parseList(requirements);
    if (typeof skills !== 'undefined') updatePayload.skills = parseList(skills);
    if (typeof experienceLevel !== 'undefined') {
      updatePayload.experienceLevel =
        typeof experienceLevel === 'string' && experienceLevel.trim()
          ? experienceLevel.trim()
          : 'Not specified';
    }

    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      updatePayload,
      { new: true, runValidators: true }
    );

    if (!updatedJob) {
      res.status(404).json({ message: 'Job not found' });
      return;
    }
    res.status(200).json(updatedJob);
  } catch (error: any) {
    res.status(400).json({ message: 'Failed to update job', error: error.message });
  }
};

// @desc    Delete job
// @route   DELETE /api/jobs/:id
// @access  Public
export const deleteJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);
    if (!job) {
      res.status(404).json({ message: 'Job not found' });
      return;
    }
    res.status(200).json({ message: 'Job deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to delete job', error: error.message });
  }
};
