import React, { useEffect, useRef, useState } from 'react';

export default function ReportCard({ children, className = '', delay = 0 }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    let observer;
    const timer = setTimeout(() => {
      observer = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setVisible(true); },
        { threshold: 0.1 }
      );
      if (ref.current) observer.observe(ref.current);
    }, delay);
    return () => {
      clearTimeout(timer);
      observer?.disconnect();
    };
  }, [delay]);

  return (
    <div
      ref={ref}
      className={`reveal ${visible ? 'visible' : ''} bg-[#111118] border border-[#1e1e2e] rounded-2xl ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
