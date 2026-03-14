import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../api/client';
import { getClientId } from '../utils/clientId';

const INDUSTRIES = [
  'Technology', 'Healthcare', 'Finance', 'Education',
  'E-commerce', 'Marketing', 'Productivity', 'Entertainment', 'Other'
];

export default function IdeaForm({ onUsageUpdate }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Support refinement mode — pre-fill from router state
  const refinement = location.state?.refinement;

  const [form, setForm] = useState({
    idea_title: refinement?.originalIdea?.idea_title || '',
    idea_description: refinement?.originalIdea?.idea_description || '',
    target_audience: refinement?.originalIdea?.target_audience || '',
    industry: refinement?.originalIdea?.industry || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.idea_title.trim()) return setError('Please enter an idea title.');
    if (form.idea_description.trim().length < 50) return setError('Description must be at least 50 characters.');

    setLoading(true);
    setError('');
    try {
      const payload = { ...form };
      if (refinement?.refinementContext) {
        payload.refinement_context = refinement.refinementContext;
      }

      const { data } = await api.post('/validate', payload, {
        headers: { 'X-Client-ID': getClientId() }
      });

      if (onUsageUpdate) onUsageUpdate(data.remaining);
      navigate(`/results/${data.id}`, {
        state: {
          report: data.report, idea: form, viability_score: data.viability_score,
          share_id: data.share_id,
          isRefinement: !!refinement,
          previousScore: refinement?.previousScore,
        }
      });
    } catch (err) {
      if (err.response?.status === 429) {
        setError(err.response.data.error || 'Daily limit reached.');
      } else {
        setError(err.response?.data?.error || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  const descLen = form.idea_description.length;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Refinement banner */}
      {refinement && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 text-sm">
          <p className="text-amber-400 font-medium mb-1">🔄 Refinement Mode</p>
          <p className="text-slate-400 text-xs">{refinement.refinementContext}</p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Idea Title <span className="text-rose-500">*</span>
        </label>
        <input
          type="text" name="idea_title" value={form.idea_title} onChange={handleChange}
          placeholder="e.g. AI-Powered Resume Builder for Gen Z"
          required
          className="w-full bg-[#111118] border border-[#1e1e2e] rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-colors text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Idea Description <span className="text-rose-500">*</span>
        </label>
        <textarea
          name="idea_description" value={form.idea_description} onChange={handleChange}
          rows={5}
          placeholder="What problem does it solve? How does it work? What makes it unique?"
          required
          className="w-full bg-[#111118] border border-[#1e1e2e] rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-colors text-sm resize-none"
        />
        <p className={`text-xs mt-1 ${descLen < 50 ? 'text-slate-600' : 'text-emerald-500'}`}>
          {descLen} characters {descLen < 50 ? `(need ${50 - descLen} more)` : '✓'}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Target Audience</label>
          <input
            type="text" name="target_audience" value={form.target_audience} onChange={handleChange}
            placeholder="e.g. Freelancers, SMBs, Students"
            className="w-full bg-[#111118] border border-[#1e1e2e] rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-colors text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Industry</label>
          <select
            name="industry" value={form.industry} onChange={handleChange}
            className="w-full bg-[#111118] border border-[#1e1e2e] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-colors text-sm appearance-none cursor-pointer"
          >
            <option value="">Select industry...</option>
            {INDUSTRIES.map(ind => <option key={ind} value={ind}>{ind}</option>)}
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl px-4 py-3 text-rose-400 text-sm flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
          {error.includes('limit') && (
            <Link to="/pricing" className="ml-auto text-indigo-400 hover:text-indigo-300 font-medium whitespace-nowrap">Upgrade →</Link>
          )}
        </div>
      )}

      <button
        type="submit" disabled={loading}
        className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-500/50 text-white font-semibold py-3.5 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 disabled:cursor-not-allowed text-sm"
      >
        {loading ? (
          <>
            <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
            {refinement ? 'Re-analyzing your idea...' : 'Analyzing your idea...'}
          </>
        ) : (
          <>
            {refinement ? 'Refine & Re-validate →' : 'Validate My Idea →'}
          </>
        )}
      </button>

      {loading && (
        <p className="text-center text-xs text-slate-500 animate-pulse">Running AI analysis — this may take 10–20 seconds...</p>
      )}
    </form>
  );
}
