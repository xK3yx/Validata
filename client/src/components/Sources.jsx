import React from 'react';
import ReportCard from './ReportCard';

function hostname(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; }
}

// Market size pill. Links the figure to the search result it came from, or
// labels it as an AI estimate when no source backs it.
export function MarketSizeBadge({ report, className = '' }) {
  const market = report.market_opportunity;
  if (!market?.market_size) return null;
  const source = report.sources?.find(s => s.id === market.market_size_source);
  const figure = market.market_size.replace(/^Estimate:\s*/i, '');
  const hasSources = Array.isArray(report.sources);

  return (
    <div className={`inline-flex flex-wrap items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-1.5 ${className}`}>
      <span className="text-xs text-slate-400">TAM:</span>
      <span className="text-sm font-semibold text-emerald-400">{figure}</span>
      {source ? (
        <a href={source.url} target="_blank" rel="noopener noreferrer"
          className="text-xs text-emerald-300/80 hover:text-emerald-200 underline underline-offset-2">
          source [{source.id}]
        </a>
      ) : hasSources && (
        <span className="text-xs text-slate-500">AI estimate</span>
      )}
    </div>
  );
}

// Lists the web results the analysis was grounded in. Reports created before
// grounding existed have no `sources` field and render nothing.
export function SourcesCard({ sources, delay = 0 }) {
  if (!sources?.length) return null;
  return (
    <ReportCard className="p-6 sm:p-8 mb-6" delay={delay}>
      <h2 className="font-heading font-semibold text-white text-lg mb-1">Research Sources</h2>
      <p className="text-slate-500 text-xs mb-4">
        Live web results this report was grounded in. Numbers like [1] in the analysis refer to these.
      </p>
      <ol className="space-y-2.5">
        {sources.map(s => (
          <li key={s.id} className="flex gap-3 text-sm">
            <span className="text-indigo-400 font-mono text-xs mt-0.5 flex-shrink-0">[{s.id}]</span>
            <div className="min-w-0">
              <a href={s.url} target="_blank" rel="noopener noreferrer"
                className="text-slate-200 hover:text-indigo-300 transition-colors break-words">
                {s.title}
              </a>
              <span className="text-slate-600 text-xs ml-2">{hostname(s.url)}</span>
            </div>
          </li>
        ))}
      </ol>
    </ReportCard>
  );
}
