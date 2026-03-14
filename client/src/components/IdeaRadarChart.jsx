import React from 'react';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, Legend, Tooltip
} from 'recharts';

function buildRadarData(report, label) {
  const ds = report.dimension_scores || {};
  return [
    { dimension: 'Market', score: report.market_opportunity?.score ?? 5 },
    { dimension: 'Competition', score: report.competition?.score ?? 5 },
    { dimension: 'Innovation', score: ds.innovation ?? 5 },
    { dimension: 'Execution', score: ds.execution_feasibility ?? 5 },
    { dimension: 'Monetization', score: ds.monetization_potential ?? 5 },
  ];
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#111118] border border-[#2a2a3e] rounded-lg px-3 py-2 text-xs">
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color }}>{p.name}: {p.value}/10</div>
      ))}
    </div>
  );
};

export default function IdeaRadarChart({ reportA, reportB, labelA = 'Idea A', labelB = 'Idea B', single = false }) {
  const dataA = buildRadarData(reportA, labelA);

  // Merge for comparison mode
  const data = single
    ? dataA
    : dataA.map((item, i) => {
        const b = buildRadarData(reportB)[i];
        return { ...item, scoreA: item.score, scoreB: b.score };
      });

  const finalData = single
    ? data.map(d => ({ dimension: d.dimension, [labelA]: d.score }))
    : data.map(d => ({ dimension: d.dimension, [labelA]: d.scoreA, [labelB]: d.scoreB }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <RadarChart data={finalData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
        <PolarGrid stroke="#1e1e2e" strokeDasharray="3 3" />
        <PolarAngleAxis
          dataKey="dimension"
          tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'DM Sans' }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Radar
          name={labelA}
          dataKey={labelA}
          stroke="#6366f1"
          fill="#6366f1"
          fillOpacity={0.15}
          strokeWidth={2}
          dot={{ fill: '#6366f1', r: 3 }}
        />
        {!single && reportB && (
          <Radar
            name={labelB}
            dataKey={labelB}
            stroke="#10b981"
            fill="#10b981"
            fillOpacity={0.15}
            strokeWidth={2}
            dot={{ fill: '#10b981', r: 3 }}
          />
        )}
        {!single && reportB && (
          <Legend
            wrapperStyle={{ fontSize: 11, color: '#94a3b8', paddingTop: 8 }}
            formatter={(value) => <span style={{ color: value === labelA ? '#6366f1' : '#10b981' }}>{value}</span>}
          />
        )}
      </RadarChart>
    </ResponsiveContainer>
  );
}
