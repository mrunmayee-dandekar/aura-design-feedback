export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Groq API key not configured on server." });
  }

  const { parts } = req.body;
  if (!parts || !Array.isArray(parts)) {
    return res.status(400).json({ error: "Invalid request body." });
  }

  // Separate image data and text from parts
  const imagePart = parts.find(p => p.inline_data);
  const textPart  = parts.find(p => p.text)?.text || "";

  if (imagePart && imagePart.inline_data.data.length > 6_000_000) {
    return res.status(413).json({ error: "Image is too large. Please upload a file under 4MB." });
  }

  const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

  // Build the user message content
  // Groq's vision model accepts image_url with base64
  const userContent = [];

  if (imagePart) {
    userContent.push({
      type: "image_url",
      image_url: {
        url: `data:${imagePart.inline_data.mime_type};base64,${imagePart.inline_data.data}`,
      },
    });
  }

  userContent.push({
    type: "text",
    text: textPart,
  });

  const systemPrompt = `You are Aura, a senior UX/UI design mentor. You give direct, warm, specific feedback. No filler words.
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
Always give feedback. Never say you cannot analyze the image. Max 500 words total.`;

  const body = JSON.stringify({
  model: "llama-4-maverick-17b-128e-instruct",
    max_tokens: 1200,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user",   content: userContent },
    ],
  });

  try {
    let groqRes, data;
    for (let attempt = 0; attempt < 3; attempt++) {
      groqRes = await fetch(GROQ_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body,
      });
      data = await groqRes.json();
      const overloaded = groqRes.status === 503 || groqRes.status === 429;
      if (!overloaded) break;
      if (attempt < 2) await new Promise(r => setTimeout(r, 800 * (attempt + 1)));
    }

    if (!groqRes.ok) {
      const msg = data?.error?.message || `Groq error ${groqRes.status}`;
      const friendly = (groqRes.status === 503 || groqRes.status === 429)
        ? "Groq is busy right now. Please try again in a moment."
        : msg;
      return res.status(groqRes.status).json({ error: friendly });
    }

    const text = data.choices?.[0]?.message?.content || "";
    if (!text) return res.status(500).json({ error: "Empty response from Groq." });

    return res.status(200).json({ text });

  } catch (e) {
    console.error("Groq fetch error:", e);
    return res.status(500).json({ error: "Failed to reach Groq API." });
  }
}
