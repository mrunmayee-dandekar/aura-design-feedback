import { useState, useRef, useCallback, useEffect } from "react";
import "./Aura.css";

const QS = [
  {key:"stage",lbl:"What stage is this?",opts:["Early sketch","Mid-fidelity","Final polish","Just exploring"]},
  {key:"type", lbl:"Type of design?",    opts:["Mobile app","Website / web app","Wireframe","Branding / identity","Other"]},
  {key:"focus",lbl:"Where should I look?",opts:["Everywhere — full critique","Hierarchy & layout","Typography","Colour & contrast","User flow"]},
];
const MSGS = ["Reading your design…","Spotting patterns…","Thinking like a mentor…","Writing your feedback…"];

// More flexible heading matcher — handles Gemini's slight phrasing variations
function bullets(text, keywords) {
  const kwPattern = keywords.join("|");
  const m = text.match(
    new RegExp(`#{1,6}[^\\n]*(${kwPattern})[^\\n]*\\n([\\s\\S]*?)(?=\\n\\s*#{1,6}\\s|$)`, "i")
  );
  if (!m) return [];
  return m[2]
    .split("\n")
    .map(l => l.replace(/^\s*[-•*]\s+|^\s*\d+\.\s+/, "").replace(/\*\*/g, "").trim())
    .filter(l => l.length > 6);
}

function parseResources(resources) {
  if (!resources || !Array.isArray(resources)) return [];
  return resources.map(r => ({
    label: r.title || "",
    desc: r.channel || r.type || "",
    url: r.url || null,
    type: r.type || "article"
  }));
}

    const clean = line
      .replace(/\s*\|\s*SEARCH:\s*.+$/i, "")
      .replace(/\s*\|\s*URL:\s*https?:\/\/[^\s|]+/i, "")
      .trim();

    const colonIdx = clean.indexOf(":");
    if (colonIdx !== -1) {
      return { label: clean.slice(0, colonIdx).trim(), desc: clean.slice(colonIdx + 1).trim(), url };
    }
    return { label: clean, desc: "", url };
  });
}

function isValidUrl(str) {
  try {
    const url = new URL(str);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function ExtIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" style={{display:"inline-block",verticalAlign:"middle"}}>
      <path d="M2 10L10 2M10 2H5M10 2V7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default function Aura() {
  const [view, setView]         = useState("landing");
  const [tab, setTab]           = useState("image");
  const [imgUrl, setImgUrl]     = useState(null);
  const [imgData, setImgData]   = useState(null);
  const [siteUrl, setSiteUrl]   = useState("");
  const [ans, setAns]           = useState({stage:null,type:null,focus:null});
  const [fb, setFb]             = useState(null);
  const [drag, setDrag]         = useState(false);
  const [mi, setMi]             = useState(0);
  const [err, setErr]           = useState(null);
const [uploaded, setUploaded] = useState(false);

  const fRef = useRef(null);
  const tmr  = useRef(null);

  useEffect(() => () => { if (tmr.current) clearInterval(tmr.current); }, []);

  const handleFile = useCallback((file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErr("That file type isn't supported. Please upload PNG, JPG, WEBP, or GIF.");
      return;
    }
    const r = new FileReader();
  r.onload = (e) => {
      const url = e.target.result;
      const [h, d] = url.split(",");
      const mimeMatch = h?.match(/:(.*?);/);
      if (!mimeMatch) {
        setErr("Couldn't read that file. Try a different image.");
        return;
      }
      setErr(null);
      setSiteUrl("");
      setImgUrl(url);
      setImgData({ base64: d, mediaType: mimeMatch[1] });
      setUploaded(true);
      if (fRef.current) fRef.current.value = "";
      setTimeout(() => {
        setUploaded(false);
        setView("questions");
      }, 1000);
    };
    r.onerror = () => setErr("Couldn't read that file. Try a different image.");
    r.readAsDataURL(file);
  }, []);

  const switchTab = (next) => {
    setTab(next);
    setErr(null);
    if (next === "image") {
      setSiteUrl("");
    } else {
      setImgUrl(null);
      setImgData(null);
    }
  };

  const goToQuestionsFromUrl = () => {
    const trimmed = siteUrl.trim();
    if (!trimmed) return;
    // Prepend https:// if missing, then validate
    const withProtocol = trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
    if (!isValidUrl(withProtocol)) {
      setErr("Please enter a valid URL, e.g. https://yoursite.com");
      return;
    }
    setSiteUrl(withProtocol);
    setImgUrl(null);
    setImgData(null);
    setErr(null);
    setView("questions");
  };

  const ok = Object.values(ans).every(Boolean);

  const analyze = async () => {
    // Guard: clear any existing interval before starting a new one
    if (tmr.current) clearInterval(tmr.current);

    setView("analyzing");
    setErr(null);
    setMi(0);
    tmr.current = setInterval(() => setMi(i => (i + 1) % MSGS.length), 1800);

    try {
      const parts = [];
      if (imgData) {
        parts.push({ inline_data: { mime_type: imgData.mediaType, data: imgData.base64 } });
        parts.push({ text: `Please analyze this UI design screenshot carefully.\nDesign type: ${ans.type} | Stage: ${ans.stage} | Focus area: ${ans.focus}\n\nLook at every visible element — layout, typography, colors, spacing, components, hierarchy. Give ALL three sections of feedback.` });
      } else {
        parts.push({ text: `Analyze the UX/UI design of this product/website: ${siteUrl}\nDesign type: ${ans.type} | Design stage: ${ans.stage} | Focus area: ${ans.focus}\n\nProvide specific, actionable feedback based on this type of product. Give ALL three sections.` });
      }

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parts }),
      });

      clearInterval(tmr.current);

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `Server error ${res.status}`);

      const text = data.text || "";
      if (!text) throw new Error("No response received. Please try again.");

      const good = bullets(text, ["Landing Well", "Working Well", "Strengths"]);
      const attn = bullets(text, ["Needs", "Attention", "Improve", "Issues"]);
      const res2 = parseResources(data.resources);

      if (!good.length && !attn.length) {
        throw new Error("Couldn't parse the AI response. Please try again.");
      }

      setFb({ good, attn, res: res2 });
      setView("results");

    } catch (e) {
      clearInterval(tmr.current);
      setErr(e.message || "Something went wrong. Please try again.");
      setView("questions");
    }
  };

  const reset = () => {
    setView("landing");
    setImgUrl(null);
    setImgData(null);
    setSiteUrl("");
    setAns({stage:null,type:null,focus:null});
    setFb(null);
    setErr(null);
  };

  return (
    <div className="aura">
      <div className="blobs">
        <div className="blob b-pk"/><div className="blob b-pk2"/>
        <div className="blob b-yl"/><div className="blob b-bl"/>
        <div className="blob b-lv"/><div className="blob b-pc"/>
      </div>

      <div className="sticky-header">
        <nav>
          <div className="n-logo" onClick={reset}>
  <img
    src="/aura-logo.png"
    alt="Aura"
    style={{height:"38px", width:"auto", display:"block"}}
  />
  <span style={{
    fontFamily: "'Bricolage Grotesque', sans-serif",
    fontWeight: 700,
    fontSize: "28px",
    color: "var(--black)",
    letterSpacing: "-0.5px",
    lineHeight: 1
  }}>
    Aura<span style={{color: "var(--blue)"}}>.</span>
  </span>
</div>
          <span className="n-badge">Design Feedback</span>
        </nav>
      </div>

      <main>
        {view === "landing" && (
          <div className="land">
            <p className="eyebrow">AI design critique. No setup required.</p>
            <h1 className="h1">Drop your design.<br/>Get <em>real</em> feedback.</h1>
            <p className="sub">Mentor level critique in seconds. No prompts, no setup, no fluff.</p>
            <div className="pill-toggle">
              <button className={`pill-btn${tab==="image"?" on":""}`} onClick={()=>switchTab("image")}>Upload Image</button>
              <button className={`pill-btn${tab==="url"?" on":""}`} onClick={()=>switchTab("url")}>Paste a URL</button>
            </div>
            {tab === "image" && (
            <div
  className={`icard${drag?" drag":""}`}
  onDrop={e=>{e.preventDefault();setDrag(false);handleFile(e.dataTransfer.files[0]);}}
  onDragOver={e=>{e.preventDefault();setDrag(true);}}
  onDragLeave={()=>setDrag(false)}
  onClick={e=>{e.stopPropagation();fRef.current?.click();}}
>
  <input
    ref={fRef}
    type="file"
    accept="image/*"
    aria-label="Upload design image"
    style={{display:"none"}}
    onChange={e=>handleFile(e.target.files[0])}
  />
                {uploaded ? (
                  <>
                    <div className="d-icon" style={{background:"rgba(111,201,138,0.15)"}}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6FC98A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </div>
                    <p className="d-title" style={{color:"#6FC98A"}}>Image uploaded!</p>
                    <p className="d-sub">Taking you to the next step…</p>
                  </>
                ) : (
                  <>
                    <div className="d-icon">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#BBB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
                      </svg>
                    </div>
                    <p className="d-title">Drop your design here</p>
                    <p className="d-sub">or click to browse your files</p>
                    <div className="d-fmts">{["PNG","JPG","WEBP","GIF","Screenshot"].map(f=><span className="d-fmt" key={f}>{f}</span>)}</div>
                  </>
                )}
              </div>
            )}
            {tab === "url" && (
              <div className="url-card" onClick={e=>e.stopPropagation()}>
                <p className="url-lbl">Website or design URL</p>
                <input
                  className="url-inp" type="text" placeholder="https://yourdesign.com"
                  value={siteUrl} onChange={e=>setSiteUrl(e.target.value)}
                  onKeyDown={e=>{ if (e.key==="Enter") goToQuestionsFromUrl(); }}
                />
                <button className="url-go" disabled={!siteUrl.trim()} onClick={goToQuestionsFromUrl}>
                  Analyse this →
                </button>
              </div>
            )}
            {err && <p className="err">{err}</p>}
          </div>
        )}

        {view === "questions" && (
          <div className="qpage">
            <h2 className="q-h">Three quick questions.</h2>
            <p className="q-s">Shapes how Aura reads your work. Ten seconds.</p>
            {QS.map((q, qi) => (
              <div className="qg" key={q.key} style={{animationDelay:`${0.06+qi*0.14}s`}}>
                <p className="q-lbl">{q.lbl}</p>
                <div className="chips">
                  {q.opts.map(c => (
                    <button key={c} className={`chip${ans[q.key]===c?" on":""}`} onClick={()=>setAns(p=>({...p,[q.key]:c}))}>{c}</button>
                  ))}
                </div>
              </div>
            ))}
            <button className="btn-go" style={{animationDelay:"0.5s"}} disabled={!ok} onClick={analyze}>
              Analyze my design →
            </button>
            {err && <p className="err">{err}</p>}
          </div>
        )}

        {view === "analyzing" && (
          <div className="apage">
            <div className="spin">
              <span/><span/><span/>
            </div>
            <p className="a-msg" key={mi}>{MSGS[mi]}</p>
          </div>
        )}

        {view === "results" && fb && (
          <div className="rpage">
            <p className="r-eye">Feedback ready</p>
            <h2 className="r-h">Here's what <em>Aura</em> sees.</h2>

            <div className="fcard" style={{animationDelay:"0.1s"}}>
              <div className="c-hd"><div className="c-bar bg"/><h3 className="c-ttl">✦ What's Landing Well</h3></div>
              <ul className="blist">
                {(fb.good||[]).map((b,i)=>(
                  <li className="bitem" key={i}><span className="bdot dg"/><span>{b}</span></li>
                ))}
              </ul>
            </div>

            <div className="fcard" style={{animationDelay:"0.4s"}}>
              <div className="c-hd"><div className="c-bar ba"/><h3 className="c-ttl">✦ What Needs Your Attention</h3></div>
              <ul className="blist">
                {(fb.attn||[]).map((b,i)=>(
                  <li className="bitem" key={i}><span className="bdot da"/><span>{b}</span></li>
                ))}
              </ul>
            </div>

            <div className="fcard" style={{animationDelay:"0.75s"}}>
              <div className="c-hd"><div className="c-bar bb"/><h3 className="c-ttl">✦ Level Up: Resources</h3></div>
              <ul className="blist">
                {(fb.res||[]).map((r,i)=>(
                  <li className="bitem" key={i}>
                    <span className="bdot db"/>
                    <span>
                      <span style={{
                        fontSize:"10px",
                        fontWeight:600,
                        padding:"2px 7px",
                        borderRadius:"100px",
                        marginRight:"8px",
                        background: r.type==="video" ? "rgba(255,80,80,0.1)" : "rgba(84,182,252,0.1)",
                        color: r.type==="video" ? "#e03030" : "#2a7fc9",
                        letterSpacing:"0.04em"
                      }}>
                        {r.type === "video" ? "▶ VIDEO" : "✦ ARTICLE"}
                      </span>
                      {r.url
                        ? <a className="res-link" href={r.url} target="_blank" rel="noopener noreferrer">{r.label} <ExtIcon/></a>
                        : <strong>{r.label}</strong>
                      }
                      {r.desc && <span className="res-desc"> — {r.desc}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <button className="btn-back" onClick={reset}>← Analyze another design</button>
          </div>
        )}
      </main>
    </div>
  );
}
