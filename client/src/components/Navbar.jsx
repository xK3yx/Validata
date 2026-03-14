import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../api/client';
import { getClientId } from '../utils/clientId';

export default function Navbar() {
  const { pathname } = useLocation();
  const [usage, setUsage] = useState(null);

  useEffect(() => {
    api.get('/validate/usage', { headers: { 'X-Client-ID': getClientId() } })
      .then(({ data }) => setUsage(data))
      .catch(() => {});
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 border-b border-[#1e1e2e] bg-[#0a0a0f]/80 backdrop-blur-md">
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <span className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:shadow-indigo-500/50 transition-shadow">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M13 2L4.5 13.5H11L10 22L20.5 9.5H14L13 2Z" fill="white" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
          </span>
          <span className="font-heading font-bold text-xl text-white tracking-tight">Validata</span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          <NavLink to="/" active={pathname === '/'}>Home</NavLink>
          <NavLink to="/compare" active={pathname === '/compare'}>Compare</NavLink>
          <NavLink to="/history" active={pathname === '/history'}>History</NavLink>
          <NavLink to="/pricing" active={pathname === '/pricing'}>
            <span className="flex items-center gap-1">
              Pricing
              <span className="text-xs bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded-full font-medium">Pro</span>
            </span>
          </NavLink>
        </div>

        {/* Usage pill */}
        {usage && (
          <div className={`hidden sm:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border ${
            usage.remaining === 0
              ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
              : usage.remaining <= 2
              ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
              : 'bg-[#111118] border-[#1e1e2e] text-slate-400'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${usage.remaining === 0 ? 'bg-rose-500' : usage.remaining <= 2 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
            {usage.remaining === 0 ? 'Limit reached' : `${usage.remaining} left today`}
            {usage.remaining === 0 && (
              <Link to="/pricing" className="text-indigo-400 hover:text-indigo-300 ml-1 font-medium">Upgrade</Link>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}

function NavLink({ to, children, active }) {
  return (
    <Link
      to={to}
      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        active ? 'bg-[#1e1e2e] text-white' : 'text-slate-400 hover:text-white hover:bg-[#1a1a28]'
      }`}
    >
      {children}
    </Link>
  );
}
