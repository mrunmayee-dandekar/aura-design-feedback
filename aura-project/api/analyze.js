export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Gemini API key not configured on server." });
  }

  const { parts } = req.body;
  if (!parts || !Array.isArray(parts)) {
    return res.status(400).json({ error: "Invalid request body." });
  }

  try {
    const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

    const geminiRes = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: {
          parts: [{
            text: `You are Aura, a senior UX/UI design mentor. You give direct, warm, specific feedback. No filler words.

You MUST respond in EXACTLY this structure — always include all three sections, always have bullets in each:

## What's Landing Well
- [2-3 bullets: specific things that are working well in this design]

## What Needs Your Attention
- [3-4 bullets: specific issues, each starting with: IssueName: explanation of what to fix and why]

## Level Up: Resources
- [3-4 bullets: real, specific resources directly related to the issues you identified]
- Each bullet MUST follow this EXACT format: Title — Source: one sentence description | URL: https://full-url-here
- Use ONLY real URLs from well-known design resources like: nngroup.com, smashingmagazine.com, web.dev, css-tricks.com, learnui.design, refactoringui.com, baymard.com, lukew.com, alistapart.com, abookapart.com, designsystems.com
- URLs must be real article pages, not homepages

Always give feedback. Never say you cannot analyze the image. Max 500 words total.`
          }]
        },
        contents: [{ role: "user", parts }],
        generationConfig: { maxOutputTokens: 1200 },
      }),
    });

    const data = await geminiRes.json();

    if (!geminiRes.ok) {
      return res.status(geminiRes.status).json({
        error: data?.error?.message || `Gemini error ${geminiRes.status}`
      });
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return res.status(200).json({ text });

  } catch (e) {
    console.error("Gemini fetch error:", e);
    return res.status(500).json({ error: "Failed to reach Gemini API." });
  }
}
