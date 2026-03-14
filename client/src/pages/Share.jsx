import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client';
import ScoreBadge from '../components/ScoreBadge';
import ReportCard from '../components/ReportCard';

const VERDICT_CONFIG = {
  'Highly Promising': { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', dot: 'bg-emerald-500' },
  'Promising': { bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', text: 'text-indigo-400', dot: 'bg-indigo-500' },
  'Needs Refinement': { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', dot: 'bg-amber-500' },
  'Risky': { bg: 'bg-rose-500/10', border: 'border-rose-500/30', text: 'text-rose-400', dot: 'bg-rose-500' },
};
const SEVERITY_STYLES = {
  'High': 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
  'Medium': 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  'Low': 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
};
const PRIORITY_STYLES = {
  'Must Have': 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
  'Should Have': 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  'Nice to Have': 'bg-slate-700/50 text-slate-400 border border-slate-700',
};

export default function Share() {
  const { shareId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/share/${shareId}`)
      .then(({ data: res }) => setData({ report: res.report, idea: { idea_title: res.idea_title, industry: res.industry, target_audience: res.target_audience }, viability_score: res.viability_score }))
      .catch(err => setError(err.response?.data?.error || 'Report not found.'))
      .finally(() => setLoading(false));
  }, [shareId]);

  if (loading) return (
    <div className="max-w-5xl mx-auto px-4 py-24 text-center">
      <div className="flex items-center justify-center gap-2 text-slate-500">
        <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
        Loading shared report...
      </div>
    </div>
  );

  if (error) return (
    <div className="max-w-3xl mx-auto px-4 py-24 text-center">
      <div className="text-6xl mb-4">🔍</div>
      <h1 className="font-heading font-bold text-white text-2xl mb-2">Report Not Found</h1>
      <p className="text-slate-500 text-sm mb-6">{error}</p>
      <Link to="/" className="inline-flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2.5 px-5 rounded-xl transition-all text-sm">
        Validate Your Own Idea
      </Link>
    </div>
  );

  const { report, idea, viability_score } = data;
  const verdict = report.verdict || 'Needs Refinement';
  const vc = VERDICT_CONFIG[verdict] || VERDICT_CONFIG['Needs Refinement'];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 pb-20">
      {/* Shared banner */}
      <div className="mb-6 flex items-center gap-3 bg-[#111118] border border-[#1e1e2e] rounded-2xl px-5 py-4 animate-[fadeUp_0.4s_ease_forwards]">
        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
        </div>
        <div className="flex-1">
          <p className="text-white text-sm font-medium">Shared Validation Report</p>
          <p className="text-slate-500 text-xs">This report was shared publicly · <span className="text-indigo-400">View only</span></p>
        </div>
        <Link to="/" className="text-xs bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1.5 rounded-lg transition-colors font-medium">
          Validate Your Idea →
        </Link>
      </div>

      {/* Header */}
      <ReportCard className="p-6 sm:p-8 mb-6" delay={0}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          <ScoreBadge score={viability_score} size={110} />
          <div className="flex-1">
            {idea.industry && (
              <span className="text-xs px-2.5 py-1 rounded-lg bg-[#1e1e2e] text-slate-400 border border-[#2a2a3e] inline-block mb-2">{idea.industry}</span>
            )}
            <h1 className="font-heading font-bold text-white text-2xl sm:text-3xl mb-3 leading-tight">{idea.idea_title}</h1>
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl ${vc.bg} border ${vc.border}`}>
              <span className={`w-2 h-2 rounded-full ${vc.dot} animate-pulse`} />
              <span className={`font-heading font-semibold text-sm ${vc.text}`}>{verdict}</span>
            </div>
          </div>
        </div>
      </ReportCard>

      {/* Summary */}
      <ReportCard className="p-6 sm:p-8 mb-6" delay={100}>
        <h2 className="font-heading font-semibold text-white text-lg mb-3">Executive Summary</h2>
        <p className="text-slate-300 leading-relaxed text-sm sm:text-base">{report.summary}</p>
      </ReportCard>

      {/* Market + Competition */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <ReportCard className="p-6" delay={150}>
          <h2 className="font-heading font-semibold text-white text-base mb-3">Market Opportunity</h2>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 h-1.5 bg-[#1e1e2e] rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${(report.market_opportunity?.score / 10) * 100}%` }} />
            </div>
            <span className="text-sm font-medium text-slate-300">{report.market_opportunity?.score}/10</span>
          </div>
          {report.market_opportunity?.market_size && (
            <div className="mb-3 inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-1.5">
              <span className="text-xs text-slate-400">TAM:</span>
              <span className="text-sm font-semibold text-emerald-400">{report.market_opportunity.market_size}</span>
            </div>
          )}
          <p className="text-slate-400 text-sm leading-relaxed">{report.market_opportunity?.analysis}</p>
        </ReportCard>
        <ReportCard className="p-6" delay={200}>
          <h2 className="font-heading font-semibold text-white text-base mb-3">Competition</h2>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 h-1.5 bg-[#1e1e2e] rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-amber-500" style={{ width: `${(report.competition?.score / 10) * 100}%` }} />
            </div>
            <span className="text-sm font-medium text-slate-300">{report.competition?.score}/10</span>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed">{report.competition?.analysis}</p>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {report.competition?.competitors?.map((c, i) => (
              <span key={i} className="text-xs bg-[#1a1a28] text-slate-400 border border-[#2a2a3e] px-2.5 py-1 rounded-lg">{c}</span>
            ))}
          </div>
        </ReportCard>
      </div>

      {/* Risks */}
      <ReportCard className="p-6 sm:p-8 mb-6" delay={250}>
        <h2 className="font-heading font-semibold text-white text-lg mb-4">Risk Assessment</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1e1e2e]">
                <th className="text-left text-xs text-slate-500 font-medium pb-3 pr-4">Risk</th>
                <th className="text-left text-xs text-slate-500 font-medium pb-3 pr-4 w-28">Severity</th>
                <th className="text-left text-xs text-slate-500 font-medium pb-3">Description</th>
              </tr>
            </thead>
            <tbody>
              {report.risks?.map((risk, i) => (
                <tr key={i} className="border-b border-[#1e1e2e]/50 last:border-0">
                  <td className="py-3 pr-4"><span className="font-medium text-white text-sm whitespace-nowrap">{risk.title}</span></td>
                  <td className="py-3 pr-4">
                    <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${SEVERITY_STYLES[risk.severity] || SEVERITY_STYLES['Medium']}`}>{risk.severity}</span>
                  </td>
                  <td className="py-3"><span className="text-slate-400 text-sm">{risk.description}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ReportCard>

      {/* CTA */}
      <div className="text-center py-8 bg-[#111118] border border-[#1e1e2e] rounded-2xl">
        <p className="font-heading font-bold text-white text-xl mb-2">Validate Your Own Idea</p>
        <p className="text-slate-500 text-sm mb-5">Get an AI-powered report in seconds — free, no signup required.</p>
        <Link to="/" className="inline-flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-lg shadow-indigo-500/25 text-sm">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M13 2L4.5 13.5H11L10 22L20.5 9.5H14L13 2Z"/></svg>
          Start Validating →
        </Link>
      </div>
    </div>
  );
}
