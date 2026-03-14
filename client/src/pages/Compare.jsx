import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import ScoreBadge from '../components/ScoreBadge';
import IdeaRadarChart from '../components/IdeaRadarChart';
import { getClientId } from '../utils/clientId';

const INDUSTRIES = [
  'Technology', 'Healthcare', 'Finance', 'Education',
  'E-commerce', 'Marketing', 'Productivity', 'Entertainment', 'Other'
];

function IdeaInput({ label, color, form, onChange }) {
  return (
    <div className={`bg-[#111118] border rounded-2xl p-6 flex-1 ${color === 'indigo' ? 'border-indigo-500/30' : 'border-emerald-500/30'}`}>
      <div className="flex items-center gap-2 mb-5">
        <div className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold text-white ${color === 'indigo' ? 'bg-indigo-500' : 'bg-emerald-500'}`}>
          {label}
        </div>
        <span className="font-heading font-semibold text-white text-sm">Idea {label}</span>
      </div>
      <div className="space-y-4">
        <input
          type="text" name="idea_title" value={form.idea_title} onChange={onChange}
          placeholder="Idea title..."
          className="w-full bg-[#0d0d15] border border-[#1e1e2e] rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/60 text-sm transition-colors"
        />
        <textarea
          name="idea_description" value={form.idea_description} onChange={onChange}
          rows={4} placeholder="Describe the idea, problem it solves, how it works..."
          className="w-full bg-[#0d0d15] border border-[#1e1e2e] rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/60 text-sm resize-none transition-colors"
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            type="text" name="target_audience" value={form.target_audience} onChange={onChange}
            placeholder="Target audience"
            className="bg-[#0d0d15] border border-[#1e1e2e] rounded-xl px-3 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/60 text-sm transition-colors"
          />
          <select
            name="industry" value={form.industry} onChange={onChange}
            className="bg-[#0d0d15] border border-[#1e1e2e] rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-indigo-500/60 text-sm appearance-none cursor-pointer transition-colors"
          >
            <option value="">Industry...</option>
            {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}

const EMPTY = { idea_title: '', idea_description: '', target_audience: '', industry: '' };

const VERDICT_BG = {
  'Highly Promising': 'text-emerald-400', 'Promising': 'text-indigo-400',
  'Needs Refinement': 'text-amber-400', 'Risky': 'text-rose-400',
};

export default function Compare() {
  const [formA, setFormA] = useState(EMPTY);
  const [formB, setFormB] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const changeA = e => setFormA(p => ({ ...p, [e.target.name]: e.target.value }));
  const changeB = e => setFormB(p => ({ ...p, [e.target.name]: e.target.value }));

  async function handleCompare(e) {
    e.preventDefault();
    if (!formA.idea_title || !formA.idea_description || !formB.idea_title || !formB.idea_description) {
      setError('Both ideas need a title and description.');
      return;
    }
    setLoading(true); setError(''); setResult(null);
    try {
      const { data } = await api.post('/compare', { idea_a: formA, idea_b: formB }, {
        headers: { 'X-Client-ID': getClientId() }
      });
      setResult(data);
      setTimeout(() => document.getElementById('compare-results')?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to compare ideas. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 pb-20">
      {/* Header */}
      <div className="mb-8 animate-[fadeUp_0.5s_ease_forwards]">
        <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-3 py-1 mb-4">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
          <span className="text-xs text-indigo-400 font-medium">Comparison Mode</span>
        </div>
        <h1 className="font-heading font-bold text-white text-3xl sm:text-4xl mb-2">
          Head-to-Head Idea Battle
        </h1>
        <p className="text-slate-500">Submit two ideas simultaneously and get a side-by-side AI analysis with radar chart comparison.</p>
      </div>

      {/* Form */}
      <form onSubmit={handleCompare}>
        <div className="flex flex-col md:flex-row gap-5 mb-6">
          <IdeaInput label="A" color="indigo" form={formA} onChange={changeA} />
          {/* VS divider */}
          <div className="flex md:flex-col items-center justify-center gap-2 py-2">
            <div className="h-px md:h-8 md:w-px w-8 bg-[#1e1e2e]" />
            <span className="font-heading font-bold text-slate-600 text-sm bg-[#0a0a0f] px-2">VS</span>
            <div className="h-px md:h-8 md:w-px w-8 bg-[#1e1e2e]" />
          </div>
          <IdeaInput label="B" color="emerald" form={formB} onChange={changeB} />
        </div>

        {error && (
          <div className="mb-4 bg-rose-500/10 border border-rose-500/30 rounded-xl px-4 py-3 text-rose-400 text-sm">{error}</div>
        )}

        <button
          type="submit" disabled={loading}
          className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
              Running AI Analysis on Both Ideas — this may take 30s...
            </>
          ) : (
            <>Compare Ideas →</>
          )}
        </button>
      </form>

      {/* Results */}
      {result && (
        <div id="compare-results" className="mt-10 animate-[fadeUp_0.5s_ease_forwards]">
          {/* Winner banner */}
          <div className={`mb-6 p-6 rounded-2xl border text-center ${
            result.winner === 'Tie'
              ? 'bg-amber-500/10 border-amber-500/30'
              : result.winner === 'A'
              ? 'bg-indigo-500/10 border-indigo-500/30'
              : 'bg-emerald-500/10 border-emerald-500/30'
          }`}>
            <div className="text-3xl mb-2">{result.winner === 'Tie' ? '🤝' : result.winner === 'A' ? '🏆' : '🏆'}</div>
            <p className={`font-heading font-bold text-xl mb-2 ${
              result.winner === 'Tie' ? 'text-amber-400' : result.winner === 'A' ? 'text-indigo-400' : 'text-emerald-400'
            }`}>
              {result.winner === 'Tie' ? 'It\'s a Tie!' : `Idea ${result.winner} Wins`}
            </p>
            <p className="text-slate-400 text-sm max-w-lg mx-auto">{result.comparison_summary}</p>
          </div>

          {/* Side-by-side scores */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
            {[
              { side: 'A', data: result.idea_a, color: 'indigo', border: 'border-indigo-500/30' },
              { side: 'B', data: result.idea_b, color: 'emerald', border: 'border-emerald-500/30' },
            ].map(({ side, data, color, border }) => (
              <div key={side} className={`bg-[#111118] border ${border} rounded-2xl p-6`}>
                <div className="flex items-center gap-2 mb-4">
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold text-white ${color === 'indigo' ? 'bg-indigo-500' : 'bg-emerald-500'}`}>{side}</div>
                  <span className="font-heading font-semibold text-white">{data.idea_title}</span>
                  {result.winner === side && <span className="text-xs text-amber-400">🏆 Winner</span>}
                </div>
                <div className="flex items-center gap-4">
                  <ScoreBadge score={data.viability_score} size={80} />
                  <div>
                    <p className={`font-heading font-semibold text-sm ${VERDICT_BG[data.report?.verdict] || 'text-slate-400'}`}>
                      {data.report?.verdict}
                    </p>
                    <p className="text-slate-500 text-xs mt-1 line-clamp-2">{data.report?.summary?.slice(0, 120)}...</p>
                    <Link to={`/results/${data.id}`} className="text-xs text-indigo-400 hover:text-indigo-300 mt-2 inline-flex items-center gap-1">
                      View Full Report →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Radar Chart */}
          <div className="bg-[#111118] border border-[#1e1e2e] rounded-2xl p-6 mb-6">
            <h3 className="font-heading font-semibold text-white text-base mb-4">Dimension Comparison</h3>
            <IdeaRadarChart
              reportA={result.idea_a.report}
              reportB={result.idea_b.report}
              labelA={result.idea_a.idea_title.slice(0, 20)}
              labelB={result.idea_b.idea_title.slice(0, 20)}
            />
          </div>

          {/* Key differences */}
          <div className="bg-[#111118] border border-[#1e1e2e] rounded-2xl p-6">
            <h3 className="font-heading font-semibold text-white text-base mb-4">At a Glance</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Market Score', a: result.idea_a.report?.market_opportunity?.score, b: result.idea_b.report?.market_opportunity?.score, suffix: '/10' },
                { label: 'Competition Score', a: result.idea_a.report?.competition?.score, b: result.idea_b.report?.competition?.score, suffix: '/10' },
                { label: 'Viability', a: result.idea_a.viability_score, b: result.idea_b.viability_score, suffix: '/100' },
                { label: 'Risks', a: result.idea_a.report?.risks?.length, b: result.idea_b.report?.risks?.length, suffix: ' risks', lowerBetter: true },
              ].map((col, i) => (
                <div key={i} className="bg-[#0d0d15] border border-[#1a1a28] rounded-xl p-3 text-center">
                  <p className="text-xs text-slate-500 mb-2">{col.label}</p>
                  <div className="flex items-center justify-center gap-2">
                    <span className={`text-sm font-bold ${col.lowerBetter ? (col.a <= col.b ? 'text-emerald-400' : 'text-rose-400') : (col.a >= col.b ? 'text-indigo-400' : 'text-slate-400')}`}>A: {col.a}{col.suffix}</span>
                    <span className="text-slate-600 text-xs">|</span>
                    <span className={`text-sm font-bold ${col.lowerBetter ? (col.b <= col.a ? 'text-emerald-400' : 'text-rose-400') : (col.b >= col.a ? 'text-emerald-400' : 'text-slate-400')}`}>B: {col.b}{col.suffix}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
