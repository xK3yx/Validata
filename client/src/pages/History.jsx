import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import HistoryItem from '../components/HistoryItem';
import ScoreTrendChart from '../components/ScoreTrendChart';

export default function History() {
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/history')
      .then(({ data }) => setAnalyses(data))
      .catch(err => setError(err.response?.data?.error || 'Failed to load history.'))
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id) {
    try {
      await api.delete(`/history/${id}`);
      setAnalyses(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete.');
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 pb-20">
      {/* Header */}
      <div className="mb-8 animate-[fadeUp_0.5s_ease_forwards]">
        <h1 className="font-heading font-bold text-white text-3xl sm:text-4xl mb-2">Past Analyses</h1>
        <p className="text-slate-500 text-sm">
          {loading
            ? 'Loading...'
            : analyses.length > 0
            ? `${analyses.length} idea${analyses.length !== 1 ? 's' : ''} validated`
            : 'Your validated ideas will appear here'}
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 bg-rose-500/10 border border-rose-500/30 rounded-xl px-4 py-3 text-rose-400 text-sm flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
        </div>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div className="space-y-4">
          <div className="bg-[#111118] border border-[#1e1e2e] rounded-2xl p-6 h-48 skeleton" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-[#111118] border border-[#1e1e2e] rounded-2xl p-5">
                <div className="flex gap-4 items-start">
                  <div className="skeleton w-16 h-16 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="skeleton h-4 w-3/4 rounded" />
                    <div className="skeleton h-3 w-1/2 rounded" />
                    <div className="skeleton h-3 w-1/3 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && analyses.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-24 text-center animate-[fadeUp_0.5s_ease_forwards]">
          <div className="w-20 h-20 rounded-2xl bg-[#111118] border border-[#1e1e2e] flex items-center justify-center mb-6">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2d2d44" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          </div>
          <h2 className="font-heading font-semibold text-white text-xl mb-2">No analyses yet</h2>
          <p className="text-slate-500 text-sm mb-6 max-w-xs">Validate your first idea to see it here. All analyses saved locally.</p>
          <Link to="/" className="inline-flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2.5 px-5 rounded-xl transition-all text-sm shadow-lg shadow-indigo-500/25">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M13 2L4.5 13.5H11L10 22L20.5 9.5H14L13 2Z"/></svg>
            Validate Your First Idea
          </Link>
        </div>
      )}

      {!loading && analyses.length > 0 && (
        <>
          {/* Score Trend Chart */}
          {analyses.length >= 2 && (
            <div className="bg-[#111118] border border-[#1e1e2e] rounded-2xl p-6 mb-6 animate-[fadeUp_0.5s_ease_forwards]">
              <ScoreTrendChart analyses={analyses} />
            </div>
          )}

          {/* Quick stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 animate-[fadeUp_0.5s_0.1s_ease_forwards] opacity-0" style={{ animationFillMode: 'forwards' }}>
            {[
              { label: 'Total Ideas', value: analyses.length },
              { label: 'Avg Score', value: `${Math.round(analyses.reduce((s, a) => s + a.viability_score, 0) / analyses.length)}/100` },
              { label: 'Best Score', value: `${Math.max(...analyses.map(a => a.viability_score))}/100` },
              { label: 'Promising+', value: analyses.filter(a => ['Highly Promising', 'Promising'].includes(a.verdict)).length },
            ].map(stat => (
              <div key={stat.label} className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-4 text-center">
                <div className="font-heading font-bold text-white text-xl">{stat.value}</div>
                <div className="text-slate-500 text-xs mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {analyses.map((item, i) => (
              <div
                key={item.id}
                className="animate-[fadeUp_0.5s_ease_forwards] opacity-0"
                style={{ animationDelay: `${i * 60}ms`, animationFillMode: 'forwards' }}
              >
                <HistoryItem item={item} onDelete={handleDelete} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
