import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ScoreBadge from './ScoreBadge';

const VERDICT_STYLES = {
  'Highly Promising': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'Promising': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  'Needs Refinement': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'Risky': 'bg-rose-500/10 text-rose-400 border-rose-500/20',
};

export default function HistoryItem({ item, onDelete }) {
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);

  const verdictStyle = VERDICT_STYLES[item.verdict] || VERDICT_STYLES['Needs Refinement'];

  function handleCardClick() {
    navigate(`/results/${item.id}`);
  }

  function handleDeleteClick(e) {
    e.stopPropagation();
    if (confirming) {
      onDelete(item.id);
    } else {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 3000);
    }
  }

  // SQLite CURRENT_TIMESTAMP is UTC; append 'Z' so JS parses it as UTC, not local time
  const date = new Date(item.created_at.replace(' ', 'T') + 'Z').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });

  return (
    <div
      onClick={handleCardClick}
      className="group relative bg-[#111118] border border-[#1e1e2e] rounded-2xl p-5 cursor-pointer hover:border-indigo-500/40 hover:bg-[#13131f] transition-all duration-200"
    >
      {/* Delete button */}
      <button
        onClick={handleDeleteClick}
        className={`absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center transition-all z-10 ${
          confirming
            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
            : 'opacity-0 group-hover:opacity-100 bg-[#1e1e2e] text-slate-400 hover:bg-rose-500/20 hover:text-rose-400'
        }`}
        title={confirming ? 'Click again to confirm' : 'Delete'}
      >
        {confirming ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
          </svg>
        )}
      </button>

      <div className="flex items-start gap-4">
        <ScoreBadge score={item.viability_score} size={64} />
        <div className="flex-1 min-w-0 pt-1">
          <h3 className="font-heading font-semibold text-white text-base truncate pr-8">{item.idea_title}</h3>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {item.industry && (
              <span className="text-xs px-2 py-0.5 rounded-md bg-[#1e1e2e] text-slate-400 border border-[#2a2a3e]">
                {item.industry}
              </span>
            )}
            {item.verdict && (
              <span className={`text-xs px-2 py-0.5 rounded-md border ${verdictStyle}`}>
                {item.verdict}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-2">{date}</p>
        </div>
      </div>
    </div>
  );
}
