async function fetchYouTubeVideo(topic, apiKey) {
  const query = encodeURIComponent(`${topic} UX UI design tutorial`);
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&type=video&maxResults=1&key=${apiKey}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    const item = data.items?.[0];
    if (!item) return null;
    return {
      title: item.snippet.title,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      channel: item.snippet.channelTitle,
      type: "video"
    };
  } catch { return null; }
}

async function fetchArticle(topic) {
  try {
    const query = encodeURIComponent(`${topic} UX design`);
    // Use a reliable search URL that always works
    const searchUrl = `https://www.google.com/search?q=${query}+site:nngroup.com+OR+site:smashingmagazine.com+OR+site:uxdesign.cc`;
    return {
      title: `${topic} — design article`,
      url: searchUrl,
      type: "article"
    };
  } catch { return null; }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GROQ_API_KEY;
  const ytApiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "Groq API key not configured on server." });
  }

  const { parts } = req.body;
  if (!parts || !Array.isArray(parts)) {
    return res.status(400).json({ error: "Invalid request body." });
  }

  const imagePart = parts.find(p => p.inline_data);
  const textPart  = parts.find(p => p.text)?.text || "";

  if (imagePart && imagePart.inline_data.data.length > 6_000_000) {
    return res.status(413).json({ error: "Image is too large. Please upload a file under 4MB." });
  }

  const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

  const userContent = [];
  if (imagePart) {
    userContent.push({
      type: "image_url",
      image_url: { url: `data:${imagePart.inline_data.mime_type};base64,${imagePart.inline_data.data}` },
    });
  }
  userContent.push({ type: "text", text: textPart });

  const systemPrompt = `You are Aura, a senior UX/UI design mentor. You give direct, warm, specific feedback. No filler words.
You MUST respond in EXACTLY this structure — always include all three sections, always have bullets in each:

## What's Landing Well
- [2-3 bullets: specific things that are working well in this design]

## What Needs Your Attention
- [3-4 bullets: specific issues, each starting with: IssueName: explanation of what to fix and why]

## Level Up: Topics
- [Provide exactly 3 short topic keywords related to the issues you found, one per line, in this format:]
- TOPIC: typography hierarchy
- TOPIC: colour contrast accessibility
- TOPIC: visual spacing layout
- TOPIC: mobile navigation patterns
- TOPIC: visual feedback interactions

Topics must be 2-4 words, specific to actual design issues found. Provide exactly 5 topics. No URLs, no descriptions, just the topic keyword after TOPIC:

  const body = JSON.stringify({
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
    max_tokens: 800,
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

    // Extract TOPIC keywords from the response
    const topicMatches = [...text.matchAll(/TOPIC:\s*(.+)/gi)];
    const topics = topicMatches.map(m => m[1].trim()).slice(0, 5);

    // Fetch real resources for each topic in parallel
    let resources = [];
    if (topics.length > 0) {
      const resourcePromises = topics.map(async (topic) => {
        const [video, article] = await Promise.all([
          ytApiKey ? fetchYouTubeVideo(topic, ytApiKey) : null,
          fetchArticle(topic)
        ]);
        return { topic, video, article };
      });

      const results = await Promise.all(resourcePromises);

      // Build resource list: 3 videos first, then 2 articles
    const videos = results.map(r => r.video).filter(Boolean);
    const articles = results.map(r => r.article).filter(Boolean);

    // Take up to 3 videos and 2 articles
    resources = [
      ...videos.slice(0, 3),
      ...articles.slice(0, 2)
    ];

    // If no YouTube key, fall back to YouTube search URLs
    if (!ytApiKey) {
      results.slice(0, 3).forEach(({ topic }) => {
        const query = encodeURIComponent(`${topic} UX UI design`);
        resources.push({
          title: `${topic} — YouTube search`,
          url: `https://www.youtube.com/results?search_query=${query}`,
          type: "video"
        });
      });
    }
    }

    return res.status(200).json({ text, resources });

  } catch (e) {
    console.error("Groq fetch error:", e);
    return res.status(500).json({ error: e?.message || "Failed to reach Groq API." });
  }
}
