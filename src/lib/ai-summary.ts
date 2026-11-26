interface ReviewInput {
  rating: number;
  title?: string | null;
  comment: string;
}

const THEME_KEYWORDS: Array<{ label: string; keywords: string[] }> = [
  { label: 'fast WiFi & work-friendly desks', keywords: ['wifi', 'work', 'study', 'laptop', 'outlet', 'quiet'] },
  { label: 'craft specialty espresso & pour-overs', keywords: ['espresso', 'v60', 'pour', 'filter', 'latte', 'cold brew', 'roast', 'beans'] },
  { label: 'inviting ambiance & seating', keywords: ['cozy', 'vibe', 'atmosphere', 'seating', 'outdoor', 'courtyard', 'calm', 'lighting'] },
  { label: 'attentive baristas & pastries', keywords: ['barista', 'staff', 'friendly', 'croissant', 'pastry', 'service'] },
];

/**
 * Generates an insightful summary of user reviews.
 * Uses OpenAI API when OPENAI_API_KEY is configured, and falls back to deterministic theme analysis.
 */
export async function generateReviewSummary(
  shopName: string,
  reviews: ReviewInput[]
): Promise<string> {
  if (reviews.length === 0) {
    return `No guest reviews yet for ${shopName}. Be the first to share your experience on CoffeeMap!`;
  }

  const avg = (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1);

  if (process.env.OPENAI_API_KEY) {
    try {
      const reviewTexts = reviews
        .slice(0, 15)
        .map((r, i) => `Review ${i + 1} (${r.rating}/5): ${r.title ? `${r.title} - ` : ''}${r.comment}`)
        .join('\n');

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          temperature: 0.4,
          max_tokens: 160,
          messages: [
            {
              role: 'system',
              content:
                'Summarize coffee shop reviews concisely in 2 sentences highlighting strengths, coffee quality, and workspace/vibe suitability.',
            },
            {
              role: 'user',
              content: `Shop: ${shopName} (Avg: ${avg}/5 across ${reviews.length} reviews)\n\n${reviewTexts}`,
            },
          ],
        }),
      });

      if (response.ok) {
        const data = (await response.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        const aiText = data.choices?.[0]?.message?.content?.trim();
        if (aiText) return aiText;
      }
    } catch {
      // Fallback to deterministic analyzer
    }
  }

  return buildDeterministicSummary(shopName, reviews, Number(avg));
}

export function buildDeterministicSummary(
  shopName: string,
  reviews: ReviewInput[],
  avgRating?: number
): string {
  const avg =
    avgRating ?? Number((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1));
  const combined = reviews.map((r) => `${r.title ?? ''} ${r.comment}`.toLowerCase()).join(' ');

  const matchedThemes = THEME_KEYWORDS.filter((theme) =>
    theme.keywords.some((kw) => combined.includes(kw))
  ).map((t) => t.label);

  const sentiment =
    avg >= 4.5
      ? 'overwhelmingly positive'
      : avg >= 3.8
        ? 'consistently positive'
        : avg >= 3.0
          ? 'generally favorable'
          : 'mixed';

  const highlights =
    matchedThemes.length > 0
      ? matchedThemes.slice(0, 3).join(', ')
      : 'overall coffee quality and welcoming atmosphere';

  const caution = combined.includes('busy') || combined.includes('crowded')
    ? ' Note that some visitors mention peak-hour crowds.'
    : '';

  return `Reviews for ${shopName} are ${sentiment} (${avg}/5 across ${reviews.length} ${
    reviews.length === 1 ? 'review' : 'reviews'
  }). Visitors frequently highlight ${highlights}.${caution}`;
}
