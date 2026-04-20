"use client";

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { fetchJobs, deleteJob } from '@/store/slices/jobsSlice';
import { AppDispatch, RootState } from '@/store';
import Link from 'next/link';
import { Briefcase, MapPin, Plus, Users, ArrowRight, Trash2, Sparkles, Zap, Shield, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

// Landing Page Component
function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Navbar */}
      <nav className="px-6 py-4 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center space-x-2">
          <Sparkles className="h-8 w-8 text-blue-400" />
          <span className="text-2xl font-bold text-white">AI Recruit</span>
        </div>
        <div className="flex items-center space-x-4">
          <Link href="/login">
            <button className="text-white hover:text-blue-300 font-medium px-4 py-2 transition">
              Login
            </button>
          </Link>
          <Link href="/register">
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg transition shadow-lg">
              Get Started
            </button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-6 py-20 max-w-7xl mx-auto text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight"
        >
          AI-Powered <span className="text-blue-400">Recruitment</span>
          <br />
          Made Simple
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto"
        >
          Automatically screen and shortlist candidates using Google&apos;s Gemini AI.
          Save time, reduce bias, and find the perfect fit faster.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col sm:flex-row justify-center gap-4"
        >
          <Link href="/register">
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-lg text-lg transition shadow-lg flex items-center justify-center">
              Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
            </button>
          </Link>
          <Link href="/login">
            <button className="bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-4 rounded-lg text-lg transition backdrop-blur">
              Sign In
            </button>
          </Link>
        </motion.div>
      </section>

      {/* Features */}
      <section className="px-6 py-20 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-white text-center mb-16">Key Features</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: <Zap className="h-10 w-10 text-yellow-400" />,
              title: "AI Screening",
              desc: "Automatically screen candidates with Gemini AI. Get match scores, strengths, and gaps analysis."
            },
            {
              icon: <Users className="h-10 w-10 text-green-400" />,
              title: "Role-Based Access",
              desc: "Admins manage jobs and screening. Recruiters view results and apply to positions."
            },
            {
              icon: <Shield className="h-10 w-10 text-blue-400" />,
              title: "Secure & Scalable",
              desc: "JWT authentication, MongoDB database, and enterprise-ready security."
            }
          ].map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 + idx * 0.1 }}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 hover:bg-white/15 transition"
            >
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
              <p className="text-slate-300">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="px-6 py-20 bg-black/20">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-16">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: "1", title: "Create Job", desc: "Admin creates a job posting with requirements" },
              { step: "2", title: "Add Candidates", desc: "Upload resumes or add candidates via form" },
              { step: "3", title: "AI Screening", desc: "Admin runs AI to score and rank candidates" },
              { step: "4", title: "Review & Hire", desc: "Review top candidates with AI reasoning" }
            ].map((item, idx) => (
              <div key={idx} className="text-center">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-2xl font-bold text-white mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                <p className="text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing/Plans */}
      <section className="px-6 py-20 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-white text-center mb-16">Simple Pricing</h2>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Admin Plan */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border-2 border-blue-500/50">
            <h3 className="text-2xl font-bold text-white mb-2">Admin</h3>
            <p className="text-slate-400 mb-6">Full system access</p>
            <ul className="space-y-3 mb-8">
              {[
                "Create & manage jobs",
                "Run AI screening",
                "View all candidates",
                "Delete jobs & applicants",
                "Access shortlists"
              ].map((feature, idx) => (
                <li key={idx} className="flex items-center text-slate-300">
                  <CheckCircle className="h-5 w-5 text-green-400 mr-2" /> {feature}
                </li>
              ))}
            </ul>
            <Link href="/register">
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition">
                Register as Admin
              </button>
            </Link>
          </div>

          {/* Recruiter Plan */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-white mb-2">Recruiter</h3>
            <p className="text-slate-400 mb-6">View-only access</p>
            <ul className="space-y-3 mb-8">
              {[
                "View job listings",
                "Apply to jobs",
                "View screening results",
                "See ranked shortlists"
              ].map((feature, idx) => (
                <li key={idx} className="flex items-center text-slate-300">
                  <CheckCircle className="h-5 w-5 text-green-400 mr-2" /> {feature}
                </li>
              ))}
            </ul>
            <Link href="/register">
              <button className="w-full bg-white/10 hover:bg-white/20 text-white font-semibold py-3 rounded-lg transition">
                Register as Recruiter
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-white/10">
        <div className="max-w-7xl mx-auto text-center text-slate-400">
          <p>&copy; 2024 AI Recruitment System. Built for the AI Innovation Challenge.</p>
        </div>
      </footer>
    </div>
  );
}

// Dashboard Component
function Dashboard() {
  const dispatch = useDispatch<AppDispatch>();
  const { list: jobs, loading } = useSelector((state: RootState) => state.jobs);
  const router = useRouter();

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

// Main Page Component
export default function HomePage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const router = useRouter();

  // Redirect recruiters to jobs page
  useEffect(() => {
    if (user?.role === 'recruiter') {
      router.push('/jobs');
    }
  }, [user, router]);

  // Show landing page for unauthenticated users
  if (!user) {
    return <LandingPage />;
  }

  // Show dashboard for logged-in admins
  return <Dashboard />;
}
