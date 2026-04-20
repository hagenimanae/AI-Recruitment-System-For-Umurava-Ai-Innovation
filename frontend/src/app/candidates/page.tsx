"use client";

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import { Users, Search, ArrowLeft, Award, Briefcase, Mail, Phone } from 'lucide-react';

const getApiBaseUrl = (): string => {
  const raw = process.env.NEXT_PUBLIC_API_URL;
  if (!raw) return 'http://localhost:5000/api';
  const trimmed = raw.replace(/\/+$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};

const API_URL = getApiBaseUrl();

interface Skill {
  name: string;
  level?: string;
  yearsOfExperience?: number;
}

interface Candidate {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  skills: (string | Skill)[];
  experience: any[];
  education: any[];
  jobId?: {
    _id: string;
    title: string;
  };
  createdAt: string;
}

export default function Candidates() {
  const router = useRouter();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    const fetchCandidates = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        // Fetch all applicants across all jobs
        const response = await axios.get(`${API_URL}/applicants/all`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCandidates(response.data);
      } catch (err: any) {
        console.error('[Candidates] Error:', err);
        // If the endpoint doesn't exist, try fetching from individual jobs
        try {
          const jobsResponse = await axios.get(`${API_URL}/jobs`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const jobs = jobsResponse.data;
          let allCandidates: Candidate[] = [];
          
          for (const job of jobs) {
            try {
              const appResponse = await axios.get(`${API_URL}/applicants/${job._id}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              const appsWithJob = appResponse.data.map((app: any) => ({
                ...app,
                jobId: { _id: job._id, title: job.title }
              }));
              allCandidates = [...allCandidates, ...appsWithJob];
            } catch (e) {
              // Ignore errors for individual jobs
            }
          }
          setCandidates(allCandidates);
        } catch (e2) {
          setError('Failed to load candidates');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCandidates();
  }, []);

  const filteredCandidates = candidates.filter(candidate =>
    candidate.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    candidate.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    candidate.skills?.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 text-gray-900 dark:text-slate-100 transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-8">
        <div className="flex items-center gap-4">
          <Link href="/">
            <button className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium">
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </button>
          </Link>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-600" />
              Candidate Pool
            </h1>
            <p className="text-gray-500 dark:text-slate-400 mt-1">
              Browse all applicants across all job postings
            </p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, or skills..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <p className="text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Candidates Grid */}
      {filteredCandidates.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-gray-200 dark:border-slate-700">
          <Users className="mx-auto h-12 w-12 text-gray-300 dark:text-slate-600 mb-4" />
          <h2 className="text-lg font-bold">No candidates found</h2>
          <p className="text-gray-500 dark:text-slate-400 mt-2">
            {searchTerm ? 'Try adjusting your search terms' : 'No applicants have been added yet'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCandidates.map((candidate) => (
            <div
              key={candidate._id}
              className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 p-6 transition-all hover:shadow-md"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                    <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                      {candidate.name?.charAt(0)?.toUpperCase() || '?'}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-slate-100">{candidate.name}</h3>
                    <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-slate-400">
                      <Mail className="h-3 w-3" />
                      {candidate.email}
                    </div>
                  </div>
                </div>
              </div>

              {candidate.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-400 mb-3">
                  <Phone className="h-4 w-4" />
                  {candidate.phone}
                </div>
              )}

              {candidate.jobId && (
                <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 mb-3">
                  <Briefcase className="h-4 w-4" />
                  Applied for: {candidate.jobId.title}
                </div>
              )}

              {candidate.skills?.length > 0 && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    {candidate.skills.slice(0, 5).map((skill, idx) => {
                      const skillName = typeof skill === 'string' ? skill : skill.name;
                      return (
                        <span
                          key={idx}
                          className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs px-2 py-1 rounded-full"
                        >
                          {skillName}
                        </span>
                      );
                    })}
                    {candidate.skills.length > 5 && (
                      <span className="text-xs text-gray-500 dark:text-slate-400">
                        +{candidate.skills.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="text-xs text-gray-400 dark:text-slate-500">
                Added {new Date(candidate.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
