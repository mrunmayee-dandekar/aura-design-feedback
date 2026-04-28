# Aura — Design Feedback

AI-powered UX/UI critique tool. Users get instant feedback with no API key required.

## Deploy to Vercel (5 minutes)

### 1. Get your free Gemini API key
Go to https://aistudio.google.com/apikey → Sign in with Google → Create API key → Copy it

### 2. Push to GitHub
- Create a new repo on github.com
- Upload all these files (drag & drop works fine)

### 3. Deploy on Vercel
- Go to https://vercel.com → Sign up free with GitHub
- Click "Add New Project" → Import your GitHub repo
- Before clicking Deploy, go to **Environment Variables** and add:
  - Name: `GEMINI_API_KEY`
  - Value: your AIza... key
- Click Deploy

That's it. Your site is live. Users visit it and use it — no key needed on their end.

## Project structure
```
aura-project/
├── api/
│   └── analyze.js       ← Serverless function (your key lives here, hidden)
├── src/
│   ├── main.jsx         ← React entry point
│   └── Aura.jsx         ← Main app component
├── index.html
├── package.json
├── vite.config.js
└── vercel.json
```

## How it works
- Frontend (Aura.jsx) calls `/api/analyze` — your own server
- `api/analyze.js` runs on Vercel's servers, reads `GEMINI_API_KEY` from env
- Calls Gemini, returns the result
- Your API key is never sent to the browser
