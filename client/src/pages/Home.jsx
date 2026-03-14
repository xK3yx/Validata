import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import IdeaForm from '../components/IdeaForm';
import api from '../api/client';
import { getClientId } from '../utils/clientId';

export default function Home() {
  const location = useLocation();
  const isRefinement = !!location.state?.refinement;
  const [usage, setUsage] = useState(null);

  useEffect(() => {
    api.get('/validate/usage', { headers: { 'X-Client-ID': getClientId() } })
      .then(({ data }) => setUsage(data))
      .catch(() => {});
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="orb absolute rounded-full blur-3xl" style={{ width: '600px', height: '600px', top: '-200px', left: '50%', transform: 'translateX(-30%)', background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)' }} />
        <div className="orb absolute rounded-full blur-3xl" style={{ width: '400px', height: '400px', bottom: '0', right: '0', background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)', animationDelay: '3s' }} />
        <div className="orb absolute rounded-full blur-3xl" style={{ width: '300px', height: '300px', top: '40%', left: '-100px', background: 'radial-gradient(circle, rgba(167,139,250,0.08) 0%, transparent 70%)', animationDelay: '1.5s' }} />
      </div>

      <div className="relative max-w-2xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        {/* Hero */}
        <div className="text-center mb-12 animate-[fadeUp_0.6s_ease_forwards]">
          {isRefinement ? (
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-1.5 mb-6">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2"><path d="M23 4v6h-6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
              <span className="text-xs text-amber-400 font-medium">Refinement Mode — Pre-filled from your last report</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 mb-6">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              <span className="text-xs text-indigo-400 font-medium">Powered by Llama 3.3 70B</span>
            </div>
          )}

          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-4">
            {isRefinement ? (
              <>Refine Your Idea <span className="gradient-text">Score Higher</span></>
            ) : (
              <>Validate Your Idea <span className="gradient-text">Before You Build It</span></>
            )}
          </h1>

          <p className="text-slate-400 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
            {isRefinement
              ? 'Your form is pre-filled. Tweak your description to address the risks, then re-validate.'
              : 'Get a comprehensive AI-powered analysis of your startup idea in seconds — market opportunity, competition, risks, and more.'}
          </p>

          {/* Usage indicator */}
          {usage && (
            <div className={`inline-flex items-center gap-2 mt-6 text-sm px-4 py-2 rounded-full border ${
              usage.remaining === 0 ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' :
              usage.remaining <= 2 ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
              'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            }`}>
              <span className={`w-2 h-2 rounded-full ${usage.remaining === 0 ? 'bg-rose-500' : usage.remaining <= 2 ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
              {usage.remaining === 0 ? (
                <>Daily limit reached · <Link to="/pricing" className="underline ml-1">Upgrade to Pro</Link></>
              ) : (
                <>{usage.remaining} free validation{usage.remaining !== 1 ? 's' : ''} remaining today</>
              )}
            </div>
          )}

          {/* Stats row */}
          {!isRefinement && (
            <div className="flex items-center justify-center gap-6 mt-8 flex-wrap">
              {[
                { label: 'Analysis Depth', value: '9 Dimensions' },
                { label: 'Response Time', value: '~15 sec' },
                { label: 'AI Model', value: 'Llama 3.3 70B' },
              ].map(stat => (
                <div key={stat.label} className="text-center">
                  <div className="font-heading font-semibold text-white text-sm">{stat.value}</div>
                  <div className="text-slate-600 text-xs">{stat.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Form card */}
        <div
          className="bg-[#111118] border border-[#1e1e2e] rounded-2xl p-6 sm:p-8 shadow-2xl animate-[fadeUp_0.6s_0.15s_ease_forwards] opacity-0"
          style={{ animationFillMode: 'forwards' }}
        >
          <div className="mb-6">
            <h2 className="font-heading font-semibold text-white text-lg">
              {isRefinement ? 'Refine Your Idea' : 'Submit Your Idea'}
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              {isRefinement ? 'Adjust your description to address the identified risks.' : 'The more detail you provide, the better the analysis.'}
            </p>
          </div>
          <IdeaForm />
        </div>

        {/* Feature pills */}
        {!isRefinement && (
          <div className="flex flex-wrap justify-center gap-2 mt-8 animate-[fadeUp_0.6s_0.3s_ease_forwards] opacity-0" style={{ animationFillMode: 'forwards' }}>
            {[
              'Market Analysis', 'Competition Mapping', 'Risk Assessment',
              'MVP Planning', 'Monetization Strategies', 'Pivot Suggestions',
              'PDF Export', 'Compare Mode', 'AI Chat', 'Share Links',
            ].map(f => (
              <span key={f} className="text-xs text-slate-500 border border-[#1e1e2e] rounded-full px-3 py-1">{f}</span>
            ))}
          </div>
        )}

        {/* Compare CTA */}
        {!isRefinement && (
          <div className="mt-8 text-center animate-[fadeUp_0.6s_0.4s_ease_forwards] opacity-0" style={{ animationFillMode: 'forwards' }}>
            <p className="text-slate-600 text-sm mb-2">Torn between two ideas?</p>
            <Link to="/compare" className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 text-sm transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
              Try Comparison Mode →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
