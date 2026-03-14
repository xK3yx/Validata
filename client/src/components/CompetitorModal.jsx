import React, { useState, useEffect } from 'react';
import api from '../api/client';

export default function CompetitorModal({ name, industry, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/competitor?name=${encodeURIComponent(name)}&industry=${encodeURIComponent(industry || '')}`)
      .then(({ data: d }) => setData(d))
      .catch(err => setError(err.response?.data?.error || 'Failed to load competitor data.'))
      .finally(() => setLoading(false));
  }, [name]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-[#111118] border border-[#1e1e2e] rounded-2xl w-full max-w-lg shadow-2xl shadow-black/50 animate-[fadeUp_0.3s_ease_forwards]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#1e1e2e]">
          <div>
            <h2 className="font-heading font-bold text-white text-lg">{name}</h2>
            <p className="text-slate-500 text-xs">Competitor Deep Dive · Powered by Serper + AI</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-[#1e1e2e] text-slate-400 hover:text-white flex items-center justify-center transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {loading && (
            <div className="space-y-3 animate-pulse">
              <div className="skeleton h-4 w-3/4 rounded" />
              <div className="skeleton h-4 w-full rounded" />
              <div className="skeleton h-4 w-5/6 rounded" />
              <div className="grid grid-cols-2 gap-3 mt-4">
                {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
              </div>
              <div className="skeleton h-4 w-2/3 rounded mt-4" />
              <div className="skeleton h-4 w-full rounded" />
            </div>
          )}

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-rose-400 text-sm">{error}</div>
          )}

          {data && !loading && (
            <div className="space-y-5">
              {/* Overview */}
              <p className="text-slate-300 text-sm leading-relaxed">{data.overview}</p>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-3">
                <StatBox label="Founded" value={data.founded} icon="📅" />
                <StatBox label="Funding" value={data.funding} icon="💰" />
                <StatBox label="Pricing" value={data.pricing} icon="🏷️" />
                <StatBox label="Website" value={data.website} icon="🌐" />
              </div>

              {/* Positioning */}
              {data.positioning && (
                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3">
                  <p className="text-xs text-indigo-400 font-medium mb-1">Market Position</p>
                  <p className="text-slate-300 text-sm">{data.positioning}</p>
                </div>
              )}

              {/* Features */}
              {data.key_features?.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 font-medium mb-2 uppercase tracking-wider">Key Features</p>
                  <div className="flex flex-wrap gap-2">
                    {data.key_features.map((f, i) => (
                      <span key={i} className="text-xs bg-[#1a1a28] text-slate-300 border border-[#2a2a3e] px-2.5 py-1 rounded-lg">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Weaknesses */}
              {data.weaknesses?.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 font-medium mb-2 uppercase tracking-wider">Weaknesses / Gaps</p>
                  <div className="space-y-1.5">
                    {data.weaknesses.map((w, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-slate-400">
                        <span className="text-rose-400 mt-0.5">→</span>
                        <span>{w}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, icon }) {
  return (
    <div className="bg-[#0d0d15] border border-[#1a1a28] rounded-xl p-3">
      <p className="text-slate-500 text-xs mb-1">{icon} {label}</p>
      <p className="text-white text-sm font-medium truncate">{value || 'Unknown'}</p>
    </div>
  );
}
