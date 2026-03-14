import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const FEATURES = {
  free: [
    { label: '5 validations / day', included: true },
    { label: 'Full AI report (7 dimensions)', included: true },
    { label: 'History & saved analyses', included: true },
    { label: 'Public share links', included: true },
    { label: 'Pivot suggestions', included: true },
    { label: 'PDF export', included: false },
    { label: 'Head-to-head comparison mode', included: false },
    { label: 'Follow-up AI chat', included: false },
    { label: 'Competitor deep dive', included: false },
    { label: 'Unlimited validations', included: false },
  ],
  pro: [
    { label: 'Unlimited validations', included: true },
    { label: 'Full AI report (7 dimensions)', included: true },
    { label: 'History & saved analyses', included: true },
    { label: 'Public share links', included: true },
    { label: 'Pivot suggestions', included: true },
    { label: 'PDF export', included: true },
    { label: 'Head-to-head comparison mode', included: true },
    { label: 'Follow-up AI chat', included: true },
    { label: 'Competitor deep dive', included: true },
    { label: 'Priority AI processing', included: true },
  ],
  team: [
    { label: 'Everything in Pro', included: true },
    { label: 'Up to 10 team members', included: true },
    { label: 'Shared workspace & history', included: true },
    { label: 'Batch validation (CSV upload)', included: true },
    { label: 'API access', included: true },
    { label: 'Custom branding on PDFs', included: true },
    { label: 'Slack integration', included: true },
    { label: 'Priority support', included: true },
    { label: 'Custom AI prompts', included: true },
    { label: 'White-label export', included: true },
  ],
};

const MONTHLY = { free: 0, pro: 9, team: 29 };
const ANNUAL = { free: 0, pro: 5, team: 19 };

export default function Pricing() {
  const [annual, setAnnual] = useState(true);
  const prices = annual ? ANNUAL : MONTHLY;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 pb-20">
      {/* Header */}
      <div className="text-center mb-12 animate-[fadeUp_0.5s_ease_forwards]">
        <h1 className="font-heading font-bold text-white text-4xl sm:text-5xl mb-4">
          Simple, Transparent <span className="gradient-text">Pricing</span>
        </h1>
        <p className="text-slate-400 text-base max-w-xl mx-auto mb-8">
          Start free. Upgrade when you need more firepower.
        </p>

        {/* Toggle */}
        <div className="inline-flex items-center bg-[#111118] border border-[#1e1e2e] rounded-full p-1">
          <button
            onClick={() => setAnnual(false)}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${!annual ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
          >
            Monthly
          </button>
          <button
            onClick={() => setAnnual(true)}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${annual ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
          >
            Annual
            <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">Save 40%</span>
          </button>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Free */}
        <PricingCard
          name="Free"
          price={prices.free}
          annual={annual}
          description="For solo founders exploring ideas"
          features={FEATURES.free}
          cta="Start Free"
          ctaLink="/"
          ctaStyle="secondary"
          badge={null}
        />

        {/* Pro */}
        <PricingCard
          name="Pro"
          price={prices.pro}
          annual={annual}
          description="For serious founders & indie hackers"
          features={FEATURES.pro}
          cta="Upgrade to Pro"
          ctaLink="/"
          ctaStyle="primary"
          badge="Most Popular"
        />

        {/* Team */}
        <PricingCard
          name="Team"
          price={prices.team}
          annual={annual}
          description="For startup teams & accelerators"
          features={FEATURES.team}
          cta="Start Team Trial"
          ctaLink="/"
          ctaStyle="secondary"
          badge="Best Value"
        />
      </div>

      {/* FAQ */}
      <div className="mt-16">
        <h2 className="font-heading font-bold text-white text-2xl text-center mb-8">Frequently Asked Questions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { q: 'How accurate is the AI analysis?', a: 'Our AI uses Llama 3.3 70B with expert-crafted prompts. It\'s data-driven and nuanced, but treat it as a starting point, not gospel. Always validate with real customer research.' },
            { q: 'Can I cancel anytime?', a: 'Yes! No contracts, no lock-ins. Cancel your Pro or Team plan at any time and keep access until the end of your billing period.' },
            { q: 'Is my data private?', a: 'Absolutely. Your idea data is stored locally in SQLite on your machine. We never share or train models on your submissions.' },
            { q: 'What happens when I hit the daily limit?', a: 'You\'ll see a friendly message with your remaining count. Upgrade to Pro for unlimited daily validations.' },
            { q: 'Does the PDF work offline?', a: 'Yes! PDFs are generated entirely client-side in your browser using our PDF renderer — no server roundtrip needed.' },
            { q: 'Can I compare more than 2 ideas?', a: 'Comparison mode currently supports head-to-head (2 ideas). Multi-idea tournaments are on our roadmap!' },
          ].map((faq, i) => (
            <div key={i} className="bg-[#111118] border border-[#1e1e2e] rounded-2xl p-5">
              <p className="font-semibold text-white text-sm mb-2">{faq.q}</p>
              <p className="text-slate-400 text-sm leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="mt-16 text-center bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/10 border border-indigo-500/20 rounded-2xl p-10">
        <h2 className="font-heading font-bold text-white text-2xl mb-2">Ready to validate your idea?</h2>
        <p className="text-slate-400 text-sm mb-6">No credit card required. Start with 5 free validations today.</p>
        <Link to="/" className="inline-flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-3 px-8 rounded-xl transition-all shadow-lg shadow-indigo-500/25 text-sm">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M13 2L4.5 13.5H11L10 22L20.5 9.5H14L13 2Z"/></svg>
          Get Started Free
        </Link>
      </div>
    </div>
  );
}

function PricingCard({ name, price, annual, description, features, cta, ctaLink, ctaStyle, badge }) {
  const isPrimary = ctaStyle === 'primary';
  return (
    <div className={`relative bg-[#111118] border rounded-2xl p-6 flex flex-col ${isPrimary ? 'border-indigo-500/50 shadow-lg shadow-indigo-500/10' : 'border-[#1e1e2e]'}`}>
      {badge && (
        <div className={`absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold px-3 py-1 rounded-full ${isPrimary ? 'bg-indigo-500 text-white' : 'bg-emerald-500 text-white'}`}>
          {badge}
        </div>
      )}

      <div className="mb-6">
        <h3 className="font-heading font-bold text-white text-lg mb-1">{name}</h3>
        <p className="text-slate-500 text-xs">{description}</p>
        <div className="mt-4 flex items-end gap-1">
          <span className="font-heading font-bold text-white text-4xl">${price}</span>
          {price > 0 && <span className="text-slate-500 text-sm mb-1">/{annual ? 'mo, billed annually' : 'month'}</span>}
          {price === 0 && <span className="text-slate-500 text-sm mb-1">/forever</span>}
        </div>
        {price > 0 && annual && (
          <p className="text-emerald-400 text-xs mt-1">Save ${(MONTHLY[name.toLowerCase()] - price) * 12}/year</p>
        )}
      </div>

      <div className="space-y-2.5 flex-1 mb-6">
        {features.map((f, i) => (
          <div key={i} className="flex items-center gap-2.5">
            {f.included ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            )}
            <span className={`text-sm ${f.included ? 'text-slate-300' : 'text-slate-600'}`}>{f.label}</span>
          </div>
        ))}
      </div>

      <Link
        to={ctaLink}
        className={`w-full text-center py-3 rounded-xl font-semibold text-sm transition-all ${
          isPrimary
            ? 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
            : 'bg-[#1a1a28] hover:bg-[#222235] border border-[#2a2a3e] text-slate-300 hover:text-white'
        }`}
      >
        {cta}
        {price === 0 && ' — No card needed'}
      </Link>

      {price > 0 && (
        <p className="text-slate-600 text-xs text-center mt-2">Payments coming soon · Preview only</p>
      )}
    </div>
  );
}
