"use client";

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { fetchJobs, deleteJob } from '@/store/slices/jobsSlice';
import { AppDispatch, RootState } from '@/store';
import Link from 'next/link';
import { Briefcase, MapPin, Plus, Users, ArrowRight, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { list: jobs, loading } = useSelector((state: RootState) => state.jobs);
  const { user } = useSelector((state: RootState) => state.auth);

  // Redirect unauthenticated to landing, recruiters to jobs
  useEffect(() => {
    if (!user) {
      router.push('/');
    } else if (user.role === 'recruiter') {
      router.push('/jobs');
    }
  }, [user, router]);

  useEffect(() => {
    dispatch(fetchJobs());
  }, [dispatch]);

  const handleDeleteJob = async (jobId: string, jobTitle: string) => {
    if (confirm(`Are you sure you want to delete "${jobTitle}"? This action cannot be undone.`)) {
      try {
        await dispatch(deleteJob(jobId)).unwrap();
        alert('Job deleted successfully');
      } catch (error) {
        alert('Failed to delete job');
      }
    }
  };

  // Show loading while checking auth
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 text-gray-900 dark:text-slate-100 transition-colors">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0 pb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Active Job Openings</h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1">Manage recruiting positions and candidates</p>
        </div>
        <Link href="/jobs/new">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="inline-flex items-center justify-center bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg shadow-sm font-medium transition cursor-pointer">
            <Plus className="mr-2 h-5 w-5" />
            Create New Job
          </motion.div>
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
           {[1,2,3].map((_, i) => (
             <div key={i} className="h-48 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-xl shadow-sm"></div>
           ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-gray-200 dark:border-slate-700">
          <Briefcase className="mx-auto h-12 w-12 text-gray-300 dark:text-slate-600 mb-4" />
          <h2 className="text-lg font-bold">No jobs posted yet</h2>
          <p className="text-gray-500 dark:text-slate-400 mt-2 mb-6">Create your first job order to start recruiting candidates.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {jobs.map((job: any) => (
            <motion.div key={job._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex relative group">
              <Link href={`/jobs/${job._id}`} className="flex-1">
                <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-slate-600 rounded-xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] dark:shadow-none p-6 transition-all hover:shadow-md cursor-pointer flex flex-col h-full">
                  
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                      {job.title}
                    </h2>
                    <span className="bg-emerald-100 dark:bg-green-900/30 text-emerald-800 dark:text-emerald-400 text-xs font-bold px-2 py-1 rounded">Active</span>
                  </div>
                  
                  <div className="space-y-2 mb-6 flex-1">
                    <div className="flex items-center text-gray-600 dark:text-slate-400 text-sm font-medium">
                      <Briefcase className="mr-2 h-4 w-4" />
                      {job.department}
                    </div>
                    <div className="flex items-center text-gray-600 dark:text-slate-400 text-sm font-medium">
                      <MapPin className="mr-2 h-4 w-4" />
                      {job.location}
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-100 dark:border-slate-800 flex justify-between items-center mt-auto">
                    <div className="flex items-center text-sm font-medium text-gray-500 dark:text-slate-400">
                      <Users className="mr-1.5 h-4 w-4" />
                      Applicants Pool
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                  </div>

                </div>
              </Link>
              
              {/* Delete Button */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDeleteJob(job._id, job.title);
                }}
                className="absolute top-2 right-2 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                title="Delete job"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
