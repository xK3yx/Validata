const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const MODEL = 'llama-3.3-70b-versatile';

const SYSTEM_PROMPT = `You are an expert startup analyst and venture capital advisor. Your task is to evaluate a startup or SaaS idea and return a structured JSON analysis.

CRITICAL: Return ONLY valid JSON. No markdown, no code fences, no prose before or after. Just the raw JSON object.

The JSON must follow this exact schema:
{
  "viability_score": <integer 0-100>,
  "summary": "<one paragraph executive summary>",
  "market_opportunity": {
    "score": <integer 1-10>,
    "analysis": "<detailed analysis>",
    "market_size": "<e.g. $4.2B TAM>"
  },
  "competition": {
    "score": <integer 1-10>,
    "analysis": "<detailed analysis>",
    "competitors": ["<Competitor A>", "<Competitor B>", "<Competitor C>"]
  },
  "monetization": {
    "strategies": [
      { "name": "<Strategy Name>", "description": "<description>" },
      { "name": "<Strategy Name>", "description": "<description>" }
    ]
  },
  "risks": [
    { "title": "<Risk Title>", "severity": "<High|Medium|Low>", "description": "<description>" },
    { "title": "<Risk Title>", "severity": "<High|Medium|Low>", "description": "<description>" }
  ],
  "mvp_features": [
    { "feature": "<feature name>", "priority": "<Must Have|Should Have|Nice to Have>" },
    { "feature": "<feature name>", "priority": "<Must Have|Should Have|Nice to Have>" }
  ],
  "pivot_suggestions": [
    {
      "title": "<Pivot Name e.g. B2B White-Label Version>",
      "description": "<2-3 sentence description of the pivot>",
      "key_change": "<The core change e.g. Distribution model, Target customer, Pricing model>",
      "potential_upside": "<Why this could score higher>"
    }
  ],
  "dimension_scores": {
    "innovation": <integer 1-10>,
    "execution_feasibility": <integer 1-10>,
    "monetization_potential": <integer 1-10>
  },
  "verdict": "<Highly Promising|Promising|Needs Refinement|Risky>"
}

Verdict rules based on viability_score:
- 80-100: "Highly Promising"
- 60-79: "Promising"
- 40-59: "Needs Refinement"
- 0-39: "Risky"

pivot_suggestions: Provide exactly 2-3 meaningful alternative directions for the idea. These should be realistic pivots, not incremental changes.
dimension_scores: Score innovation (uniqueness/novelty), execution_feasibility (how easy to build/launch), and monetization_potential (revenue potential).

Be thorough, realistic, and data-driven. Include 3-5 risks, 3-5 MVP features, and 2-3 monetization strategies.`;

function cleanJson(raw) {
  return raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
}

// Retry with exponential backoff for transient errors (rate limits, network)
async function withRetry(fn, maxAttempts = 3, baseDelayMs = 1000) {
  let lastErr;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const isRetryable = err.status === 429 || err.status >= 500 || err.code === 'ECONNRESET'
        || err.message?.includes('invalid JSON');
      if (!isRetryable || attempt === maxAttempts) break;
      const delay = baseDelayMs * Math.pow(2, attempt - 1);
      console.warn(`Groq attempt ${attempt} failed (${err.status || err.code}), retrying in ${delay}ms...`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw lastErr;
}

async function analyzeIdea({ idea_title, idea_description, target_audience, industry, refinement_context }) {
  const userPrompt = `Analyze this startup/SaaS idea:

Title: ${idea_title}
Industry: ${industry || 'Not specified'}
Target Audience: ${target_audience || 'Not specified'}
Description: ${idea_description}
${refinement_context ? `\nRefinement Context: ${refinement_context}` : ''}

Provide a comprehensive validation report as JSON.`;

  return withRetry(async () => {
    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 3000,
    });
    const raw = completion.choices[0].message.content.trim();
    try {
      return JSON.parse(cleanJson(raw));
    } catch (_) {
      throw new Error('AI returned invalid JSON — will retry');
    }
  });
}

async function analyzeComparison(ideaA, ideaB) {
  const [reportA, reportB] = await Promise.all([
    analyzeIdea(ideaA),
    analyzeIdea(ideaB),
  ]);

  const scoreA = reportA.viability_score;
  const scoreB = reportB.viability_score;
  const diff = Math.abs(scoreA - scoreB);

  let winner, comparison_summary;
  if (diff <= 5) {
    winner = 'Tie';
    comparison_summary = `Both ideas are closely matched (${scoreA} vs ${scoreB}). ${ideaA.idea_title} and ${ideaB.idea_title} have comparable viability. Your choice should depend on your team's strengths and personal passion.`;
  } else if (scoreA > scoreB) {
    winner = 'A';
    comparison_summary = `${ideaA.idea_title} scores notably higher (${scoreA} vs ${scoreB}). It shows stronger ${reportA.market_opportunity.score > reportB.market_opportunity.score ? 'market opportunity' : 'overall fundamentals'}. Consider ${ideaA.idea_title} as your primary direction.`;
  } else {
    winner = 'B';
    comparison_summary = `${ideaB.idea_title} scores notably higher (${scoreB} vs ${scoreA}). It demonstrates better ${reportB.market_opportunity.score > reportA.market_opportunity.score ? 'market opportunity' : 'overall fundamentals'}. Consider ${ideaB.idea_title} as your primary direction.`;
  }

  return { reportA, reportB, winner, comparison_summary };
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

Answer follow-up questions specifically about this idea. Be concise, direct, and actionable. Format responses in plain text (no markdown).`;

  return withRetry(async () => {
    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      temperature: 0.7,
      max_tokens: 512,
    });
    return completion.choices[0].message.content.trim();
  });
}

async function summarizeCompetitorData({ companyName, serperResults, industry }) {
  const prompt = `Based on these web search results about "${companyName}", extract and return ONLY valid JSON with this exact shape. No markdown, no prose.

Search results:
${serperResults}

JSON schema:
{
  "overview": "<1-2 sentence company overview>",
  "founded": "<year or 'Unknown'>",
  "funding": "<total funding raised or 'Bootstrapped' or 'Unknown'>",
  "pricing": "<pricing model and tiers or 'Unknown'>",
  "key_features": ["<feature 1>", "<feature 2>", "<feature 3>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>"],
  "website": "<domain.com or 'Unknown'>",
  "positioning": "<their market positioning in 1 sentence>"
}`;

  return withRetry(async () => {
    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 512,
    });
    return JSON.parse(cleanJson(completion.choices[0].message.content.trim()));
  }, 2);
}

module.exports = { analyzeIdea, analyzeComparison, chatAboutIdea, summarizeCompetitorData };
