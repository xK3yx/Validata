import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useLocation, Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import ScoreBadge from '../components/ScoreBadge';
import ReportCard from '../components/ReportCard';
import IdeaRadarChart from '../components/IdeaRadarChart';
import CompetitorModal from '../components/CompetitorModal';
import ChatWidget from '../components/ChatWidget';
import { PDFDownloadButton } from '../components/PDFReport';

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

function ScoreBar({ score }) {
  const [animated, setAnimated] = useState(false);
  const ref = React.useRef(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setAnimated(true); }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  const color = score >= 7 ? '#10b981' : score >= 5 ? '#f59e0b' : '#f43f5e';
  return (
    <div ref={ref} className="flex items-center gap-3">
      <div className="flex-1 h-1.5 bg-[#1e1e2e] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-1000"
          style={{ width: animated ? `${(score / 10) * 100}%` : '0%', background: color, boxShadow: `0 0 8px ${color}60` }} />
      </div>
      <span className="text-sm font-medium text-slate-300 w-8 text-right">{score}/10</span>
    </div>
  );
}

function SectionIcon({ color, children, small }) {
  const colors = {
    indigo: { bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', stroke: '#6366f1' },
    emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', stroke: '#10b981' },
    amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', stroke: '#f59e0b' },
    rose: { bg: 'bg-rose-500/10', border: 'border-rose-500/20', stroke: '#f43f5e' },
  };
  const c = colors[color] || colors.indigo;
  const size = small ? 'w-6 h-6' : 'w-8 h-8';
  const iconSize = small ? 11 : 14;
  return (
    <span className={`${size} rounded-lg ${c.bg} border ${c.border} flex items-center justify-center flex-shrink-0`}>
      <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke={c.stroke} strokeWidth="2">{children}</svg>
    </span>
  );
}

export default function Results() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCompetitor, setSelectedCompetitor] = useState(null);
  const [copied, setCopied] = useState(false);
  const [shareId, setShareId] = useState(location.state?.share_id || null);

  useEffect(() => {
    if (location.state?.report) {
      setData({
        report: location.state.report,
        idea: location.state.idea,
        viability_score: location.state.viability_score,
        isRefinement: location.state.isRefinement,
        previousScore: location.state.previousScore,
      });
      if (location.state.share_id) setShareId(location.state.share_id);
      setLoading(false);
      return;
    }
    api.get(`/history/${id}`)
      .then(({ data: res }) => {
        setData({ report: res.report, idea: { idea_title: res.idea_title, idea_description: res.idea_description, industry: res.industry, target_audience: res.target_audience }, viability_score: res.viability_score });
        if (res.share_id) setShareId(res.share_id);
      })
      .catch(err => setError(err.response?.data?.error || 'Failed to load analysis.'))
      .finally(() => setLoading(false));
  }, [id]);

  const copyShareLink = useCallback(() => {
    if (!shareId) return;
    const url = `${window.location.origin}/share/${shareId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }, [shareId]);

  function handleRefine() {
    if (!data) return;
    const topRisks = data.report.risks?.slice(0, 2).map(r => r.title).join(' and ') || 'the main risks';
    navigate('/', {
      state: {
        refinement: {
          originalIdea: data.idea,
          previousScore: data.viability_score,
          refinementContext: `Refinement pass. Address these top risks: ${topRisks}. Improve monetization strategy and lower market barriers.`,
        }
      }
    });
  }

  if (loading) return <LoadingSkeleton />;
  if (error) return (
    <div className="max-w-3xl mx-auto px-4 py-24 text-center">
      <div className="text-rose-400 text-lg mb-4">{error}</div>
      <Link to="/" className="text-indigo-400 hover:text-indigo-300 text-sm">← Go home</Link>
    </div>
  );

  const { report, idea, viability_score, isRefinement, previousScore } = data;
  const verdict = report.verdict || 'Needs Refinement';
  const vc = VERDICT_CONFIG[verdict] || VERDICT_CONFIG['Needs Refinement'];
  const scoreDiff = isRefinement && previousScore != null ? viability_score - previousScore : null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 pb-32">

      {/* Refinement improvement banner */}
      {isRefinement && scoreDiff !== null && (
        <div className={`mb-6 p-4 rounded-2xl border flex items-center gap-3 animate-[fadeUp_0.4s_ease_forwards] ${
          scoreDiff > 0 ? 'bg-emerald-500/10 border-emerald-500/30' : scoreDiff < 0 ? 'bg-rose-500/10 border-rose-500/30' : 'bg-amber-500/10 border-amber-500/30'
        }`}>
          <span className="text-2xl">{scoreDiff > 0 ? '📈' : scoreDiff < 0 ? '📉' : '➡️'}</span>
          <div>
            <p className={`font-heading font-semibold text-sm ${scoreDiff > 0 ? 'text-emerald-400' : scoreDiff < 0 ? 'text-rose-400' : 'text-amber-400'}`}>
              {scoreDiff > 0 ? `+${scoreDiff} points improvement!` : scoreDiff < 0 ? `${scoreDiff} points` : 'Same score as previous'}
            </p>
            <p className="text-slate-400 text-xs">Refined: {previousScore}/100 → {viability_score}/100</p>
          </div>
        </div>
      )}

      {/* Header card */}
      <ReportCard className="p-6 sm:p-8 mb-6" delay={0}>
        <div className="flex flex-col sm:flex-row sm:items-start gap-6">
          <ScoreBadge score={viability_score} size={110} />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {idea.industry && (
                <span className="text-xs px-2.5 py-1 rounded-lg bg-[#1e1e2e] text-slate-400 border border-[#2a2a3e]">{idea.industry}</span>
              )}
            </div>
            <h1 className="font-heading font-bold text-white text-2xl sm:text-3xl mb-3 leading-tight">{idea.idea_title}</h1>
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl ${vc.bg} border ${vc.border} mb-4`}>
              <span className={`w-2 h-2 rounded-full ${vc.dot} animate-pulse`} />
              <span className={`font-heading font-semibold text-sm ${vc.text}`}>{verdict}</span>
            </div>
            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              <PDFDownloadButton report={report} idea={idea} />
              {shareId && (
                <button onClick={copyShareLink}
                  className="flex items-center gap-2 bg-[#1a1a28] hover:bg-[#222235] border border-[#2a2a3e] hover:border-indigo-500/40 text-slate-300 hover:text-white font-medium py-2.5 px-4 rounded-xl transition-all text-sm">
                  {copied
                    ? <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg><span className="text-emerald-400">Copied!</span></>
                    : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>Share Report</>
                  }
                </button>
              )}
              <button onClick={handleRefine}
                className="flex items-center gap-2 bg-[#1a1a28] hover:bg-[#222235] border border-[#2a2a3e] hover:border-amber-500/40 text-slate-300 hover:text-amber-300 font-medium py-2.5 px-4 rounded-xl transition-all text-sm">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
                Refine This Idea
              </button>
            </div>
          </div>
        </div>
      </ReportCard>

      {/* Summary */}
      <ReportCard className="p-6 sm:p-8 mb-6" delay={80}>
        <h2 className="font-heading font-semibold text-white text-lg mb-3 flex items-center gap-2">
          <SectionIcon color="indigo"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></SectionIcon>
          Executive Summary
        </h2>
        <p className="text-slate-300 leading-relaxed text-sm sm:text-base">{report.summary}</p>
      </ReportCard>

      {/* Radar + Market/Competition */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <ReportCard className="p-6" delay={130}>
          <h2 className="font-heading font-semibold text-white text-base mb-4">Dimension Radar</h2>
          <IdeaRadarChart reportA={report} labelA={idea.idea_title?.slice(0, 18) || 'Idea'} single={true} />
        </ReportCard>
        <div className="flex flex-col gap-5">
          <ReportCard className="p-5" delay={160}>
            <h2 className="font-heading font-semibold text-white text-sm mb-2 flex items-center gap-2">
              <SectionIcon color="emerald" small><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/></SectionIcon>
              Market Opportunity
            </h2>
            <ScoreBar score={report.market_opportunity?.score || 0} />
            {report.market_opportunity?.market_size && (
              <div className="mt-2 inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-1.5">
                <span className="text-xs text-slate-400">TAM:</span>
                <span className="text-sm font-semibold text-emerald-400">{report.market_opportunity.market_size}</span>
              </div>
            )}
            <p className="text-slate-400 text-xs mt-2 leading-relaxed line-clamp-3">{report.market_opportunity?.analysis}</p>
          </ReportCard>
          <ReportCard className="p-5" delay={190}>
            <h2 className="font-heading font-semibold text-white text-sm mb-2 flex items-center gap-2">
              <SectionIcon color="amber" small><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></SectionIcon>
              Competition
            </h2>
            <ScoreBar score={report.competition?.score || 0} />
            <p className="text-slate-400 text-xs mt-2 leading-relaxed line-clamp-2">{report.competition?.analysis}</p>
            {report.competition?.competitors?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {report.competition.competitors.map((c, i) => (
                  <button key={i} onClick={() => setSelectedCompetitor(c)}
                    className="text-xs bg-[#1a1a28] text-slate-400 border border-[#2a2a3e] hover:border-indigo-500/40 hover:text-indigo-400 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1">
                    {c}
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                  </button>
                ))}
              </div>
            )}
            <p className="text-slate-600 text-xs mt-1.5">↑ Click any competitor for live intel</p>
          </ReportCard>
        </div>
      </div>

      {/* Monetization */}
      <ReportCard className="p-6 sm:p-8 mb-6" delay={220}>
        <h2 className="font-heading font-semibold text-white text-lg mb-4 flex items-center gap-2">
          <SectionIcon color="indigo"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></SectionIcon>
          Monetization Strategies
        </h2>
        <div className="flex gap-4 overflow-x-auto pb-2 scroll-hide">
          {report.monetization?.strategies?.map((s, i) => (
            <div key={i} className="flex-shrink-0 w-64 bg-[#0d0d15] border border-[#2a2a3e] rounded-xl p-4 hover:border-indigo-500/40 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-md bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold">{i + 1}</span>
                <span className="font-heading font-semibold text-white text-sm">{s.name}</span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">{s.description}</p>
            </div>
          ))}
        </div>
      </ReportCard>

      {/* Risks */}
      <ReportCard className="p-6 sm:p-8 mb-6" delay={270}>
        <h2 className="font-heading font-semibold text-white text-lg mb-4 flex items-center gap-2">
          <SectionIcon color="rose"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/></SectionIcon>
          Risk Assessment
        </h2>
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

      {/* MVP Features */}
      <ReportCard className="p-6 sm:p-8 mb-6" delay={320}>
        <h2 className="font-heading font-semibold text-white text-lg mb-4 flex items-center gap-2">
          <SectionIcon color="emerald"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></SectionIcon>
          MVP Feature Roadmap
        </h2>
        <div className="space-y-2">
          {report.mvp_features?.map((f, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-[#0d0d15] border border-[#1a1a28]">
              <div className="w-5 h-5 rounded-full border-2 border-indigo-500/50 flex items-center justify-center flex-shrink-0">
                <div className="w-2 h-2 rounded-full bg-indigo-500" />
              </div>
              <span className="text-sm text-slate-200 flex-1">{f.feature}</span>
              <span className={`text-xs px-2.5 py-1 rounded-lg font-medium flex-shrink-0 ${PRIORITY_STYLES[f.priority] || PRIORITY_STYLES['Nice to Have']}`}>{f.priority}</span>
            </div>
          ))}
        </div>
      </ReportCard>

      {/* Pivot Suggestions */}
      {report.pivot_suggestions?.length > 0 && (
        <ReportCard className="p-6 sm:p-8 mb-6" delay={370}>
          <h2 className="font-heading font-semibold text-white text-lg mb-1 flex items-center gap-2">
            <SectionIcon color="emerald"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></SectionIcon>
            Strategic Pivot Suggestions
          </h2>
          <p className="text-slate-500 text-xs mb-4 ml-10">Alternative directions that could score higher</p>
          <div className="space-y-3">
            {report.pivot_suggestions.map((p, i) => (
              <div key={i} className="bg-[#0d0d15] border border-emerald-500/10 hover:border-emerald-500/30 rounded-xl p-4 transition-colors">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="font-heading font-semibold text-emerald-400 text-sm">{p.title}</h3>
                  {p.key_change && (
                    <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-lg flex-shrink-0">{p.key_change}</span>
                  )}
                </div>
                <p className="text-slate-400 text-sm leading-relaxed">{p.description}</p>
                {p.potential_upside && (
                  <p className="text-emerald-400/70 text-xs mt-2 flex items-center gap-1">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
                    {p.potential_upside}
                  </p>
                )}
              </div>
            ))}
          </div>
        </ReportCard>
      )}

      {/* CTA Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-2">
        <Link to="/" className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-lg shadow-indigo-500/25 text-sm">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M13 2L4.5 13.5H11L10 22L20.5 9.5H14L13 2Z"/></svg>
          Validate Another Idea
        </Link>
        <Link to="/history" className="text-slate-400 hover:text-white transition-colors text-sm flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          View History
        </Link>
        <Link to="/compare" className="text-slate-400 hover:text-white transition-colors text-sm flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
          Compare Ideas
        </Link>
      </div>

      {/* Competitor deep dive modal */}
      {selectedCompetitor && (
        <CompetitorModal name={selectedCompetitor} industry={idea.industry} onClose={() => setSelectedCompetitor(null)} />
      )}

      {/* AI Chat Widget */}
      <ChatWidget report={report} idea_title={idea.idea_title} />
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-6 animate-pulse">
      <div className="bg-[#111118] border border-[#1e1e2e] rounded-2xl p-8">
        <div className="flex gap-6 items-center">
          <div className="skeleton w-28 h-28 rounded-full" />
          <div className="flex-1 space-y-3">
            <div className="skeleton h-4 w-20 rounded" />
            <div className="skeleton h-8 w-3/4 rounded" />
            <div className="skeleton h-8 w-32 rounded-xl" />
          </div>
        </div>
      </div>
      {[...Array(5)].map((_, i) => (
        <div key={i} className="bg-[#111118] border border-[#1e1e2e] rounded-2xl p-8 space-y-3">
          <div className="skeleton h-5 w-40 rounded" />
          <div className="skeleton h-4 w-full rounded" />
          <div className="skeleton h-4 w-5/6 rounded" />
        </div>
      ))}
    </div>
  );
}
