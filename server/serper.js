const { summarizeCompetitorData } = require('./groq');

const SERPER_API_KEY = process.env.SERPER_API_KEY;

async function searchCompetitor(companyName, industry) {
  const query = `${companyName} startup company funding pricing features review site:crunchbase.com OR site:g2.com OR site:producthunt.com OR site:techcrunch.com`;

  const response = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: {
      'X-API-KEY': SERPER_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ q: query, num: 8 }),
  });

  if (!response.ok) {
    throw new Error(`Serper API error: ${response.status}`);
  }

  const data = await response.json();

  // Extract relevant text from organic results + knowledge graph
  const snippets = [];

  if (data.knowledgeGraph) {
    const kg = data.knowledgeGraph;
    if (kg.title) snippets.push(`Company: ${kg.title}`);
    if (kg.description) snippets.push(`Description: ${kg.description}`);
    if (kg.attributes) {
      Object.entries(kg.attributes).forEach(([k, v]) => snippets.push(`${k}: ${v}`));
    }
  }

  if (data.organic) {
    data.organic.slice(0, 6).forEach(result => {
      snippets.push(`[${result.title}] ${result.snippet || ''} (${result.link})`);
    });
  }

  if (data.answerBox?.answer) {
    snippets.unshift(`Answer: ${data.answerBox.answer}`);
  }

  const rawText = snippets.join('\n\n');

  // Use Groq to parse into structured data
  try {
    const structured = await summarizeCompetitorData({
      companyName,
      serperResults: rawText,
      industry,
    });
    return structured;
  } catch (err) {
    // Return partial data if Groq fails
    return {
      overview: `${companyName} is a company in the ${industry || 'tech'} space.`,
      founded: 'Unknown',
      funding: 'Unknown',
      pricing: 'Unknown',
      key_features: [],
      weaknesses: [],
      website: 'Unknown',
      positioning: `${companyName} operates in this market.`,
    };
  }
}

module.exports = { searchCompetitor };
