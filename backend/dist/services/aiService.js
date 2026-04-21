"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.screenApplicants = void 0;
const generative_ai_1 = require("@google/generative-ai");
const dotenv_1 = __importDefault(require("dotenv"));
const Applicant_1 = __importDefault(require("../models/Applicant"));
const Job_1 = __importDefault(require("../models/Job"));
const Screening_1 = __importDefault(require("../models/Screening"));
dotenv_1.default.config();
const apiKey = process.env.GEMINI_API_KEY;
const normalizeText = (value) => {
    if (!value)
        return '';
    if (typeof value === 'string')
        return value;
    try {
        return JSON.stringify(value);
    }
    catch {
        return String(value);
    }
};
const tokenize = (text) => {
    return new Set(text
        .toLowerCase()
        .replace(/[^a-z0-9+.#\s-]/g, ' ')
        .split(/\s+/)
        .map((t) => t.trim())
        .filter((t) => t.length >= 2));
};
const uniqueStrings = (items) => {
    if (!Array.isArray(items))
        return [];
    const out = [];
    const seen = new Set();
    for (const it of items) {
        const s = String(it).trim();
        if (!s)
            continue;
        const key = s.toLowerCase();
        if (seen.has(key))
            continue;
        seen.add(key);
        out.push(s);
    }
    return out;
};
const localScore = (job, applicant) => {
    const jobSkills = uniqueStrings(job.skills);
    const jobReqs = uniqueStrings(job.requirements);
    const target = [...jobSkills, ...jobReqs];
    // Build rich text from structured Talent Profile data
    let richText = '';
    // 3.1 Basic Information
    if (applicant.firstName || applicant.lastName) {
        richText += `${applicant.firstName || ''} ${applicant.lastName || ''}\n`;
    }
    if (applicant.headline)
        richText += `Headline: ${applicant.headline}\n`;
    if (applicant.bio)
        richText += `Bio: ${applicant.bio}\n`;
    if (applicant.location)
        richText += `Location: ${applicant.location}\n`;
    // 3.2 Skills with proficiency levels
    if (applicant.skills?.length > 0) {
        const skillsText = applicant.skills.map((s) => `${s.name} (${s.level}${s.yearsOfExperience ? `, ${s.yearsOfExperience} yrs` : ''})`).join(', ');
        richText += `Skills: ${skillsText}\n`;
    }
    // 3.3 Work Experience
    if (applicant.experience?.length > 0) {
        const expText = applicant.experience.map((e) => `${e.role} at ${e.company} (${e.startDate} - ${e.endDate || 'Present'})${e.technologies ? ` [${e.technologies.join(', ')}]` : ''}`).join('; ');
        richText += `Experience: ${expText}\n`;
    }
    // 3.4 Education
    if (applicant.education?.length > 0) {
        const eduText = applicant.education.map((edu) => `${edu.degree} in ${edu.fieldOfStudy} from ${edu.institution}`).join('; ');
        richText += `Education: ${eduText}\n`;
    }
    // 3.5 Certifications
    if (applicant.certifications?.length > 0) {
        const certText = applicant.certifications.map((c) => c.name).join(', ');
        richText += `Certifications: ${certText}\n`;
    }
    // 3.6 Projects
    if (applicant.projects?.length > 0) {
        const projText = applicant.projects.map((p) => `${p.name}${p.technologies ? ` (${p.technologies.join(', ')})` : ''}`).join(', ');
        richText += `Projects: ${projText}\n`;
    }
    // 3.7 Availability
    if (applicant.availability) {
        richText += `Availability: ${applicant.availability.status} for ${applicant.availability.type}\n`;
    }
    // Fallback to resumeText if structured data is empty
    const resumeText = richText || normalizeText(applicant.resumeText || applicant.structuredData);
    const tokens = tokenize(resumeText);
    const matched = [];
    const gaps = [];
    for (const item of target) {
        const itemTokens = tokenize(item);
        const hit = [...itemTokens].some((t) => tokens.has(t));
        if (hit)
            matched.push(item);
        else
            gaps.push(item);
    }
    const denom = Math.max(1, target.length);
    const raw = Math.round((matched.length / denom) * 100);
    const score = Math.min(100, Math.max(0, raw));
    const strengths = matched.slice(0, 3);
    const topGaps = gaps.slice(0, 3);
    let recommendation = 'Reject';
    if (score >= 75)
        recommendation = 'Highly Recommended';
    else if (score >= 50)
        recommendation = 'Interview';
    const reasoningText = strengths.length > 0
        ? `Matched key requirements: ${strengths.join(', ')}.`
        : 'Limited match against the listed job requirements.';
    return {
        applicantId: applicant._id.toString(),
        score,
        strengths,
        gaps: topGaps,
        recommendation,
        reasoningText,
    };
};
const upsertScreeningsAndReturn = async (jobId, results) => {
    results.sort((a, b) => (b.score || 0) - (a.score || 0));
    const screeningPromises = results.map(async (res, index) => {
        let screening = await Screening_1.default.findOne({ jobId, applicantId: res.applicantId });
        const updates = { ...res, rank: index + 1, jobId };
        if (screening) {
            Object.assign(screening, updates);
            return screening.save();
        }
        return Screening_1.default.create(updates);
    });
    await Promise.all(screeningPromises);
    return Screening_1.default.find({ jobId }).sort({ rank: 1 }).populate('applicantId', 'name email skills resumeText');
};
const screenApplicants = async (jobId) => {
    const job = await Job_1.default.findById(jobId);
    const applicants = await Applicant_1.default.find({ jobId });
    if (!job || applicants.length === 0) {
        throw new Error("Job not found or no applicants to screen.");
    }
    const hasRealKey = typeof apiKey === 'string' && apiKey.trim().length > 0 && !apiKey.toLowerCase().includes('dummy');
    if (!hasRealKey) {
        console.log('[AI] Screening mode: fallback (missing/invalid GEMINI_API_KEY)');
        console.log('[AI] API Key status:', apiKey ? 'Present but may be invalid' : 'Missing');
        const fallback = applicants.map((a) => localScore(job, a));
        return upsertScreeningsAndReturn(jobId, fallback);
    }
    console.log('[AI] Using Gemini API Key:', apiKey.substring(0, 10) + '...');
    console.log('[AI] Screening mode: gemini');
    const genAI = new generative_ai_1.GoogleGenerativeAI(apiKey.trim());
    // Try models in order of preference (flash is faster and cheaper, 8b is the smallest/efficient)
    const modelNames = ['gemini-1.5-flash-8b-latest', 'gemini-1.5-flash-latest', 'gemini-1.5-pro-latest', 'gemini-pro', 'gemini-pro-latest', 'gemini-1.5-flash', 'gemini-1.5-pro'];
    let model = null;
    let lastError = null;
    for (const modelName of modelNames) {
        try {
            model = genAI.getGenerativeModel({
                model: modelName,
                systemInstruction: "You are an expert technical recruiter analyzing a batch of candidates for a job role. You will output the screening results strictly as a JSON array corresponding exactly to the provided JSON schema."
            });
            // Quick lightweight test to verify model exists and is accessible
            try {
                await model.countTokens('test');
            }
            catch (tokenErr) {
                // countTokens might not be supported, that's OK - we'll verify with actual call
                if (tokenErr.status !== 404) {
                    console.log(`[AI] Model ${modelName} countTokens not supported, will try with actual call`);
                }
                else {
                    throw tokenErr; // 404 means model doesn't exist
                }
            }
            console.log(`[AI] Using model: ${modelName}`);
            break;
        }
        catch (e) {
            lastError = e;
            const status = e.status || e.statusCode || 'unknown';
            const message = e.message || 'Unknown error';
            console.log(`[AI] Model ${modelName} failed (status: ${status}): ${message}`);
            if (e.status === 404) {
                continue;
            }
            // For non-404 errors, we might want to try other models too
            console.log(`[AI] Non-404 error for ${modelName}, trying next model...`);
            continue;
        }
    }
    if (!model) {
        throw new Error(`No Gemini model available. Last error: ${lastError?.message || 'Unknown'}`);
    }
    const schema = {
        type: generative_ai_1.SchemaType.ARRAY,
        items: {
            type: generative_ai_1.SchemaType.OBJECT,
            properties: {
                applicantId: { type: generative_ai_1.SchemaType.STRING, description: 'The exact ID of the applicant passed in' },
                score: { type: generative_ai_1.SchemaType.NUMBER, description: 'A score from 0 to 100 representing the match to the job requirements' },
                strengths: { type: generative_ai_1.SchemaType.ARRAY, items: { type: generative_ai_1.SchemaType.STRING }, description: 'Top 2-3 strengths matching the role' },
                gaps: { type: generative_ai_1.SchemaType.ARRAY, items: { type: generative_ai_1.SchemaType.STRING }, description: 'Missing skills or experiences relative to the job requirements' },
                recommendation: { type: generative_ai_1.SchemaType.STRING, description: 'E.g., "Highly Recommended", "Interview", "Reject"' },
                reasoningText: { type: generative_ai_1.SchemaType.STRING, description: 'A natural language explanation for the score and recommendation' }
            },
            required: ["applicantId", "score", "strengths", "gaps", "recommendation", "reasoningText"]
        }
    };
    const jobDetails = JSON.stringify({
        title: job.title,
        requirements: job.requirements,
        skills: job.skills,
        experienceLevel: job.experienceLevel,
        description: job.description
    });
    // Build rich structured candidate data using Talent Profile Schema
    const candidateData = applicants.map(app => {
        const profile = {
            applicantId: app._id.toString(),
            name: app.name || `${app.firstName || ''} ${app.lastName || ''}`.trim()
        };
        // Include all structured fields for better AI analysis
        if (app.headline)
            profile.headline = app.headline;
        if (app.bio)
            profile.bio = app.bio;
        if (app.location)
            profile.location = app.location;
        if (app.phone)
            profile.phone = app.phone;
        // Skills with proficiency levels
        if (app.skills?.length > 0) {
            profile.skills = app.skills.map((s) => ({
                name: s.name,
                level: s.level,
                yearsOfExperience: s.yearsOfExperience
            }));
        }
        // Languages
        if (app.languages?.length > 0)
            profile.languages = app.languages;
        // Work Experience
        if (app.experience?.length > 0) {
            profile.experience = app.experience.map((e) => ({
                company: e.company,
                role: e.role,
                startDate: e.startDate,
                endDate: e.endDate,
                description: e.description,
                technologies: e.technologies,
                isCurrent: e.isCurrent
            }));
        }
        // Education
        if (app.education?.length > 0) {
            profile.education = app.education.map((edu) => ({
                institution: edu.institution,
                degree: edu.degree,
                fieldOfStudy: edu.fieldOfStudy,
                startYear: edu.startYear,
                endYear: edu.endYear
            }));
        }
        // Certifications
        if (app.certifications?.length > 0) {
            profile.certifications = app.certifications.map((c) => ({
                name: c.name,
                issuer: c.issuer,
                issueDate: c.issueDate
            }));
        }
        // Projects
        if (app.projects?.length > 0) {
            profile.projects = app.projects.map((p) => ({
                name: p.name,
                description: p.description,
                technologies: p.technologies,
                role: p.role,
                link: p.link
            }));
        }
        // Availability
        if (app.availability)
            profile.availability = app.availability;
        // Social Links
        if (app.socialLinks)
            profile.socialLinks = app.socialLinks;
        // Fallback resume text
        profile.resumeText = app.resumeText;
        return profile;
    });
    const prompt = `
You are an expert technical recruiter evaluating candidates against job requirements using the Talent Profile Schema.

JOB DETAILS:
${jobDetails}

CANDIDATES (Structured Talent Profile Format):
${JSON.stringify(candidateData, null, 2)}

EVALUATION CRITERIA:
1. Skills Match: Compare candidate skills (with proficiency levels and years of experience) against job requirements
2. Experience Relevance: Evaluate work history, roles, and technologies used
3. Education Fit: Consider degree level and field of study relevance
4. Certifications: Value industry certifications related to the role
5. Projects: Review portfolio projects and their complexity
6. Availability: Check if candidate's availability matches job type (Full-time/Part-time/Contract)

INSTRUCTIONS:
- Score each candidate 0-100 based on overall fit
- Identify top 2-3 strengths for each candidate
- Identify 2-3 gaps or missing qualifications
- Provide recommendation: "Highly Recommended" (score 75+), "Interview" (score 50-74), or "Reject" (score <50)
- Give detailed reasoning explaining the score

Respond ONLY with a JSON array following the schema. Include ALL candidates in your response.
  `;
    // Retry logic for rate limiting (429)
    const maxRetries = 3;
    let generationError = null;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`[AI] Gemini call attempt ${attempt}/${maxRetries}...`);
            const result = await model.generateContent({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: schema,
                }
            });
            const responseText = result.response.text();
            // Strip markdown formatting if Gemini included it
            const cleanText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsedResults = JSON.parse(cleanText);
            console.log(`[AI] Gemini succeeded on attempt ${attempt}`);
            return upsertScreeningsAndReturn(jobId, parsedResults);
        }
        catch (error) {
            generationError = error;
            const status = error.status || error.statusCode;
            // If rate limited (429), wait and retry
            if (status === 429 && attempt < maxRetries) {
                const retryDelayMs = 15000; // 15 seconds as suggested by Google
                console.log(`[AI] Rate limited (429), waiting ${retryDelayMs / 1000}s before retry...`);
                await new Promise(resolve => setTimeout(resolve, retryDelayMs));
                continue;
            }
            // For other errors or final attempt, break and fallback
            break;
        }
    }
    console.error("AI Generation failed after retries:", generationError);
    console.log('[AI] Falling back to local scoring due to Gemini failure');
    const fallback = applicants.map((a) => localScore(job, a));
    return upsertScreeningsAndReturn(jobId, fallback);
};
exports.screenApplicants = screenApplicants;
