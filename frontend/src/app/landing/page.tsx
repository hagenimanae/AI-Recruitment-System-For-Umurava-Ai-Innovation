"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles, Users, Shield, Zap, ArrowRight, CheckCircle } from 'lucide-react';

export default function LandingPage() {
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
          Automatically screen and shortlist candidates using Google's Gemini AI.
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
