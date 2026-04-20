"use client";

import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/store';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';

const getApiBaseUrl = (): string => {
  const raw = process.env.NEXT_PUBLIC_API_URL;
  if (!raw) return 'http://localhost:5000/api';
  const trimmed = raw.replace(/\/+$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};

const API_URL = getApiBaseUrl();

export default function EditJob() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    department: '',
    location: '',
    description: '',
    requirements: '',
    skills: '',
    experienceLevel: ''
  });

  useEffect(() => {
    fetchJob();
  }, [jobId]);

  const fetchJob = async () => {
    try {
      const response = await axios.get(`${API_URL}/jobs/${jobId}`);
      const job = response.data;
      setFormData({
        title: job.title || '',
        department: job.department || '',
        location: job.location || '',
        description: job.description || '',
        requirements: Array.isArray(job.requirements) ? job.requirements.join(', ') : job.requirements || '',
        skills: Array.isArray(job.skills) ? job.skills.join(', ') : job.skills || '',
        experienceLevel: job.experienceLevel || ''
      });
    } catch (error) {
      alert('Failed to load job');
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.put(`${API_URL}/jobs/${jobId}`, formData);
      alert('Job updated successfully');
      router.push(`/jobs/${jobId}`);
    } catch (error: any) {
      alert('Failed to update job: ' + (error.response?.data?.message || error.message));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="flex items-center space-x-4 mb-8">
        <Link href={`/jobs/${jobId}`} className="p-2 hover:bg-gray-200 dark:hover:bg-slate-800 rounded-full transition text-gray-600 dark:text-slate-300">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">Edit Job</h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1">Update job requirements and details</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-slate-300">Job Title</label>
              <input 
                required
                className="w-full border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-950 rounded-lg p-3 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" 
                placeholder="e.g. AI Scientist"
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-slate-300">Department</label>
              <input 
                required
                className="w-full border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-950 rounded-lg p-3 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" 
                placeholder="e.g. Engineering"
                value={formData.department}
                onChange={e => setFormData({...formData, department: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-slate-300">Location</label>
              <input 
                required
                className="w-full border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-950 rounded-lg p-3 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" 
                placeholder="e.g. Remote, Kigali"
                value={formData.location}
                onChange={e => setFormData({...formData, location: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-slate-300">Experience Required</label>
              <input 
                required
                className="w-full border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-950 rounded-lg p-3 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" 
                placeholder="e.g. 5+ Years"
                value={formData.experienceLevel}
                onChange={e => setFormData({...formData, experienceLevel: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-slate-300">Job Description</label>
            <textarea 
              required
              rows={4}
              className="w-full border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-950 rounded-lg p-3 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none transition" 
              placeholder="Detailed description of the role..."
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-slate-300">Mandatory Skills (Comma separated)</label>
            <input 
              required
              className="w-full border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-950 rounded-lg p-3 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none transition font-mono text-sm" 
              placeholder="e.g. Python, Machine Learning, SQL"
              value={formData.skills}
              onChange={e => setFormData({...formData, skills: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-slate-300">Detailed Requirements (Comma separated)</label>
            <textarea 
              required
              rows={3}
              className="w-full border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-950 rounded-lg p-3 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none transition font-mono text-sm" 
              placeholder="e.g. Bachelor's in CS, Proven ML track record"
              value={formData.requirements}
              onChange={e => setFormData({...formData, requirements: e.target.value})}
            />
          </div>

          <div className="pt-6 border-t border-gray-100 dark:border-slate-800 flex justify-between">
            <Link href={`/jobs/${jobId}`}>
              <button type="button" className="text-gray-600 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-200 font-medium py-3 px-6 rounded-lg transition">
                Cancel
              </button>
            </Link>
            <button 
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg shadow-sm flex items-center transition disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {saving ? (
                <Loader2 className="animate-spin h-5 w-5 mr-3" />
              ) : (
                <Save className="h-5 w-5 mr-3" />
              )}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
