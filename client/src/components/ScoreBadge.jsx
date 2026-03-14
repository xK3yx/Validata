import React, { useEffect, useRef, useState } from 'react';

function getColor(score) {
  if (score >= 70) return { stroke: '#10b981', text: '#10b981', glow: 'rgba(16,185,129,0.3)' };
  if (score >= 40) return { stroke: '#f59e0b', text: '#f59e0b', glow: 'rgba(245,158,11,0.3)' };
  return { stroke: '#f43f5e', text: '#f43f5e', glow: 'rgba(244,63,94,0.3)' };
}

export default function ScoreBadge({ score, size = 100 }) {
  const [animated, setAnimated] = useState(false);
  const ref = useRef(null);

  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = getColor(score);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setAnimated(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 100 100" className="-rotate-90">
        {/* Track */}
        <circle
          cx="50" cy="50" r={radius}
          fill="none"
          stroke="#1e1e2e"
          strokeWidth="8"
        />
        {/* Fill */}
        <circle
          cx="50" cy="50" r={radius}
          fill="none"
          stroke={color.stroke}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={animated ? offset : circumference}
          style={{
            transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)',
            filter: `drop-shadow(0 0 6px ${color.glow})`,
          }}
        />
      </svg>
      {/* Score text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-heading font-bold leading-none" style={{ fontSize: size * 0.22, color: color.text }}>
          {score}
        </span>
        <span className="text-slate-500 leading-none" style={{ fontSize: size * 0.1 }}>/ 100</span>
      </div>
    </div>
  );
}
