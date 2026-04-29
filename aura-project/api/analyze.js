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

  const inlineData = parts.find(p => p.inline_data)?.inline_data?.data;
  if (inlineData && inlineData.length > 6_000_000) {
    return res.status(413).json({ error: "Image is too large. Please upload a file under 4MB." });
  }

  const MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";
  const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;

  const body = JSON.stringify({
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
  });

  try {
    let geminiRes, data;
    for (let attempt = 0; attempt < 3; attempt++) {
      geminiRes = await fetch(GEMINI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });
      data = await geminiRes.json();
      const overloaded = geminiRes.status === 503 || geminiRes.status === 429;
      if (!overloaded) break;
      if (attempt < 2) await new Promise(r => setTimeout(r, 800 * (attempt + 1)));
    }

    if (!geminiRes.ok) {
      const msg = data?.error?.message || `Gemini error ${geminiRes.status}`;
      const friendly = (geminiRes.status === 503 || geminiRes.status === 429)
        ? "Gemini is busy right now. Please try again in a moment."
        : msg;
      return res.status(geminiRes.status).json({ error: friendly });
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return res.status(200).json({ text });

  } catch (e) {
    console.error("Gemini fetch error:", e);
    return res.status(500).json({ error: "Failed to reach Gemini API." });
  }
}
