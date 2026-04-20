"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getScreeningResults = exports.triggerScreening = void 0;
const aiService_1 = require("../services/aiService");
const Screening_1 = __importDefault(require("../models/Screening"));
const triggerScreening = async (req, res) => {
    console.log(`[AI] POST /api/ai/${req.params.jobId}/screen`);
    try {
        const jobId = req.params.jobId;
        const results = await (0, aiService_1.screenApplicants)(jobId);
        res.status(200).json(results);
    }
    catch (error) {
        res.status(500).json({ message: 'Screening failed', error: error.message });
    }
};
exports.triggerScreening = triggerScreening;
const getScreeningResults = async (req, res) => {
    console.log(`[AI] GET /api/ai/${req.params.jobId}/results`);
    try {
        const jobId = req.params.jobId;
        const results = await Screening_1.default.find({ jobId }).sort({ rank: 1 }).populate('applicantId', 'name email skills resumeText');
        res.status(200).json(results);
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to fetch screening results', error: error.message });
    }
};
exports.getScreeningResults = getScreeningResults;
