"use client";

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import { Briefcase, CheckCircle, XCircle, Clock, ArrowLeft, Award } from 'lucide-react';

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

interface Application {
  _id: string;
  jobId: {
    _id: string;
    title: string;
    department: string;
    location: string;
  };
  name: string;
  email: string;
  skills: (string | Skill)[];
  createdAt: string;
  screeningResult?: {
    score: number;
    status: 'shortlisted' | 'rejected' | 'pending';
    reasoningText: string;
  };
}

export default function MyApplications() {
  const router = useRouter();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not authenticated or not a recruiter
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (user?.role === 'admin') {
      router.push('/');
      return;
    }
  }, [isAuthenticated, user, router]);

  useEffect(() => {
    const fetchApplications = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const response = await axios.get(`${API_URL}/applicants/my-applications`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setApplications(response.data);
      } catch (err: any) {
        console.error('[MyApplications] Error:', err);
        setError(err.response?.data?.message || 'Failed to load applications');
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'shortlisted':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'shortlisted':
        return 'Shortlisted';
      case 'rejected':
        return 'Not Selected';
      default:
        return 'Pending Review';
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'shortlisted':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    }
  };

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
      <div className="flex items-center justify-between pb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">My Applications</h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1">
            Track your job applications and screening results
          </p>
        </div>
        <Link href="/jobs">
          <button className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Jobs</span>
          </button>
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <p className="text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {applications.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-gray-200 dark:border-slate-700">
          <Briefcase className="mx-auto h-12 w-12 text-gray-300 dark:text-slate-600 mb-4" />
          <h2 className="text-lg font-bold">No applications yet</h2>
          <p className="text-gray-500 dark:text-slate-400 mt-2 mb-6">
            You haven't applied to any jobs yet.
          </p>
          <Link href="/jobs">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition">
              Browse Jobs
            </button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <div
              key={app._id}
              className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 p-6 transition-all hover:shadow-md"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Job Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Briefcase className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100">
                      {app.jobId?.title || 'Unknown Job'}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-slate-400 mb-2">
                    {app.jobId?.department} • {app.jobId?.location}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-slate-400">
                    Applied on {new Date(app.createdAt).toLocaleDateString()}
                  </p>
                  {app.skills?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {app.skills.slice(0, 5).map((skill, idx) => {
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
                    </div>
                  )}
                </div>

                {/* Screening Result */}
                <div className="flex flex-col items-start md:items-end gap-2">
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${getStatusColor(app.screeningResult?.status)}`}>
                    {getStatusIcon(app.screeningResult?.status)}
                    <span className="font-semibold text-sm">{getStatusText(app.screeningResult?.status)}</span>
                  </div>
                  
                  {app.screeningResult?.score !== undefined && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-400">
                      <Award className="h-4 w-4" />
                      <span>Score: {app.screeningResult.score}/100</span>
                    </div>
                  )}
                  
                  {app.screeningResult?.reasoningText && (
                    <p className="text-xs text-gray-500 dark:text-slate-500 max-w-xs text-right">
                      {app.screeningResult.reasoningText.substring(0, 100)}...
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
