import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Dot
} from 'recharts';

// SQLite CURRENT_TIMESTAMP is UTC; parse as UTC to avoid off-by-one-day for non-UTC users
function formatDate(dateStr) {
  return new Date(dateStr.replace(' ', 'T') + 'Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-[#111118] border border-[#2a2a3e] rounded-xl px-4 py-3 shadow-xl text-xs max-w-[200px]">
      <p className="text-slate-500 mb-1">{formatDate(d.created_at)}</p>
      <p className="text-white font-semibold truncate mb-1">{d.idea_title}</p>
      <p className="text-indigo-400 font-bold text-base">{d.viability_score}<span className="text-slate-500 text-xs font-normal">/100</span></p>
      {d.verdict && <p className="text-slate-400 mt-1">{d.verdict}</p>}
    </div>
  );
};

const CustomDot = (props) => {
  const { cx, cy, payload } = props;
  const score = payload.viability_score;
  const color = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#f43f5e';
  return (
    <circle cx={cx} cy={cy} r={5} fill={color} stroke={color} strokeWidth={2}
      style={{ filter: `drop-shadow(0 0 4px ${color}80)` }} />
  );
};

export default function ScoreTrendChart({ analyses }) {
  if (!analyses || analyses.length < 2) return null;

  const sorted = [...analyses].sort((a, b) => new Date(a.created_at.replace(' ', 'T') + 'Z') - new Date(b.created_at.replace(' ', 'T') + 'Z'));
  const avg = Math.round(sorted.reduce((s, a) => s + a.viability_score, 0) / sorted.length);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-heading font-semibold text-white text-base">Score Trend</h3>
          <p className="text-slate-500 text-xs">Viability scores over time</p>
        </div>
        <div className="text-right">
          <div className="text-indigo-400 font-heading font-bold text-lg">{avg}</div>
          <div className="text-slate-500 text-xs">Avg score</div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={sorted} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" vertical={false} />
          <XAxis
            dataKey="created_at"
            tickFormatter={formatDate}
            tick={{ fill: '#475569', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: '#475569', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#2d2d44', strokeWidth: 1, strokeDasharray: '4' }} />
          <ReferenceLine y={avg} stroke="#6366f140" strokeDasharray="4 4" />
          <Line
            type="monotone"
            dataKey="viability_score"
            stroke="#6366f1"
            strokeWidth={2}
            dot={<CustomDot />}
            activeDot={{ r: 7, fill: '#6366f1', stroke: '#818cf8', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
