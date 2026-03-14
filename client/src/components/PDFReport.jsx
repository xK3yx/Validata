import React from 'react';
import {
  Document, Page, Text, View, StyleSheet, PDFDownloadLink
} from '@react-pdf/renderer';

const colors = {
  bg: '#ffffff',
  surface: '#f8fafc',
  border: '#e2e8f0',
  indigo: '#6366f1',
  emerald: '#10b981',
  rose: '#f43f5e',
  amber: '#f59e0b',
  text: '#0f172a',
  muted: '#64748b',
  light: '#94a3b8',
};

const styles = StyleSheet.create({
  page: { backgroundColor: colors.bg, padding: 48, fontFamily: 'Helvetica' },
  header: { marginBottom: 32, borderBottom: `2px solid ${colors.indigo}`, paddingBottom: 20 },
  badge: { backgroundColor: '#ede9fe', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 10, alignSelf: 'flex-start' },
  badgeText: { color: colors.indigo, fontSize: 9, fontFamily: 'Helvetica-Bold' },
  title: { fontSize: 24, fontFamily: 'Helvetica-Bold', color: colors.text, marginBottom: 8 },
  subtitle: { fontSize: 11, color: colors.muted },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 16 },
  scoreBig: { fontSize: 48, fontFamily: 'Helvetica-Bold', color: colors.indigo },
  scoreLabel: { fontSize: 10, color: colors.muted },
  verdictChip: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, marginTop: 8, alignSelf: 'flex-start' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: colors.text, marginBottom: 8, borderLeft: `3px solid ${colors.indigo}`, paddingLeft: 10 },
  card: { backgroundColor: colors.surface, borderRadius: 8, padding: 14, border: `1px solid ${colors.border}`, marginBottom: 10 },
  bodyText: { fontSize: 10, color: '#334155', lineHeight: 1.6 },
  mutedText: { fontSize: 9, color: colors.muted, lineHeight: 1.5 },
  row: { flexDirection: 'row', gap: 12, marginBottom: 10 },
  halfCard: { flex: 1, backgroundColor: colors.surface, borderRadius: 8, padding: 12, border: `1px solid ${colors.border}` },
  statLabel: { fontSize: 8, color: colors.muted, marginBottom: 3 },
  statValue: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: colors.text },
  tag: { backgroundColor: '#ede9fe', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginRight: 6, marginBottom: 6 },
  tagText: { fontSize: 8, color: colors.indigo },
  tagGreen: { backgroundColor: '#d1fae5' },
  tagGreenText: { color: colors.emerald },
  tagAmber: { backgroundColor: '#fef3c7' },
  tagAmberText: { color: '#92400e' },
  tagRed: { backgroundColor: '#fee2e2' },
  tagRedText: { color: '#b91c1c' },
  pivot: { backgroundColor: '#f0fdf4', borderRadius: 8, padding: 12, border: `1px solid #bbf7d0`, marginBottom: 8 },
  pivotTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#166534', marginBottom: 4 },
  footer: { position: 'absolute', bottom: 24, left: 48, right: 48, borderTop: `1px solid ${colors.border}`, paddingTop: 12, flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 8, color: colors.light },
});

function verdictColor(verdict) {
  if (verdict === 'Highly Promising') return { bg: '#d1fae5', text: '#065f46' };
  if (verdict === 'Promising') return { bg: '#ede9fe', text: '#4c1d95' };
  if (verdict === 'Needs Refinement') return { bg: '#fef3c7', text: '#78350f' };
  return { bg: '#fee2e2', text: '#7f1d1d' };
}

function scoreColor(score) {
  if (score >= 70) return colors.emerald;
  if (score >= 40) return colors.amber;
  return colors.rose;
}

function severityStyle(severity) {
  if (severity === 'High') return { bg: styles.tagRed, text: styles.tagRedText };
  if (severity === 'Medium') return { bg: styles.tagAmber, text: styles.tagAmberText };
  return { bg: styles.tagGreen, text: styles.tagGreenText };
}

const ReportDocument = ({ report, idea }) => {
  const vc = verdictColor(report.verdict);
  const sc = scoreColor(report.viability_score);
  const generated = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>⚡ VALIDATA REPORT</Text>
          </View>
          <Text style={styles.title}>{idea.idea_title || 'Idea Validation Report'}</Text>
          <Text style={styles.subtitle}>{idea.industry || 'General'} · {idea.target_audience || 'General Market'}</Text>
          <View style={styles.scoreRow}>
            <View>
              <Text style={[styles.scoreBig, { color: sc }]}>{report.viability_score}</Text>
              <Text style={styles.scoreLabel}>Viability Score / 100</Text>
            </View>
            <View>
              <View style={[styles.verdictChip, { backgroundColor: vc.bg }]}>
                <Text style={{ fontSize: 12, fontFamily: 'Helvetica-Bold', color: vc.text }}>{report.verdict}</Text>
              </View>
              <Text style={[styles.mutedText, { marginTop: 4 }]}>Generated {generated}</Text>
            </View>
          </View>
        </View>

        {/* Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Executive Summary</Text>
          <View style={styles.card}>
            <Text style={styles.bodyText}>{report.summary}</Text>
          </View>
        </View>

        {/* Market + Competition */}
        <View style={[styles.row, styles.section]}>
          <View style={styles.halfCard}>
            <Text style={[styles.sectionTitle, { fontSize: 11 }]}>Market Opportunity</Text>
            <Text style={styles.statLabel}>Score</Text>
            <Text style={styles.statValue}>{report.market_opportunity?.score}/10</Text>
            {report.market_opportunity?.market_size && (
              <>
                <Text style={[styles.statLabel, { marginTop: 8 }]}>Market Size</Text>
                <Text style={styles.statValue}>{report.market_opportunity.market_size}</Text>
              </>
            )}
            <Text style={[styles.mutedText, { marginTop: 8 }]}>{report.market_opportunity?.analysis}</Text>
          </View>
          <View style={styles.halfCard}>
            <Text style={[styles.sectionTitle, { fontSize: 11 }]}>Competition</Text>
            <Text style={styles.statLabel}>Score</Text>
            <Text style={styles.statValue}>{report.competition?.score}/10</Text>
            <Text style={[styles.mutedText, { marginTop: 8 }]}>{report.competition?.analysis?.substring(0, 200)}...</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
              {report.competition?.competitors?.map((c, i) => (
                <View key={i} style={styles.tag}><Text style={styles.tagText}>{c}</Text></View>
              ))}
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>validata.app · AI Idea Validation</Text>
          <Text style={styles.footerText}>{idea.idea_title}</Text>
        </View>
      </Page>

      <Page size="A4" style={styles.page}>
        {/* Risks */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Risk Assessment</Text>
          {report.risks?.map((risk, i) => {
            const sev = severityStyle(risk.severity);
            return (
              <View key={i} style={[styles.card, { flexDirection: 'row', gap: 12, alignItems: 'flex-start' }]}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', color: colors.text, marginBottom: 4 }}>{risk.title}</Text>
                  <Text style={styles.mutedText}>{risk.description}</Text>
                </View>
                <View style={[styles.tag, sev.bg]}>
                  <Text style={[styles.tagText, sev.text]}>{risk.severity}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* MVP Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>MVP Feature Roadmap</Text>
          {report.mvp_features?.map((f, i) => (
            <View key={i} style={[styles.card, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }]}>
              <Text style={styles.bodyText}>{f.feature}</Text>
              <View style={[styles.tag, f.priority === 'Must Have' ? {} : f.priority === 'Should Have' ? styles.tagGreen : { backgroundColor: '#f1f5f9' }]}>
                <Text style={[styles.tagText, f.priority === 'Should Have' ? styles.tagGreenText : {}]}>{f.priority}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Monetization */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Monetization Strategies</Text>
          <View style={styles.row}>
            {report.monetization?.strategies?.map((s, i) => (
              <View key={i} style={styles.halfCard}>
                <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', color: colors.indigo, marginBottom: 6 }}>{s.name}</Text>
                <Text style={styles.mutedText}>{s.description}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Pivots */}
        {report.pivot_suggestions?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Strategic Pivot Suggestions</Text>
            {report.pivot_suggestions.map((p, i) => (
              <View key={i} style={styles.pivot}>
                <Text style={styles.pivotTitle}>{p.title}</Text>
                <Text style={styles.mutedText}>{p.description}</Text>
                {p.potential_upside && (
                  <Text style={[styles.mutedText, { color: colors.emerald, marginTop: 4 }]}>↑ {p.potential_upside}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>validata.app · AI Idea Validation</Text>
          <Text style={styles.footerText}>{idea.idea_title}</Text>
        </View>
      </Page>
    </Document>
  );
};

export function PDFDownloadButton({ report, idea }) {
  const filename = `validata-${(idea.idea_title || 'report').toLowerCase().replace(/\s+/g, '-').slice(0, 40)}.pdf`;

  return (
    <PDFDownloadLink
      document={<ReportDocument report={report} idea={idea} />}
      fileName={filename}
      style={{ textDecoration: 'none' }}
    >
      {({ loading }) => (
        <span
          className={`flex items-center gap-2 bg-[#1a1a28] hover:bg-[#222235] border border-[#2a2a3e] hover:border-indigo-500/40 text-slate-300 hover:text-white font-medium py-2.5 px-4 rounded-xl transition-all text-sm cursor-pointer select-none ${loading ? 'opacity-60 pointer-events-none' : ''}`}
        >
          {loading ? (
            <>
              <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 11-6.219-8.56"/>
              </svg>
              Generating PDF...
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Export PDF
            </>
          )}
        </span>
      )}
    </PDFDownloadLink>
  );
}
