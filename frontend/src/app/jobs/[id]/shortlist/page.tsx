"use client";

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchScreeningResults } from '@/store/slices/applicantsSlice';
import { AppDispatch, RootState } from '@/store';
import { ArrowLeft, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function Shortlist() {
  const params = useParams();
  const jobId = params.id as string;
  const dispatch = useDispatch<AppDispatch>();
  const { results, screeningLoading } = useSelector((state: RootState) => state.applicants);

  useEffect(() => {
    if (jobId) {
      dispatch(fetchScreeningResults(jobId));
    }
  }, [dispatch, jobId]);

  // Sort results by score descending (highest first)
  const sortedResults = [...results].sort((a: any, b: any) => (b.score || 0) - (a.score || 0));

  if (screeningLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <h2 className="text-xl font-medium bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">Gemini is analyzing candidates...</h2>
        <p className="text-muted-foreground text-sm">Evaluating profiles and scoring matches</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex items-center space-x-4">
        <Link href={`/jobs/${jobId}`} className="p-2 hover:bg-white/10 rounded-full transition">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Shortlist</h1>
          <p className="text-muted-foreground">Ranked candidates based on AI matching reasoning</p>
        </div>
      </div>

      <div className="space-y-6">
        {results.length === 0 ? (
          <div className="text-center py-12 p-6 glass rounded-xl">
            <h3 className="text-xl font-medium mb-2">No shortlists generated</h3>
            <p className="text-muted-foreground">Go back to the job view to trigger Gemini AI Screening.</p>
          </div>
        ) : (
          sortedResults.map((result: any, idx: number) => (
            <div key={result._id || idx} className="glass rounded-xl overflow-hidden shadow-lg border border-[hsl(var(--border))] transition-all hover:border-primary/50 relative">
              <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                 <span className="text-8xl font-black">{idx + 1}</span>
              </div>
              <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8">
                {/* Left side: Candidate Info & Score */}
                <div className="md:w-1/3 flex flex-col justify-between border-b md:border-b-0 md:border-r border-[hsl(var(--border))] pb-6 md:pb-0 md:pr-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white">{result.applicantId?.name || 'Unknown Candidate'}</h2>
                    <p className="text-muted-foreground text-sm mt-1">{result.applicantId?.email || 'No email'}</p>
                    
                    <div className="mt-6 p-4 rounded-lg bg-black/30 border border-white/5 text-center">
                      <div className="text-4xl font-bold text-primary">{result.score}<span className="text-lg text-muted-foreground">/100</span></div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mt-1">Match Score</div>
                    </div>
                  </div>
                  
                  <div className="mt-8">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                      result.recommendation?.toLowerCase().includes('highly') ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 
                      result.recommendation?.toLowerCase().includes('reject') ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 
                      'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    }`}>
                      {result.recommendation || 'Pending'}
                    </span>
                  </div>
                </div>

                {/* Right side: AI Reasoning */}
                <div className="md:w-2/3 space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold flex items-center mb-3">
                      <ShieldCheck className="h-5 w-5 mr-2 text-indigo-400" /> AI Reasoning
                    </h3>
                    <p className="text-sm text-gray-300 leading-relaxed bg-black/20 p-4 rounded-lg border border-white/5">
                      {result.reasoningText || 'No reasoning provided'}
                    </p>
                  </div>
                  
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-semibold flex items-center text-green-400 mb-3">
                        <CheckCircle2 className="h-4 w-4 mr-1.5" /> Strengths
                      </h4>
                      <ul className="space-y-2">
                        {(result.strengths || []).map((s: string, i: number) => (
                          <li key={i} className="text-xs text-gray-300 flex items-start">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-500 mr-2 mt-1.5 flex-shrink-0"></span>
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold flex items-center text-red-400 mb-3">
                        <AlertTriangle className="h-4 w-4 mr-1.5" /> Gaps / Risks
                      </h4>
                      <ul className="space-y-2">
                        {(result.gaps || []).map((g: string, i: number) => (
                          <li key={i} className="text-xs text-gray-300 flex items-start">
                            <span className="h-1.5 w-1.5 rounded-full bg-red-500 mr-2 mt-1.5 flex-shrink-0"></span>
                            {g}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
