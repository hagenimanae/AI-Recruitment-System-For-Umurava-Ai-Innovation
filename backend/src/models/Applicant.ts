import mongoose, { Schema, Document } from 'mongoose';

// Skill with proficiency level
interface ISkill {
  name: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  yearsOfExperience?: number;
}

// Language with proficiency
interface ILanguage {
  name: string;
  proficiency: 'Basic' | 'Conversational' | 'Fluent' | 'Native';
}

// Work Experience
interface IExperience {
  company: string;
  role: string;
  startDate: string; // YYYY-MM
  endDate?: string; // YYYY-MM or 'Present'
  description?: string;
  technologies?: string[];
  isCurrent: boolean;
}

// Education
interface IEducation {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startYear: number;
  endYear?: number;
}

// Certification
interface ICertification {
  name: string;
  issuer: string;
  issueDate: string; // YYYY-MM
}

// Project
interface IProject {
  name: string;
  description?: string;
  technologies?: string[];
  role?: string;
  link?: string;
  startDate?: string; // YYYY-MM
  endDate?: string; // YYYY-MM
}

// Availability
interface IAvailability {
  status: 'Available' | 'Open to Opportunities' | 'Not Available';
  type: 'Full-time' | 'Part-time' | 'Contract';
  startDate?: string; // YYYY-MM-DD
}

// Social Links
interface ISocialLinks {
  linkedin?: string;
  github?: string;
  portfolio?: string;
}

export interface IApplicant extends Document {
  jobId: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  
  // 3.1 Basic Information
  firstName: string;
  lastName: string;
  email: string;
  headline: string;
  bio?: string;
  location: string;
  phone?: string;
  
  // 3.2 Skills & Languages
  skills: ISkill[];
  languages: ILanguage[];
  
  // 3.3 Work Experience
  experience: IExperience[];
  
  // 3.4 Education
  education: IEducation[];
  
  // 3.5 Certifications
  certifications: ICertification[];
  
  // 3.6 Projects
  projects: IProject[];
  
  // 3.7 Availability
  availability: IAvailability;
  
  // 3.8 Social Links
  socialLinks: ISocialLinks;
  
  // Legacy fields (for backward compatibility)
  name: string;
  resumeText: string;
  structuredData?: any;
  
  createdAt: Date;
  updatedAt: Date;
}

const SkillSchema = new Schema({
  name: { type: String, required: true },
  level: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'], default: 'Intermediate' },
  yearsOfExperience: { type: Number }
}, { _id: false });

const LanguageSchema = new Schema({
  name: { type: String, required: true },
  proficiency: { type: String, enum: ['Basic', 'Conversational', 'Fluent', 'Native'], default: 'Conversational' }
}, { _id: false });

const ExperienceSchema = new Schema({
  company: { type: String, required: true },
  role: { type: String, required: true },
  startDate: { type: String, required: true },
  endDate: { type: String },
  description: { type: String },
  technologies: [{ type: String }],
  isCurrent: { type: Boolean, default: false }
}, { _id: false });

const EducationSchema = new Schema({
  institution: { type: String, required: true },
  degree: { type: String, required: true },
  fieldOfStudy: { type: String, required: true },
  startYear: { type: Number, required: true },
  endYear: { type: Number }
}, { _id: false });

const CertificationSchema = new Schema({
  name: { type: String, required: true },
  issuer: { type: String, required: true },
  issueDate: { type: String, required: true }
}, { _id: false });

const ProjectSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  technologies: [{ type: String }],
  role: { type: String },
  link: { type: String },
  startDate: { type: String },
  endDate: { type: String }
}, { _id: false });

const AvailabilitySchema = new Schema({
  status: { type: String, enum: ['Available', 'Open to Opportunities', 'Not Available'], required: true },
  type: { type: String, enum: ['Full-time', 'Part-time', 'Contract'], required: true },
  startDate: { type: String }
}, { _id: false });

const SocialLinksSchema = new Schema({
  linkedin: { type: String },
  github: { type: String },
  portfolio: { type: String }
}, { _id: false });

const ApplicantSchema: Schema = new Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  
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
  structuredData: { type: Schema.Types.Mixed }
}, {
  timestamps: true
});

// Pre-validate hook to generate name BEFORE validation
ApplicantSchema.pre('validate', function() {
  const applicant = this as unknown as IApplicant;
  
  // Generate full name from firstName and lastName
  if (applicant.firstName && applicant.lastName) {
    applicant.name = `${applicant.firstName} ${applicant.lastName}`;
  } else if (!applicant.name) {
    // Fallback if firstName/lastName not provided
    applicant.name = applicant.firstName || applicant.lastName || 'Unknown Candidate';
  }
});

// Pre-save hook to generate name and resumeText from structured data
ApplicantSchema.pre('save', function() {
  const applicant = this as unknown as IApplicant;
  
  // Ensure name is set (in case pre-validate didn't run)
  if (!applicant.name && applicant.firstName && applicant.lastName) {
    applicant.name = `${applicant.firstName} ${applicant.lastName}`;
  }
  
  // Generate resume text summary if not provided
  if (!applicant.resumeText || applicant.resumeText === '') {
    const skillsText = applicant.skills?.map(s => `${s.name} (${s.level})`).join(', ') || '';
    const expText = applicant.experience?.map(e => 
      `${e.role} at ${e.company} (${e.startDate} - ${e.endDate || 'Present'})`
    ).join('\n') || '';
    const eduText = applicant.education?.map(edu => 
      `${edu.degree} in ${edu.fieldOfStudy} from ${edu.institution}`
    ).join('\n') || '';
    
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

export default mongoose.models.Applicant || mongoose.model<IApplicant>('Applicant', ApplicantSchema);
