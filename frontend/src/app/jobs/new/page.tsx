"use client";

import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { createJob } from '@/store/slices/jobsSlice';
import { AppDispatch } from '@/store';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

export default function NewJob() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const [formData, setFormData] = useState({
    title: '',
    department: '',
    location: '',
    description: '',
    requirements: '',
    skills: '',
    experienceLevel: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await dispatch(createJob(formData)).unwrap();
      router.push('/');
    } catch (error) {
      console.error(error);
      alert('Failed to create job');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="flex items-center space-x-4 mb-8">
        <Link href="/" className="p-2 hover:bg-gray-200 dark:hover:bg-slate-800 rounded-full transition text-gray-600 dark:text-slate-300">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">Create New Job</h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1">Fill out the requirements to open a new role</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-slate-300">Job Title</label>
              <input 
                autoFocus
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

          <div className="pt-6 border-t border-gray-100 dark:border-slate-800 flex justify-end">
            <button 
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg shadow-sm flex items-center transition disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
              ) : (
                <Save className="h-5 w-5 mr-3" />
              )}
              {isSubmitting ? 'Creating Job...' : 'Publish Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
