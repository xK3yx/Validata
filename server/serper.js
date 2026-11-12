const { summarizeCompetitorData } = require('./groq');

const SERPER_URL = 'https://google.serper.dev/search';
const TIMEOUT_MS = 8000;

function hasSerper() {
  return Boolean(process.env.SERPER_API_KEY);
}

async function serperSearch(q, num = 6) {
  const response = await fetch(SERPER_URL, {
    method: 'POST',
    headers: { 'X-API-KEY': process.env.SERPER_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ q, num }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`Serper API error: ${response.status}`);
  return response.json();
}

/**
 * Gather real web results about an idea's competitors and market so the
 * analysis can cite them instead of inventing numbers.
 * Returns [{ id, title, url, snippet }] with ids starting at 1.
 * Never throws: research is best-effort and the report still works without it.
 */
async function researchIdea({ idea_title, idea_description, industry }) {
  if (!hasSerper()) return [];

  const subject = industry && industry !== 'Other' ? industry : idea_title;
  const keywords = idea_description.split(/\s+/).slice(0, 12).join(' ');
  const year = new Date().getFullYear();
  const queries = [
    `${idea_title} ${keywords} competitors alternatives`,
    `${subject} market size ${year}`,
  ];

  const settled = await Promise.allSettled(queries.map(q => serperSearch(q, 6)));
  const seen = new Set();
  const sources = [];
  for (const result of settled) {
    if (result.status !== 'fulfilled') {
      console.warn('Research search failed:', result.reason?.message);
      continue;
    }
    for (const item of result.value.organic || []) {
      if (!item.link || seen.has(item.link) || !item.snippet) continue;
      seen.add(item.link);
      sources.push({ title: item.title, url: item.link, snippet: item.snippet });
    }
  }
  return sources.slice(0, 8).map((s, i) => ({ id: i + 1, ...s }));
}

async function searchCompetitor(companyName, industry) {
  const query = `${companyName} startup company funding pricing features review site:crunchbase.com OR site:g2.com OR site:producthunt.com OR site:techcrunch.com`;
  const data = await serperSearch(query, 8);

  const snippets = [];
  if (data.answerBox?.answer) snippets.push(`Answer: ${data.answerBox.answer}`);
  if (data.knowledgeGraph) {
    const kg = data.knowledgeGraph;
    if (kg.title) snippets.push(`Company: ${kg.title}`);
    if (kg.description) snippets.push(`Description: ${kg.description}`);
    Object.entries(kg.attributes || {}).forEach(([k, v]) => snippets.push(`${k}: ${v}`));
  }
  (data.organic || []).slice(0, 6).forEach(r => snippets.push(`[${r.title}] ${r.snippet || ''} (${r.link})`));

  try {
    return await summarizeCompetitorData({ companyName, serperResults: snippets.join('\n\n'), industry });
  } catch (err) {
    console.warn('Competitor summary failed:', err.message);
    return {
      overview: `${companyName} is a company in the ${industry || 'tech'} space.`,
      founded: 'Unknown',
      funding: 'Unknown',
      pricing: 'Unknown',
      key_features: [],
      weaknesses: [],
      website: 'Unknown',
      positioning: 'Unknown',
    };
  }
}

module.exports = { hasSerper, researchIdea, searchCompetitor };
