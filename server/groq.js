const Groq = require('groq-sdk');
const { z } = require('zod');

// Groq retires models over time; override with GROQ_MODEL when that happens.
const MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

let client;
function groq() {
  if (!client) client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return client;
}

// Reasoning models spend output tokens on hidden reasoning before answering.
// Keep reasoning short and leave headroom so answers are not cut off.
function modelOptions(maxTokens) {
  if (MODEL.startsWith('openai/gpt-oss')) return { max_tokens: maxTokens + 1024, reasoning_effort: 'low' };
  if (MODEL.startsWith('qwen/qwen3')) return { max_tokens: maxTokens + 1024, reasoning_effort: 'none' };
  return { max_tokens: maxTokens };
}

async function complete({ messages, temperature = 0.7, maxTokens = 1024, json = false }) {
  const completion = await groq().chat.completions.create({
    model: MODEL,
    messages,
    temperature,
    ...modelOptions(maxTokens),
    ...(json ? { response_format: { type: 'json_object' } } : {}),
  });
  return (completion.choices[0]?.message?.content || '').trim();
}

// ─── Report schema ───────────────────────────────────────────────────────────
// Models occasionally return strings for numbers or omit optional parts.
// The schema coerces what it can, fills safe defaults, and rejects the rest
// so a malformed answer is retried instead of crashing the results page.

const score10 = z.coerce.number().transform(n => Math.min(10, Math.max(1, Math.round(n))));
const text = z.string().trim().min(1);

const ReportSchema = z.object({
  viability_score: z.coerce.number().transform(n => Math.min(100, Math.max(0, Math.round(n)))),
  summary: text,
  market_opportunity: z.object({
    score: score10,
    analysis: text,
    market_size: z.string().trim().default('Unknown'),
    market_size_source: z.coerce.number().int().nullable().optional().catch(null),
  }),
  competition: z.object({
    score: score10,
    analysis: text,
    competitors: z.array(z.string().trim().min(1)).default([]),
  }),
  monetization: z.object({
    strategies: z.array(z.object({ name: text, description: text })).min(1),
  }),
  risks: z.array(z.object({
    title: text,
    severity: z.enum(['High', 'Medium', 'Low']).catch('Medium'),
    description: text,
  })).min(1),
  mvp_features: z.array(z.object({
    feature: text,
    priority: z.enum(['Must Have', 'Should Have', 'Nice to Have']).catch('Should Have'),
  })).min(1),
  pivot_suggestions: z.array(z.object({
    title: text,
    description: text,
    key_change: z.string().default(''),
    potential_upside: z.string().default(''),
  })).default([]),
  dimension_scores: z.object({
    innovation: score10,
    execution_feasibility: score10,
    monetization_potential: score10,
  }),
});

function verdictFor(score) {
  if (score >= 80) return 'Highly Promising';
  if (score >= 60) return 'Promising';
  if (score >= 40) return 'Needs Refinement';
  return 'Risky';
}

class InvalidAIResponse extends Error {}

function parseReport(raw, sources) {
  let data;
  try {
    data = JSON.parse(raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, ''));
  } catch {
    throw new InvalidAIResponse('AI returned invalid JSON');
  }
  const parsed = ReportSchema.safeParse(data);
  if (!parsed.success) {
    throw new InvalidAIResponse(`AI response did not match the report schema: ${parsed.error.issues[0]?.path.join('.')}`);
  }
  const report = parsed.data;
  // The verdict is derived from the score so the two can never disagree.
  report.verdict = verdictFor(report.viability_score);
  report.sources = sources;
  const src = report.market_opportunity.market_size_source;
  if (!sources.some(s => s.id === src)) report.market_opportunity.market_size_source = null;
  return report;
}

// Retry with exponential backoff for rate limits, server errors, and malformed output.
async function withRetry(fn, maxAttempts = 3, baseDelayMs = 1000) {
  let lastErr;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const retryable = err instanceof InvalidAIResponse
        || err.status === 429 || err.status >= 500 || err.code === 'ECONNRESET';
      if (!retryable || attempt === maxAttempts) break;
      const delay = baseDelayMs * 2 ** (attempt - 1);
      console.warn(`Groq attempt ${attempt} failed (${err.status || err.message}), retrying in ${delay}ms`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw lastErr;
}

const SYSTEM_PROMPT = `You are an expert startup analyst and venture capital advisor. Evaluate a startup or SaaS idea and return a structured JSON analysis.

Return ONLY a JSON object with this schema:
{
  "viability_score": <integer 0-100>,
  "summary": "<one paragraph executive summary>",
  "market_opportunity": {
    "score": <integer 1-10>,
    "analysis": "<detailed analysis>",
    "market_size": "<e.g. $4.2B TAM (2025)>",
    "market_size_source": <number of the search result the figure comes from, or null>
  },
  "competition": {
    "score": <integer 1-10>,
    "analysis": "<detailed analysis>",
    "competitors": ["<Competitor A>", "<Competitor B>", "<Competitor C>"]
  },
  "monetization": { "strategies": [{ "name": "<name>", "description": "<description>" }] },
  "risks": [{ "title": "<title>", "severity": "<High|Medium|Low>", "description": "<description>" }],
  "mvp_features": [{ "feature": "<feature>", "priority": "<Must Have|Should Have|Nice to Have>" }],
  "pivot_suggestions": [{
    "title": "<pivot name>",
    "description": "<2-3 sentences>",
    "key_change": "<e.g. distribution model, target customer, pricing model>",
    "potential_upside": "<why this could score higher>"
  }],
  "dimension_scores": {
    "innovation": <integer 1-10>,
    "execution_feasibility": <integer 1-10>,
    "monetization_potential": <integer 1-10>
  }
}

Include 3-5 risks, 3-5 MVP features, 2-3 monetization strategies, and 2-3 realistic pivots (not incremental changes).
Score innovation (novelty), execution_feasibility (how easy to build and launch), and monetization_potential (revenue potential).
Be thorough, realistic, and skeptical. Most ideas are not highly promising.`;

function researchBlock(sources) {
  if (!sources.length) {
    return `\nNo web search results are available. Prefix any market size figure with "Estimate:" and set market_size_source to null.`;
  }
  const list = sources.map(s => `[${s.id}] ${s.title}\n${s.snippet}\n${s.url}`).join('\n\n');
  return `
WEB SEARCH RESULTS (current, real data):
${list}

Grounding rules:
- Base competitors on companies that actually appear in the search results where possible.
- Cite results inline in analysis text as [n], using the numbers above.
- Only use a market size figure if a search result states it; set market_size_source to that result's number. Otherwise prefix the figure with "Estimate:" and set market_size_source to null.
- Never invent statistics and attribute them to a source.`;
}

async function analyzeIdea({ idea_title, idea_description, target_audience, industry, refinement_context }, sources = []) {
  const userPrompt = `Analyze this startup/SaaS idea:

Title: ${idea_title}
Industry: ${industry || 'Not specified'}
Target Audience: ${target_audience || 'Not specified'}
Description: ${idea_description}
${refinement_context ? `\nRefinement context (the founder revised the idea after a previous report): ${refinement_context}\n` : ''}${researchBlock(sources)}`;

  return withRetry(async () => {
    const raw = await complete({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.6,
      maxTokens: 3000,
      json: true,
    });
    return parseReport(raw, sources);
  });
}

function compareReports(ideaA, reportA, ideaB, reportB) {
  const scoreA = reportA.viability_score;
  const scoreB = reportB.viability_score;
  if (Math.abs(scoreA - scoreB) <= 5) {
    return {
      winner: 'Tie',
      comparison_summary: `Both ideas are closely matched (${scoreA} vs ${scoreB}). ${ideaA.idea_title} and ${ideaB.idea_title} have comparable viability, so your choice should depend on your team's strengths and interests.`,
    };
  }
  const [win, winReport, lose, loseReport, key] = scoreA > scoreB
    ? [ideaA, reportA, ideaB, reportB, 'A']
    : [ideaB, reportB, ideaA, reportA, 'B'];
  const strength = winReport.market_opportunity.score > loseReport.market_opportunity.score
    ? 'market opportunity' : 'overall fundamentals';
  return {
    winner: key,
    comparison_summary: `${win.idea_title} scores notably higher (${winReport.viability_score} vs ${loseReport.viability_score}) and shows stronger ${strength}. Consider ${win.idea_title} as your primary direction.`,
  };
}

async function chatAboutIdea({ messages, report, idea_title }) {
  const systemPrompt = `You are an expert startup advisor. You have just analyzed the following idea and produced a detailed report.

IDEA: "${idea_title}"

REPORT SUMMARY:
- Viability Score: ${report.viability_score}/100
- Verdict: ${report.verdict}
- Market Size: ${report.market_opportunity?.market_size || 'N/A'}
- Market Score: ${report.market_opportunity?.score}/10
- Competition Score: ${report.competition?.score}/10
- Competitors: ${report.competition?.competitors?.join(', ') || 'N/A'}
- Top Risks: ${report.risks?.map(r => r.title).join(', ') || 'N/A'}
- Monetization: ${report.monetization?.strategies?.map(s => s.name).join(', ') || 'N/A'}

Answer follow-up questions specifically about this idea. Be concise, direct, and actionable. Reply in plain text without markdown. If a question is unrelated to this idea or startups, briefly decline.`;

  return withRetry(() => complete({
    messages: [{ role: 'system', content: systemPrompt }, ...messages],
    temperature: 0.7,
    maxTokens: 512,
  }));
}

const CompetitorSchema = z.object({
  overview: z.string().default('Unknown'),
  founded: z.coerce.string().default('Unknown'),
  funding: z.string().default('Unknown'),
  pricing: z.string().default('Unknown'),
  key_features: z.array(z.string()).default([]),
  weaknesses: z.array(z.string()).default([]),
  website: z.string().default('Unknown'),
  positioning: z.string().default('Unknown'),
});

async function summarizeCompetitorData({ companyName, serperResults }) {
  const prompt = `Based only on these web search results about "${companyName}", return a JSON object with this shape. Use "Unknown" for anything the results do not state.

Search results:
${serperResults}

{
  "overview": "<1-2 sentence company overview>",
  "founded": "<year or 'Unknown'>",
  "funding": "<total funding raised, 'Bootstrapped', or 'Unknown'>",
  "pricing": "<pricing model and tiers or 'Unknown'>",
  "key_features": ["<feature>", "<feature>", "<feature>"],
  "weaknesses": ["<weakness>", "<weakness>"],
  "website": "<domain.com or 'Unknown'>",
  "positioning": "<market positioning in one sentence>"
}`;

  return withRetry(async () => {
    const raw = await complete({ messages: [{ role: 'user', content: prompt }], temperature: 0.2, maxTokens: 600, json: true });
    try {
      return CompetitorSchema.parse(JSON.parse(raw));
    } catch {
      throw new InvalidAIResponse('Invalid competitor JSON');
    }
  }, 2);
}

module.exports = {
  MODEL,
  analyzeIdea,
  compareReports,
  chatAboutIdea,
  summarizeCompetitorData,
  // exported for tests
  parseReport,
  verdictFor,
  InvalidAIResponse,
};
