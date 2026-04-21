"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const SkillSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    level: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'], default: 'Intermediate' },
    yearsOfExperience: { type: Number }
}, { _id: false });
const LanguageSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    proficiency: { type: String, enum: ['Basic', 'Conversational', 'Fluent', 'Native'], default: 'Conversational' }
}, { _id: false });
const ExperienceSchema = new mongoose_1.Schema({
    company: { type: String, required: true },
    role: { type: String, required: true },
    startDate: { type: String, required: true },
    endDate: { type: String },
    description: { type: String },
    technologies: [{ type: String }],
    isCurrent: { type: Boolean, default: false }
}, { _id: false });
const EducationSchema = new mongoose_1.Schema({
    institution: { type: String, required: true },
    degree: { type: String, required: true },
    fieldOfStudy: { type: String, required: true },
    startYear: { type: Number, required: true },
    endYear: { type: Number }
}, { _id: false });
const CertificationSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    issuer: { type: String, required: true },
    issueDate: { type: String, required: true }
}, { _id: false });
const ProjectSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    description: { type: String },
    technologies: [{ type: String }],
    role: { type: String },
    link: { type: String },
    startDate: { type: String },
    endDate: { type: String }
}, { _id: false });
const AvailabilitySchema = new mongoose_1.Schema({
    status: { type: String, enum: ['Available', 'Open to Opportunities', 'Not Available'], required: true },
    type: { type: String, enum: ['Full-time', 'Part-time', 'Contract'], required: true },
    startDate: { type: String }
}, { _id: false });
const SocialLinksSchema = new mongoose_1.Schema({
    linkedin: { type: String },
    github: { type: String },
    portfolio: { type: String }
}, { _id: false });
const ApplicantSchema = new mongoose_1.Schema({
    jobId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'Job', required: true },
    userId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'User', required: false },
    // 3.1 Basic Information
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    headline: { type: String, required: true },
    bio: { type: String },
    location: { type: String, required: true },
    phone: { type: String },
    // 3.2 Skills & Languages
    skills: { type: [SkillSchema], default: [] },
    languages: { type: [LanguageSchema], default: [] },
    // 3.3 Work Experience
    experience: { type: [ExperienceSchema], default: [] },
    // 3.4 Education
    education: { type: [EducationSchema], default: [] },
    // 3.5 Certifications
    certifications: { type: [CertificationSchema], default: [] },
    // 3.6 Projects
    projects: { type: [ProjectSchema], default: [] },
    // 3.7 Availability
    availability: { type: AvailabilitySchema, default: { status: 'Available', type: 'Full-time' } },
    // 3.8 Social Links
    socialLinks: { type: SocialLinksSchema, default: {} },
    // Legacy fields (computed/virtual) - NOT required, auto-generated
    name: { type: String, required: false },
    resumeText: { type: String, default: '' },
    structuredData: { type: mongoose_1.Schema.Types.Mixed }
}, {
    timestamps: true
});
// Pre-validate hook to generate name BEFORE validation
ApplicantSchema.pre('validate', function () {
    const applicant = this;
    // Generate full name from firstName and lastName
    if (applicant.firstName && applicant.lastName) {
        applicant.name = `${applicant.firstName} ${applicant.lastName}`;
    }
    else if (!applicant.name) {
        // Fallback if firstName/lastName not provided
        applicant.name = applicant.firstName || applicant.lastName || 'Unknown Candidate';
    }
});
// Pre-save hook to generate name and resumeText from structured data
ApplicantSchema.pre('save', function () {
    const applicant = this;
    // Ensure name is set (in case pre-validate didn't run)
    if (!applicant.name && applicant.firstName && applicant.lastName) {
        applicant.name = `${applicant.firstName} ${applicant.lastName}`;
    }
    // Generate resume text summary if not provided
    if (!applicant.resumeText || applicant.resumeText === '') {
        const skillsText = applicant.skills?.map(s => `${s.name} (${s.level})`).join(', ') || '';
        const expText = applicant.experience?.map(e => `${e.role} at ${e.company} (${e.startDate} - ${e.endDate || 'Present'})`).join('\n') || '';
        const eduText = applicant.education?.map(edu => `${edu.degree} in ${edu.fieldOfStudy} from ${edu.institution}`).join('\n') || '';
        applicant.resumeText = `
Name: ${applicant.name}
Headline: ${applicant.headline}
Bio: ${applicant.bio || ''}
Location: ${applicant.location}
Skills: ${skillsText}
Experience:
${expText}
Education:
${eduText}
    `.trim();
    }
});
exports.default = mongoose_1.default.models.Applicant || mongoose_1.default.model('Applicant', ApplicantSchema);
