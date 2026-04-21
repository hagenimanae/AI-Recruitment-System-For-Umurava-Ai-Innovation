"use client";

import { useEffect, useState, use } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchApplicants, triggerScreening } from '@/store/slices/applicantsSlice';
import { AppDispatch, RootState } from '@/store';
import { CheckCircle2, XCircle, Grid, Play, FileText, CheckSquare, MessageSquare, ArrowRight, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';
import { deleteApplicant } from '@/store/slices/applicantsSlice';

const getApiBaseUrl = (): string => {
  const raw = process.env.NEXT_PUBLIC_API_URL;
  if (!raw) return 'http://localhost:5000/api';
  const trimmed = raw.replace(/\/+$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};

const API_URL = getApiBaseUrl();

export default function JobDetails({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const dispatch = useDispatch<AppDispatch>();
  
  const [job, setJob] = useState<any>(null);
  const { list: applicants, screeningLoading, results } = useSelector((state: RootState) => state.applicants);
  const { user } = useSelector((state: RootState) => state.auth);
  const isAdmin = user?.role === 'admin';
  
  const [jsonProfile, setJsonProfile] = useState<string>('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [resumeUrl, setResumeUrl] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'profiles' | 'resumes' | 'links' | 'form' | 'apply'>('profiles');
  const [selectedCandidateIndex, setSelectedCandidateIndex] = useState(0);
  const [jobError, setJobError] = useState<string | null>(null);

  // Applicant form state - Talent Profile Schema
  const [applicantForm, setApplicantForm] = useState({
    // 3.1 Basic Information
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    headline: '',
    bio: '',
    location: '',
    // 3.2 Skills (array of objects)
    skills: [{ name: '', level: 'Intermediate', yearsOfExperience: 0 }],
    languages: [{ name: '', proficiency: 'Conversational' }],
    // 3.3 Work Experience
    experience: [{ company: '', role: '', startDate: '', endDate: '', description: '', technologies: '', isCurrent: false }],
    // 3.4 Education
    education: [{ institution: '', degree: '', fieldOfStudy: '', startYear: '', endYear: '' }],
    // 3.5 Certifications
    certifications: [{ name: '', issuer: '', issueDate: '' }],
    // 3.6 Projects
    projects: [{ name: '', description: '', technologies: '', role: '', link: '' }],
    // 3.7 Availability
    availability: { status: 'Available', type: 'Full-time', startDate: '' },
    // 3.8 Social Links
    socialLinks: { linkedin: '', github: '', portfolio: '' },
    // Legacy fields
    resumeText: ''
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('[JobDetails] No auth token found');
      setJobError('Not authenticated. Please login.');
    }
    axios.get(`${API_URL}/jobs/${resolvedParams.id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    }).then((res) => {
      setJob(res.data);
      setJobError(null);
    }).catch((err) => {
      console.error('[JobDetails] Failed to fetch job:', err);
      setJobError(err.response?.data?.message || 'Failed to load job details');
    });
    dispatch(fetchApplicants(resolvedParams.id));
  }, [dispatch, resolvedParams.id]);

  // Reset form when switching tabs to ensure no undefined values
  useEffect(() => {
    setApplicantForm({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      headline: '',
      bio: '',
      location: '',
      skills: [{ name: '', level: 'Intermediate', yearsOfExperience: 0 }],
      languages: [{ name: '', proficiency: 'Conversational' }],
      experience: [{ company: '', role: '', startDate: '', endDate: '', description: '', technologies: '', isCurrent: false }],
      education: [{ institution: '', degree: '', fieldOfStudy: '', startYear: '', endYear: '' }],
      certifications: [{ name: '', issuer: '', issueDate: '' }],
      projects: [{ name: '', description: '', technologies: '', role: '', link: '' }],
      availability: { status: 'Available', type: 'Full-time', startDate: '' },
      socialLinks: { linkedin: '', github: '', portfolio: '' },
      resumeText: ''
    });
  }, [activeTab]);

  const handleTriggerAI = async () => {
    try {
      await dispatch(triggerScreening(resolvedParams.id)).unwrap();
      setSelectedCandidateIndex(0); // Focus the top candidate instantly
    } catch (e) {
      alert('AI Screening Failed.');
    }
  };

  const handleJsonUpload = async () => {
    if (!jsonProfile) return;
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/applicants/${resolvedParams.id}`, { profile: jsonProfile }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      dispatch(fetchApplicants(resolvedParams.id));
      setJsonProfile('');
      alert("Successfully parsed JSON onto system!");
      setActiveTab('profiles');
    } catch (e) {
      alert('JSON Upload failed');
    }
  };

  const handleFileUpload = async () => {
    if (!uploadFile) {
      alert('Please select a file first');
      return;
    }

    console.log('[Upload] File selected:', uploadFile.name, uploadFile.type, uploadFile.size);

    const formData = new FormData();
    formData.append('file', uploadFile);

    // Debug: log formData contents
    for (let pair of formData.entries()) {
      console.log('[Upload] FormData entry:', pair[0], pair[1]);
    }

    try {
      console.log('[Upload] Sending to:', `${API_URL}/applicants/${resolvedParams.id}`);
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/applicants/${resolvedParams.id}`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      dispatch(fetchApplicants(resolvedParams.id));
      setUploadFile(null);
      alert('Resume uploaded successfully!');
      setActiveTab('profiles');
    } catch (e: any) {
      console.error('Upload error details:', e);
      console.error('Response:', e.response);
      console.error('Response data:', e.response?.data);
      console.error('Response status:', e.response?.status);
      const errorMsg = e.response?.data?.message || e.response?.data?.error || e.message || 'Unknown error';
      alert('Resume upload failed: ' + errorMsg);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0]);
    }
  };

  const handleUrlSubmit = async () => {
    if (!resumeUrl.trim()) {
      alert('Please enter a resume URL');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/applicants/${resolvedParams.id}`, { 
        profile: JSON.stringify({ 
          name: 'Candidate from URL',
          resumeText: `Resume URL: ${resumeUrl}`,
          resumeUrl: resumeUrl,
          source: 'url'
        }) 
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      dispatch(fetchApplicants(resolvedParams.id));
      setResumeUrl('');
      alert('Resume URL added successfully!');
      setActiveTab('profiles');
    } catch (e) {
      alert('Failed to add resume URL');
    }
  };

  const handleFormSubmit = async () => {
    const firstName = (applicantForm.firstName || '').trim();
    const lastName = (applicantForm.lastName || '').trim();
    const email = (applicantForm.email || '').trim();
    if (!firstName || !lastName || !email) {
      alert('First Name, Last Name and Email are required');
      return;
    }

    // Build Talent Profile Schema data
    const profile = {
      // 3.1 Basic Information
      firstName,
      lastName,
      email,
      phone: applicantForm.phone || '',
      headline: applicantForm.headline || `${firstName} ${lastName}`,
      bio: applicantForm.bio || '',
      location: applicantForm.location || 'Remote',
      // 3.2 Skills & Languages
      skills: applicantForm.skills.filter(s => s.name.trim()).map(s => ({
        name: s.name.trim(),
        level: s.level,
        yearsOfExperience: Number(s.yearsOfExperience) || 0
      })),
      languages: applicantForm.languages.filter(l => l.name.trim()),
      // 3.3 Work Experience
      experience: applicantForm.experience.filter(e => e.company.trim() && e.role.trim()).map(e => ({
        company: e.company.trim(),
        role: e.role.trim(),
        startDate: e.startDate,
        endDate: e.endDate,
        description: e.description,
        technologies: e.technologies.split(',').map(t => t.trim()).filter(Boolean),
        isCurrent: e.isCurrent
      })),
      // 3.4 Education
      education: applicantForm.education.filter(edu => edu.institution.trim()).map(edu => ({
        institution: edu.institution.trim(),
        degree: edu.degree,
        fieldOfStudy: edu.fieldOfStudy,
        startYear: Number(edu.startYear) || 0,
        endYear: edu.endYear ? Number(edu.endYear) : undefined
      })),
      // 3.5 Certifications
      certifications: applicantForm.certifications.filter(c => c.name.trim()),
      // 3.6 Projects
      projects: applicantForm.projects.filter(p => p.name.trim()).map(p => ({
        name: p.name.trim(),
        description: p.description,
        technologies: p.technologies.split(',').map(t => t.trim()).filter(Boolean),
        role: p.role,
        link: p.link
      })),
      // 3.7 Availability
      availability: applicantForm.availability,
      // 3.8 Social Links
      socialLinks: applicantForm.socialLinks,
      // Legacy
      resumeText: applicantForm.resumeText || ''
    };

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/applicants/${resolvedParams.id}`, {
        profile: JSON.stringify(profile)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      dispatch(fetchApplicants(resolvedParams.id));
      setApplicantForm({
        firstName: '', lastName: '', email: '', phone: '', headline: '', bio: '', location: '',
        skills: [{ name: '', level: 'Intermediate', yearsOfExperience: 0 }],
        languages: [{ name: '', proficiency: 'Conversational' }],
        experience: [{ company: '', role: '', startDate: '', endDate: '', description: '', technologies: '', isCurrent: false }],
        education: [{ institution: '', degree: '', fieldOfStudy: '', startYear: '', endYear: '' }],
        certifications: [{ name: '', issuer: '', issueDate: '' }],
        projects: [{ name: '', description: '', technologies: '', role: '', link: '' }],
        availability: { status: 'Available', type: 'Full-time', startDate: '' },
        socialLinks: { linkedin: '', github: '', portfolio: '' },
        resumeText: ''
      });
      alert('Applicant added successfully!');
      setActiveTab('profiles');
    } catch (e: any) {
      alert('Failed to add applicant: ' + (e.response?.data?.message || e.message));
    }
  };

  const handleDeleteApplicant = async (applicantId: string) => {
    if (!confirm('Are you sure you want to delete this applicant?')) return;
    try {
      await dispatch(deleteApplicant({ applicantId, jobId: resolvedParams.id })).unwrap();
    } catch (e) {
      alert('Failed to delete applicant');
    }
  };

  const handleApply = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please login first');
      return;
    }

    // Validate form
    if (!applicantForm.firstName || !applicantForm.lastName || !applicantForm.email) {
      alert('Please fill in first name, last name and email');
      return;
    }

    // Build Talent Profile Schema data for apply
    const applyProfile = {
      firstName: applicantForm.firstName,
      lastName: applicantForm.lastName,
      email: applicantForm.email,
      phone: applicantForm.phone,
      headline: applicantForm.headline || `${applicantForm.firstName} ${applicantForm.lastName}`,
      bio: applicantForm.bio,
      location: applicantForm.location || 'Remote',
      skills: applicantForm.skills.filter(s => s.name.trim()).map(s => ({
        name: s.name.trim(),
        level: s.level,
        yearsOfExperience: Number(s.yearsOfExperience) || 0
      })),
      experience: applicantForm.experience.filter(e => e.company.trim()).map(e => ({
        company: e.company.trim(),
        role: e.role,
        startDate: e.startDate,
        endDate: e.endDate,
        description: e.description,
        technologies: e.technologies.split(',').map(t => t.trim()).filter(Boolean),
        isCurrent: e.isCurrent
      })),
      education: applicantForm.education.filter(edu => edu.institution.trim()).map(edu => ({
        institution: edu.institution.trim(),
        degree: edu.degree,
        fieldOfStudy: edu.fieldOfStudy,
        startYear: Number(edu.startYear) || 0,
        endYear: edu.endYear ? Number(edu.endYear) : undefined
      })),
      resumeText: applicantForm.resumeText
    };

    console.log('[Apply] Token being sent:', token ? token.substring(0, 20) + '...' : 'NONE');
    console.log('[Apply] Request URL:', `${API_URL}/applicants/${resolvedParams.id}/apply`);
    
    try {
      const response = await axios.post(
        `${API_URL}/applicants/${resolvedParams.id}/apply`,
        applyProfile,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert('Application submitted successfully!');
      setApplicantForm({
        firstName: '', lastName: '', email: '', phone: '', headline: '', bio: '', location: '',
        skills: [{ name: '', level: 'Intermediate', yearsOfExperience: 0 }],
        languages: [{ name: '', proficiency: 'Conversational' }],
        experience: [{ company: '', role: '', startDate: '', endDate: '', description: '', technologies: '', isCurrent: false }],
        education: [{ institution: '', degree: '', fieldOfStudy: '', startYear: '', endYear: '' }],
        certifications: [{ name: '', issuer: '', issueDate: '' }],
        projects: [{ name: '', description: '', technologies: '', role: '', link: '' }],
        availability: { status: 'Available', type: 'Full-time', startDate: '' },
        socialLinks: { linkedin: '', github: '', portfolio: '' },
        resumeText: ''
      });
      setActiveTab('profiles');
      dispatch(fetchApplicants(resolvedParams.id));
    } catch (err: any) {
      console.error('[Apply] Error:', err);
      console.error('[Apply] Error response:', err.response?.data);
      console.error('[Apply] Error status:', err.response?.status);
      alert(err.response?.data?.message || err.response?.data?.error || 'Failed to submit application');
    }
  };

  if (!job) {
    return (
      <div className="p-10">
        {jobError ? (
          <div className="text-red-500 font-bold">Error: {jobError}</div>
        ) : (
          <div className="font-bold text-gray-500 dark:text-gray-400">Loading Job Configuration...</div>
        )}
      </div>
    );
  }

  const displayList = results && results.length > 0 ? results : applicants;
  const selectedCandidate = results && results.length > 0 ? results[selectedCandidateIndex] : null;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      {/* Top Header Label */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h1 className="text-2xl font-bold text-[#142A4A] dark:text-slate-100 tracking-tight">{job.title}</h1>
        </div>
        <Link href={`/jobs/${resolvedParams.id}/edit`}>
          <button className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium px-4 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-800 transition">
            <Pencil className="h-4 w-4" />
            <span>Edit Job</span>
          </button>
        </Link>
      </div>

      {/* Top Info Card Strip */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col lg:flex-row justify-between p-6 transition-colors duration-300">
        <div className="space-y-4 pt-1 pb-1">
          <div className="flex items-center">
            <span className="font-semibold text-gray-800 dark:text-gray-300 w-32">Job Details:</span>
            <span className="text-gray-600 dark:text-gray-400">{job.skills?.join(', ') || 'Python, Machine Learning, SQL'}</span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-slate-800 h-px my-2 relative max-w-lg transition-colors"></div>
          <div className="flex items-center">
            <span className="font-semibold text-gray-800 dark:text-gray-300 w-32">Experience:</span>
            <span className="text-gray-600 dark:text-gray-400">{job.experienceLevel || '3+ Years'}</span>
          </div>
          <div className="flex items-center pt-2">
            <span className="font-semibold text-gray-800 dark:text-gray-300 w-32">Education:</span>
            <span className="text-gray-600 dark:text-gray-400">Bachelor's in Computer Science</span>
          </div>
        </div>
        
        {/* Right side abstract infographic */}
        <div className="hidden lg:flex w-80 h-32 bg-gradient-to-r from-blue-50/50 to-green-50/50 dark:from-blue-900/20 dark:to-green-900/20 rounded-lg items-center justify-center border border-gray-100 dark:border-slate-800 overflow-hidden relative mr-4 transition-colors">
            <div className="absolute left-6 top-6 w-3/4 h-3 bg-green-200/60 dark:bg-green-700/50 rounded-full"></div>
            <div className="absolute left-6 top-14 w-1/2 h-3 bg-blue-300/60 dark:bg-blue-700/50 rounded-full"></div>
            <div className="absolute left-6 top-22 w-full h-3 bg-indigo-200/60 dark:bg-indigo-700/50 rounded-full"></div>
            <div className="absolute right-4 bottom-4 w-16 h-16 rounded-full border-[6px] border-blue-200/50 dark:border-blue-800/40 opacity-80"></div>
        </div>
      </div>

      {/* Recruiter Apply Section */}
      {!isAdmin && user?.role === 'recruiter' && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-green-800 dark:text-green-400">Interested in this position?</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Apply now and get AI-screened for this role</p>
            </div>
            <button
              onClick={() => setActiveTab('apply')}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium shadow-sm transition"
            >
              Apply for this Job
            </button>
          </div>
        </div>
      )}

      {/* Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Tabs / Candidate List */}
        <div className="lg:col-span-8 flex flex-col space-y-4">
          
          <div className="flex justify-between items-end border-b border-gray-300 dark:border-slate-700 pb-0 transition-colors">
            <div className="flex px-1 space-x-1">
              <button 
                onClick={() => setActiveTab('profiles')} 
                className={`px-4 py-3 font-semibold text-sm transition-colors ${activeTab === 'profiles' ? 'text-blue-800 dark:text-blue-400 border-b-4 border-blue-700 dark:border-blue-500 bg-white dark:bg-slate-900 shadow-sm rounded-t-lg' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-t-lg'}`}
              >
                {isAdmin ? 'Structured Profiles' : 'Applicants'}
              </button>
              {!isAdmin && (
                <button 
                  onClick={() => setActiveTab('apply')} 
                  className={`px-4 py-3 font-semibold text-sm transition-colors ${activeTab === 'apply' ? 'text-green-800 dark:text-green-400 border-b-4 border-green-700 dark:border-green-500 bg-white dark:bg-slate-900 shadow-sm rounded-t-lg' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-t-lg'}`}
                >
                  Apply
                </button>
              )}
              {isAdmin && (
                <>
                  <button 
                    onClick={() => setActiveTab('resumes')} 
                    className={`px-4 py-3 font-semibold text-sm transition-colors ${activeTab === 'resumes' ? 'text-blue-800 dark:text-blue-400 border-b-4 border-blue-700 dark:border-blue-500 bg-white dark:bg-slate-900 shadow-sm rounded-t-lg' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-t-lg'}`}
                  >
                    Uploaded Resumes
                  </button>
                  <button 
                    onClick={() => setActiveTab('links')} 
                    className={`px-4 py-3 font-semibold text-sm transition-colors ${activeTab === 'links' ? 'text-blue-800 dark:text-blue-400 border-b-4 border-blue-700 dark:border-blue-500 bg-white dark:bg-slate-900 shadow-sm rounded-t-lg' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-t-lg'}`}
                  >
                    Resume Links
                  </button>
                  <button 
                    onClick={() => setActiveTab('form')} 
                    className={`px-4 py-3 font-semibold text-sm transition-colors ${activeTab === 'form' ? 'text-blue-800 dark:text-blue-400 border-b-4 border-blue-700 dark:border-blue-500 bg-white dark:bg-slate-900 shadow-sm rounded-t-lg' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-t-lg'}`}
                  >
                    Add via Form
                  </button>
                </>
              )}
            </div>
            
            {isAdmin && (
              <button 
                onClick={handleTriggerAI}
                disabled={screeningLoading || applicants.length === 0}
                className="bg-[#1250B3] hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white px-5 py-2 mb-2 rounded font-medium text-sm transition shadow disabled:opacity-50"
              >
                {screeningLoading ? 'Evaluating...' : 'Run AI Screening'}
              </button>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 p-6 min-h-[420px] transition-colors duration-300">
             {activeTab === 'form' ? (
                // Add via Form Tab
                <div className="py-4">
                   <h2 className="text-lg font-bold text-[#142A4A] dark:text-slate-200 mb-2">Add Applicant (Talent Profile)</h2>
                   <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Fill in the candidate details using the Talent Profile Schema.</p>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* 3.1 Basic Information */}
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 dark:text-slate-300">First Name *</label>
                        <input
                          type="text"
                          placeholder="John"
                          value={applicantForm.firstName || ''}
                          onChange={(e) => setApplicantForm({...applicantForm, firstName: e.target.value})}
                          className="w-full border border-gray-300 dark:border-slate-700 rounded-lg p-3 bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 dark:text-slate-300">Last Name *</label>
                        <input
                          type="text"
                          placeholder="Doe"
                          value={applicantForm.lastName || ''}
                          onChange={(e) => setApplicantForm({...applicantForm, lastName: e.target.value})}
                          className="w-full border border-gray-300 dark:border-slate-700 rounded-lg p-3 bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 dark:text-slate-300">Email *</label>
                        <input
                          type="email"
                          placeholder="john@example.com"
                          value={applicantForm.email || ''}
                          onChange={(e) => setApplicantForm({...applicantForm, email: e.target.value})}
                          className="w-full border border-gray-300 dark:border-slate-700 rounded-lg p-3 bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 dark:text-slate-300">Phone</label>
                        <input
                          type="tel"
                          placeholder="+250 123 456 789"
                          value={applicantForm.phone || ''}
                          onChange={(e) => setApplicantForm({...applicantForm, phone: e.target.value})}
                          className="w-full border border-gray-300 dark:border-slate-700 rounded-lg p-3 bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-semibold text-gray-700 dark:text-slate-300">Headline *</label>
                        <input
                          type="text"
                          placeholder="Backend Engineer - Node.js & AI Systems"
                          value={applicantForm.headline || ''}
                          onChange={(e) => setApplicantForm({...applicantForm, headline: e.target.value})}
                          className="w-full border border-gray-300 dark:border-slate-700 rounded-lg p-3 bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-semibold text-gray-700 dark:text-slate-300">Location *</label>
                        <input
                          type="text"
                          placeholder="Kigali, Rwanda"
                          value={applicantForm.location || ''}
                          onChange={(e) => setApplicantForm({...applicantForm, location: e.target.value})}
                          className="w-full border border-gray-300 dark:border-slate-700 rounded-lg p-3 bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      {/* 3.2 Skills */}
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-semibold text-gray-700 dark:text-slate-300">Primary Skill *</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Skill name (e.g., Node.js)"
                            value={applicantForm.skills[0]?.name || ''}
                            onChange={(e) => {
                              const newSkills = [...applicantForm.skills];
                              newSkills[0] = { ...newSkills[0], name: e.target.value };
                              setApplicantForm({...applicantForm, skills: newSkills});
                            }}
                            className="flex-1 border border-gray-300 dark:border-slate-700 rounded-lg p-3 bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <select
                            value={applicantForm.skills[0]?.level || 'Intermediate'}
                            onChange={(e) => {
                              const newSkills = [...applicantForm.skills];
                              newSkills[0] = { ...newSkills[0], level: e.target.value };
                              setApplicantForm({...applicantForm, skills: newSkills});
                            }}
                            className="border border-gray-300 dark:border-slate-700 rounded-lg p-3 bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-100"
                          >
                            <option value="Beginner">Beginner</option>
                            <option value="Intermediate">Intermediate</option>
                            <option value="Advanced">Advanced</option>
                            <option value="Expert">Expert</option>
                          </select>
                          <input
                            type="number"
                            placeholder="Years"
                            value={applicantForm.skills[0]?.yearsOfExperience || 0}
                            onChange={(e) => {
                              const newSkills = [...applicantForm.skills];
                              newSkills[0] = { ...newSkills[0], yearsOfExperience: Number(e.target.value) };
                              setApplicantForm({...applicantForm, skills: newSkills});
                            }}
                            className="w-20 border border-gray-300 dark:border-slate-700 rounded-lg p-3 bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-100"
                          />
                        </div>
                      </div>
                      
                      {/* 3.3 Work Experience */}
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-semibold text-gray-700 dark:text-slate-300">Most Recent Experience</label>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Company"
                            value={applicantForm.experience[0]?.company || ''}
                            onChange={(e) => {
                              const newExp = [...applicantForm.experience];
                              newExp[0] = { ...newExp[0], company: e.target.value };
                              setApplicantForm({...applicantForm, experience: newExp});
                            }}
                            className="border border-gray-300 dark:border-slate-700 rounded-lg p-3 bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-100"
                          />
                          <input
                            type="text"
                            placeholder="Role"
                            value={applicantForm.experience[0]?.role || ''}
                            onChange={(e) => {
                              const newExp = [...applicantForm.experience];
                              newExp[0] = { ...newExp[0], role: e.target.value };
                              setApplicantForm({...applicantForm, experience: newExp});
                            }}
                            className="border border-gray-300 dark:border-slate-700 rounded-lg p-3 bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-100"
                          />
                        </div>
                      </div>
                      
                      {/* 3.4 Education */}
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-semibold text-gray-700 dark:text-slate-300">Education</label>
                        <div className="grid grid-cols-3 gap-2">
                          <input
                            type="text"
                            placeholder="Institution"
                            value={applicantForm.education[0]?.institution || ''}
                            onChange={(e) => {
                              const newEdu = [...applicantForm.education];
                              newEdu[0] = { ...newEdu[0], institution: e.target.value };
                              setApplicantForm({...applicantForm, education: newEdu});
                            }}
                            className="border border-gray-300 dark:border-slate-700 rounded-lg p-3 bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-100"
                          />
                          <input
                            type="text"
                            placeholder="Degree (e.g., Bachelor's)"
                            value={applicantForm.education[0]?.degree || ''}
                            onChange={(e) => {
                              const newEdu = [...applicantForm.education];
                              newEdu[0] = { ...newEdu[0], degree: e.target.value };
                              setApplicantForm({...applicantForm, education: newEdu});
                            }}
                            className="border border-gray-300 dark:border-slate-700 rounded-lg p-3 bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-100"
                          />
                          <input
                            type="text"
                            placeholder="Field of Study"
                            value={applicantForm.education[0]?.fieldOfStudy || ''}
                            onChange={(e) => {
                              const newEdu = [...applicantForm.education];
                              newEdu[0] = { ...newEdu[0], fieldOfStudy: e.target.value };
                              setApplicantForm({...applicantForm, education: newEdu});
                            }}
                            className="border border-gray-300 dark:border-slate-700 rounded-lg p-3 bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-100"
                          />
                        </div>
                      </div>
                      
                      {/* 3.7 Availability */}
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 dark:text-slate-300">Availability Status</label>
                        <select
                          value={applicantForm.availability.status}
                          onChange={(e) => setApplicantForm({...applicantForm, availability: {...applicantForm.availability, status: e.target.value}})}
                          className="w-full border border-gray-300 dark:border-slate-700 rounded-lg p-3 bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-100"
                        >
                          <option value="Available">Available</option>
                          <option value="Open to Opportunities">Open to Opportunities</option>
                          <option value="Not Available">Not Available</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 dark:text-slate-300">Work Type</label>
                        <select
                          value={applicantForm.availability.type}
                          onChange={(e) => setApplicantForm({...applicantForm, availability: {...applicantForm.availability, type: e.target.value}})}
                          className="w-full border border-gray-300 dark:border-slate-700 rounded-lg p-3 bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-100"
                        >
                          <option value="Full-time">Full-time</option>
                          <option value="Part-time">Part-time</option>
                          <option value="Contract">Contract</option>
                        </select>
                      </div>
                      
                      {/* Resume Text */}
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-semibold text-gray-700 dark:text-slate-300">Bio / Additional Info</label>
                        <textarea
                          placeholder="Brief professional biography..."
                          value={applicantForm.bio || ''}
                          onChange={(e) => setApplicantForm({...applicantForm, bio: e.target.value})}
                          className="w-full border border-gray-300 dark:border-slate-700 rounded-lg p-3 bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows={3}
                        />
                      </div>
                   </div>
                   
                   <div className="mt-6 flex justify-end">
                      <button 
                        onClick={handleFormSubmit}
                        disabled={!(applicantForm.firstName || '').trim() || !(applicantForm.lastName || '').trim() || !(applicantForm.email || '').trim()}
                        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed dark:bg-green-700 dark:hover:bg-green-600 text-white font-semibold px-8 py-3 rounded-lg shadow transition-colors"
                      >
                        Add Applicant
                      </button>
                   </div>
                </div>
             ) : activeTab === 'links' ? (
                // Resume Links Tab
                <div className="py-8">
                   <h2 className="text-lg font-bold text-[#142A4A] dark:text-slate-200 mb-2">Add Resume Link</h2>
                   <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Paste a URL to a resume (Google Drive, Dropbox, LinkedIn, etc.)</p>
                   
                   <div className="space-y-4">
                      <input
                        type="url"
                        placeholder="https://..."
                        value={resumeUrl || ''}
                        onChange={(e) => setResumeUrl(e.target.value)}
                        className="w-full border border-blue-200 dark:border-slate-700 rounded-lg p-4 bg-blue-50/30 dark:bg-slate-950/50 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      
                      <button 
                        onClick={handleUrlSubmit}
                        disabled={!resumeUrl.trim()}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed dark:bg-blue-700 dark:hover:bg-blue-600 text-white font-semibold px-6 py-2 rounded shadow transition-colors"
                      >
                        Add Resume URL
                      </button>
                   </div>
                   
                   <div className="mt-6 p-4 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        <span className="font-semibold">Note:</span> For this demo, the system will store the URL. In production, you could integrate with services to fetch and parse resume content from these URLs.
                      </p>
                   </div>
                </div>
             ) : activeTab === 'apply' ? (
                // Apply Tab for Recruiters
                <div className="py-4">
                   <h2 className="text-lg font-bold text-green-800 dark:text-green-400 mb-2">Apply for this Position</h2>
                   <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Fill in your details to apply. The admin will review and run AI screening.</p>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 dark:text-slate-300">First Name *</label>
                        <input
                          type="text"
                          placeholder="John"
                          value={applicantForm.firstName || ''}
                          onChange={(e) => setApplicantForm({...applicantForm, firstName: e.target.value})}
                          className="w-full border border-gray-300 dark:border-slate-700 rounded-lg p-3 bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 dark:text-slate-300">Last Name *</label>
                        <input
                          type="text"
                          placeholder="Doe"
                          value={applicantForm.lastName || ''}
                          onChange={(e) => setApplicantForm({...applicantForm, lastName: e.target.value})}
                          className="w-full border border-gray-300 dark:border-slate-700 rounded-lg p-3 bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 dark:text-slate-300">Email *</label>
                        <input
                          type="email"
                          placeholder="john@example.com"
                          value={applicantForm.email || ''}
                          onChange={(e) => setApplicantForm({...applicantForm, email: e.target.value})}
                          className="w-full border border-gray-300 dark:border-slate-700 rounded-lg p-3 bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 dark:text-slate-300">Phone</label>
                        <input
                          type="tel"
                          placeholder="+250 123 456 789"
                          value={applicantForm.phone || ''}
                          onChange={(e) => setApplicantForm({...applicantForm, phone: e.target.value})}
                          className="w-full border border-gray-300 dark:border-slate-700 rounded-lg p-3 bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-semibold text-gray-700 dark:text-slate-300">Headline *</label>
                        <input
                          type="text"
                          placeholder="Backend Engineer - Node.js & AI Systems"
                          value={applicantForm.headline || ''}
                          onChange={(e) => setApplicantForm({...applicantForm, headline: e.target.value})}
                          className="w-full border border-gray-300 dark:border-slate-700 rounded-lg p-3 bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-semibold text-gray-700 dark:text-slate-300">Location *</label>
                        <input
                          type="text"
                          placeholder="Kigali, Rwanda"
                          value={applicantForm.location || ''}
                          onChange={(e) => setApplicantForm({...applicantForm, location: e.target.value})}
                          className="w-full border border-gray-300 dark:border-slate-700 rounded-lg p-3 bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-semibold text-gray-700 dark:text-slate-300">Primary Skill *</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Skill name (e.g., Node.js)"
                            value={applicantForm.skills[0]?.name || ''}
                            onChange={(e) => {
                              const newSkills = [...applicantForm.skills];
                              newSkills[0] = { ...newSkills[0], name: e.target.value };
                              setApplicantForm({...applicantForm, skills: newSkills});
                            }}
                            className="flex-1 border border-gray-300 dark:border-slate-700 rounded-lg p-3 bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                          <select
                            value={applicantForm.skills[0]?.level || 'Intermediate'}
                            onChange={(e) => {
                              const newSkills = [...applicantForm.skills];
                              newSkills[0] = { ...newSkills[0], level: e.target.value };
                              setApplicantForm({...applicantForm, skills: newSkills});
                            }}
                            className="border border-gray-300 dark:border-slate-700 rounded-lg p-3 bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-100"
                          >
                            <option value="Beginner">Beginner</option>
                            <option value="Intermediate">Intermediate</option>
                            <option value="Advanced">Advanced</option>
                            <option value="Expert">Expert</option>
                          </select>
                        </div>
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-semibold text-gray-700 dark:text-slate-300">Bio / Resume Summary</label>
                        <textarea
                          placeholder="Brief professional biography..."
                          value={applicantForm.bio || ''}
                          onChange={(e) => setApplicantForm({...applicantForm, bio: e.target.value})}
                          className="w-full border border-gray-300 dark:border-slate-700 rounded-lg p-3 bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                          rows={4}
                        />
                      </div>
                   </div>

                   <div className="mt-6 flex space-x-3">
                      <button
                        onClick={handleApply}
                        disabled={!applicantForm.firstName || !applicantForm.lastName || !applicantForm.email}
                        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-lg shadow transition"
                      >
                        Submit Application
                      </button>
                      <button
                        onClick={() => setActiveTab('profiles')}
                        className="bg-gray-200 hover:bg-gray-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-200 font-semibold px-6 py-3 rounded-lg transition"
                      >
                        Cancel
                      </button>
                   </div>
                </div>
             ) : activeTab === 'resumes' ? (
                // Resume Upload Tab
                <div className="py-8">
                   <h2 className="text-lg font-bold text-[#142A4A] dark:text-slate-200 mb-2">Upload Resume</h2>
                   <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Upload PDF, CSV, TXT, DOC, or DOCX files containing candidate resumes.</p>
                   
                   <div className="border-2 border-dashed border-blue-200 dark:border-slate-700 rounded-lg p-8 text-center bg-blue-50/30 dark:bg-slate-950/30 hover:bg-blue-50/50 dark:hover:bg-slate-900/50 transition-colors">
                      <input
                        type="file"
                        accept=".pdf,.csv,.txt,.doc,.docx"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="resume-upload"
                      />
                      <label htmlFor="resume-upload" className="cursor-pointer block">
                        <FileText className="h-12 w-12 mx-auto text-blue-500 dark:text-blue-400 mb-4" />
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                          {uploadFile ? uploadFile.name : 'Click to select a file'}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          Supports: PDF, CSV, TXT, DOC, DOCX
                        </p>
                      </label>
                   </div>
                   
                   {uploadFile && (
                      <div className="mt-4 p-3 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
                         <p className="text-sm text-gray-700 dark:text-gray-300">
                           <span className="font-semibold">Selected:</span> {uploadFile.name} ({Math.round(uploadFile.size / 1024)} KB)
                         </p>
                      </div>
                   )}
                   
                   <button 
                     onClick={handleFileUpload} 
                     disabled={!uploadFile}
                     className="mt-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed dark:bg-blue-700 dark:hover:bg-blue-600 text-white font-semibold px-6 py-2 rounded shadow transition-colors"
                   >
                     Upload Resume
                   </button>
                </div>
             ) : (
                // Profiles Tab
                results && results.length > 0 ? (
                   <div>
                      <div className="flex justify-between mb-4 items-center">
                        <h2 className="text-lg font-bold text-[#142A4A] dark:text-slate-200">Top 10 Candidates</h2>
                        <span className="text-gray-400 dark:text-gray-500 cursor-pointer">˅ ›</span>
                      </div>
                      
                      <div className="space-y-4">
                        {results.map((resItem: any, index: number) => {
                          const sc = resItem.score || 0;
                          const badgeBg = index === 0 ? 'bg-[#da7b43] dark:bg-orange-600' : index === 1 ? 'bg-[#50b171] dark:bg-green-600' : 'bg-[#e2834c] dark:bg-orange-500';
                          
                          return (
                            <div 
                              key={index} 
                              className={`p-4 rounded-lg border-2 transition-all flex items-center justify-between ${selectedCandidateIndex === index ? 'border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-800/50' : 'border-gray-100 dark:border-slate-800/60 hover:border-blue-200 dark:hover:border-slate-600'}`}
                            >
                              <div 
                                onClick={() => setSelectedCandidateIndex(index)}
                                className="flex items-center space-x-4 flex-1 cursor-pointer"
                              >
                                <div className="font-bold text-2xl text-[#142A4A] dark:text-slate-300 w-6">{index + 1}.</div>
                                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex-shrink-0 border border-gray-300 dark:border-gray-600">
                                  <img src={`https://i.pravatar.cc/150?img=${30 + index}`} alt="avatar" />
                                </div>
                                <div>
                                  <h3 className="font-bold text-[#142A4A] dark:text-slate-200 text-[16px] leading-tight mb-1">{resItem.applicantId?.name || 'Unknown'}</h3>
                                  <p className="text-xs text-gray-600 dark:text-gray-400 truncate w-64 font-medium">
                                     {resItem.reasoningText?.substring(0, 50)}...
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <div className={`${badgeBg} px-3 py-1 rounded text-white text-sm font-bold tracking-wide shadow-sm`}>
                                  {sc}
                                </div>
                                {isAdmin && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteApplicant(resItem.applicantId?._id);
                                    }}
                                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                                    title="Delete applicant"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>

                      <div className="mt-8 flex justify-center">
                        <Link href={`/jobs/${resolvedParams.id}/shortlist`}>
                          <button className="bg-[#1250B3] hover:bg-blue-800 dark:bg-blue-700 dark:hover:bg-blue-600 text-white px-8 py-2 rounded font-medium text-sm transition shadow-md flex items-center">
                            View Full List <ArrowRight className="ml-2 h-4 w-4" />
                          </button>
                        </Link>
                      </div>
                   </div>
                ) : (
                   <div className="py-4">
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-bold text-[#142A4A] dark:text-slate-200">Applicants ({applicants.length})</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Add applicants via the "Add via Form" tab</p>
                      </div>
                      
                      {applicants.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
                          <p className="text-gray-500 dark:text-gray-400">No applicants yet. Click "Add via Form" to add candidates.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {applicants.map((applicant: any, index: number) => (
                            <div 
                              key={applicant._id} 
                              className="p-4 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-between"
                            >
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex-shrink-0">
                                  <img src={`https://i.pravatar.cc/150?img=${30 + index}`} alt="avatar" />
                                </div>
                                <div>
                                  <h3 className="font-semibold text-[#142A4A] dark:text-slate-200">{applicant.name || 'Unknown'}</h3>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">{applicant.email || 'No email'}</p>
                                  {applicant.skills?.length > 0 && (
                                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                      {applicant.skills.slice(0, 3).map((s: any) => typeof s === 'string' ? s : s.name).join(', ')}
                                    </p>
                                  )}
                                </div>
                              </div>
                              {isAdmin && (
                                <button
                                  onClick={() => handleDeleteApplicant(applicant._id)}
                                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                                  title="Delete applicant"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                   </div>
                )
             )}
          </div>
        </div>

        {/* Right Side: Detailed Breakdown */}
        <div className="lg:col-span-4 flex flex-col space-y-4">
           {selectedCandidate ? (
             <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden flex flex-col h-full mt-10 transition-colors duration-300">
               
               <div className="p-5 border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors">
                 <h2 className="font-bold text-[17px] text-[#142A4A] dark:text-slate-200">
                   {selectedCandidate.applicantId?.name || 'Candidate'} - Ranked #{selectedCandidateIndex + 1}
                 </h2>
               </div>
               
               <div className="p-5 border-b border-gray-200 dark:border-slate-800 bg-[#fbfcfd] dark:bg-slate-800/40 transition-colors">
                 <div className="flex items-center">
                   <span className="text-gray-600 dark:text-gray-400 text-[15px] font-semibold">Match Score: </span>
                   <span className="text-[32px] font-black text-[#142A4A] dark:text-white ml-2 tracking-tight">{selectedCandidate.score || 0}</span>
                 </div>
               </div>

               <div className="p-6 space-y-7 flex-1">
                 
                 <div>
                   <h3 className="font-bold text-[#1a3861] dark:text-blue-400 text-[15px] mb-3">Strengths:</h3>
                   <ul className="space-y-3">
                     {selectedCandidate.strengths?.slice(0, 3).map((s: string, i: number) => (
                       <li key={i} className="flex items-start text-sm text-gray-700 dark:text-gray-300 font-medium">
                         <div className="bg-green-500 text-white rounded-full p-0.5 mr-2.5 mt-0.5 flex-shrink-0">
                           <CheckCircle2 className="w-3.5 h-3.5" /> 
                         </div>
                         <span className="leading-tight pt-0.5">{s}</span>
                       </li>
                     ))}
                   </ul>
                 </div>

                 <div className="border-t border-dashed border-gray-200 dark:border-slate-700 pt-5">
                    <h3 className="font-bold text-[#1a3861] dark:text-blue-400 text-[15px] mb-3">Gaps:</h3>
                    <ul className="space-y-3">
                     {selectedCandidate.gaps?.slice(0, 2).map((g: string, i: number) => (
                       <li key={i} className="flex items-start text-sm text-gray-700 dark:text-gray-300 font-medium">
                         <div className="bg-[#cc4242] text-white rounded-full p-0.5 mr-2.5 mt-0.5 flex-shrink-0">
                           <XCircle className="w-3.5 h-3.5" /> 
                         </div>
                         <span className="leading-tight pt-0.5">{g}</span>
                       </li>
                     ))}
                    </ul>
                 </div>
                 
                 <div className="border-t border-gray-200 dark:border-slate-700 pt-5 mt-auto">
                    <h3 className="font-bold text-[#142A4A] dark:text-slate-300 text-[15px] mb-3">Why Recommended?</h3>
                    <p className="text-[13px] text-gray-500 dark:text-gray-400 ml-4 italic mt-2 leading-relaxed border-l-2 border-blue-500 pl-3">"{selectedCandidate.reasoningText}"</p>
                 </div>
               </div>
             </div>
           ) : (
             <div className="bg-[#142A4A]/5 dark:bg-slate-800/30 rounded-xl border-2 border-dashed border-[#142A4A]/20 dark:border-slate-700 h-full mt-10 min-h-[500px] flex flex-col items-center justify-center p-8 text-center text-[#142A4A]/60 dark:text-gray-500 transition-colors">
                 <Grid className="w-10 h-10 mb-4 opacity-50" />
                 <p className="font-semibold text-lg">Awaiting AI Evaluation</p>
                 <p className="text-sm mt-2 max-w-[200px]">Trigger the screening engine to generate dynamic scorecard dashboards!</p>
             </div>
           )}
        </div>
      </div>

      {/* Bottom Feature Pill Cards directly mirroring mockup */}
      {results && results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl px-5 py-4 shadow-sm border border-gray-100 dark:border-slate-800 flex items-start space-x-4 transition-colors">
             <div className="text-blue-600 dark:text-blue-400 mt-1"><FileText className="w-6 h-6" /></div>
             <div>
               <h4 className="font-bold text-[15px] text-[#142A4A] dark:text-slate-200">Resume Parsing</h4>
               <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">Extracting key data from resumes.</p>
             </div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-xl px-5 py-4 shadow-sm border border-gray-100 dark:border-slate-800 flex items-start space-x-4 transition-colors">
             <div className="text-blue-600 dark:text-blue-400 mt-1"><CheckSquare className="w-6 h-6" /></div>
             <div>
               <h4 className="font-bold text-[15px] text-[#142A4A] dark:text-slate-200">AI Analysis & Ranking</h4>
               <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">Scoring & ranking candidates.</p>
             </div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-xl px-5 py-4 shadow-sm border border-gray-100 dark:border-slate-800 flex items-start space-x-4 transition-colors">
             <div className="text-blue-600 dark:text-blue-400 mt-1"><MessageSquare className="w-6 h-6" /></div>
             <div>
               <h4 className="font-bold text-[15px] text-[#142A4A] dark:text-slate-200">Insightful Explanations</h4>
               <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">Clear reasons for selection.</p>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
