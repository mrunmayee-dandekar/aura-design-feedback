import { useState, useRef, useCallback, useEffect } from "react";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Epilogue:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600;1,700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{--f:'Epilogue',system-ui,sans-serif;--bg:#FAFAFA;--black:#111;--gray:#424242;--border:#EBEBEB;--blue:#84b6fc;--white:#FFF;--snav:0px 2px 2px 0px rgba(0,0,0,0.12);--scard:0px 2px 1px 0px rgba(0,0,0,0.20);}
.aura{font-family:var(--f);background:var(--bg);color:var(--black);min-height:100vh;position:relative;}
.blobs{position:fixed;inset:0;z-index:0;pointer-events:none;overflow:hidden;}
.blob{position:absolute;border-radius:50%;filter:blur(80px);will-change:transform;}
.b-pk{width:620px;height:420px;top:220px;left:-200px;background:radial-gradient(ellipse at center,#FFB7CC 0%,#FFC8D8 40%,transparent 75%);opacity:0.55;animation:bf1 22s ease-in-out infinite;}
.b-pk2{width:480px;height:320px;top:520px;left:-80px;background:radial-gradient(ellipse at center,#FFD6E0 0%,#FFBFCC 40%,transparent 72%);opacity:0.50;animation:bf2 19s ease-in-out infinite;}
.b-yl{width:680px;height:220px;top:600px;left:-160px;background:radial-gradient(ellipse at center,#FFF3A0 0%,#FFE87A 40%,transparent 72%);opacity:0.45;animation:bf3 25s ease-in-out infinite;}
.b-bl{width:680px;height:420px;top:300px;right:-200px;background:radial-gradient(ellipse at center,#B8D8FF 0%,#A0CAFF 45%,transparent 75%);opacity:0.50;animation:bf4 20s ease-in-out infinite;}
.b-lv{width:700px;height:300px;top:520px;right:-320px;background:radial-gradient(ellipse at center,#C8D8FF 0%,#B0C4FF 40%,transparent 72%);opacity:0.45;animation:bf5 24s ease-in-out infinite;}
.b-pc{width:500px;height:280px;top:-40px;right:-100px;background:radial-gradient(ellipse at center,#FFE4B0 0%,#FFD898 40%,transparent 72%);opacity:0.45;animation:bf6 21s ease-in-out infinite;}
@keyframes bf1{0%,100%{transform:translate(0,0)}50%{transform:translate(40px,-30px)}}
@keyframes bf2{0%,100%{transform:translate(0,0)}50%{transform:translate(30px,40px)}}
@keyframes bf3{0%,100%{transform:translate(0,0)}50%{transform:translate(50px,-20px)}}
@keyframes bf4{0%,100%{transform:translate(0,0)}50%{transform:translate(-40px,-30px)}}
@keyframes bf5{0%,100%{transform:translate(0,0)}50%{transform:translate(-50px,30px)}}
@keyframes bf6{0%,100%{transform:translate(0,0)}50%{transform:translate(-30px,40px)}}

/* Sticky header wrapper — contains nav, sticks to top */
.sticky-header{position:sticky;top:0;z-index:100;}

nav{height:80px;display:flex;align-items:center;justify-content:space-between;padding:0 48px;background:rgba(255,255,255,0.88);backdrop-filter:blur(20px);box-shadow:var(--snav);}
.n-logo{display:flex;align-items:center;gap:10px;cursor:pointer;}
.n-mark{width:38px;height:40px;flex-shrink:0;display:flex;align-items:center;justify-content:center;}
.n-word{font-family:var(--f);font-size:32px;font-weight:600;color:var(--black);letter-spacing:-0.64px;line-height:1;}
.n-dot{color:var(--blue);}
.n-badge{display:flex;align-items:center;justify-content:center;padding:10px 16px 8px;border:1.25px solid var(--black);border-radius:100px;font-size:16px;font-weight:400;color:var(--black);white-space:nowrap;}
main{position:relative;z-index:1;}
.land{display:flex;flex-direction:column;align-items:center;padding:68px 24px 80px;min-height:calc(100vh - 80px);}
.eyebrow{font-size:18px;font-weight:600;color:var(--gray);opacity:.8;letter-spacing:-0.36px;margin-bottom:18px;text-align:center;}
.h1{font-family:var(--f);font-size:clamp(42px,6vw,60px);font-weight:600;line-height:1.2;text-align:center;color:var(--black);letter-spacing:-1.2px;margin-bottom:24px;}
.h1 em{font-style:italic;font-weight:600;}
.sub{font-size:18px;font-weight:600;color:var(--gray);opacity:.8;text-align:center;max-width:492px;line-height:1.5;letter-spacing:-0.36px;margin-bottom:48px;}
.pill-toggle{display:flex;align-items:center;background:var(--white);border:1px solid var(--border);border-radius:100px;box-shadow:var(--scard);padding:6px;margin-bottom:24px;width:300px;}
.pill-btn{flex:1;height:44px;border:none;border-radius:100px;font-family:var(--f);font-size:16px;font-weight:500;letter-spacing:-0.32px;cursor:pointer;transition:all .22s;background:transparent;color:var(--black);}
.pill-btn.on{background:var(--black);color:var(--white);}
.icard{width:100%;max-width:529px;min-height:280px;background:var(--white);border:1px solid var(--border);border-radius:16px;box-shadow:var(--scard);display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative;overflow:hidden;padding:40px 36px;cursor:pointer;transition:all .28s;}
.icard.drag,.icard:hover{border-color:#C8C0D8;box-shadow:0 4px 24px rgba(0,0,0,.1);}
.icard input[type=file]{position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%;}
.d-icon{width:52px;height:52px;border-radius:50%;background:rgba(0,0,0,.04);display:flex;align-items:center;justify-content:center;margin-bottom:16px;}
.d-title{font-size:18px;font-weight:600;color:var(--black);letter-spacing:-0.36px;margin-bottom:8px;text-align:center;}
.d-sub{font-size:14px;font-weight:400;color:#AAA;text-align:center;line-height:1.6;}
.d-fmts{display:flex;gap:6px;flex-wrap:wrap;justify-content:center;margin-top:20px;}
.d-fmt{font-size:11px;padding:3px 11px;border-radius:100px;background:rgba(0,0,0,.04);color:#CCC;letter-spacing:.04em;}
.url-card{width:100%;max-width:529px;min-height:280px;background:var(--white);border:1px solid var(--border);border-radius:16px;box-shadow:var(--scard);display:flex;flex-direction:column;justify-content:center;padding:40px 36px;gap:16px;transition:all .28s;}
.url-card:focus-within{border-color:#C8C0D8;box-shadow:0 4px 24px rgba(0,0,0,.1);}
.url-lbl{font-size:11px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:#BBB;}
.url-inp{width:100%;border:none;border-bottom:1.5px solid var(--border);background:transparent;outline:none;padding-bottom:10px;font-family:var(--f);font-size:16px;font-weight:400;color:var(--black);letter-spacing:-0.2px;}
.url-inp::placeholder{color:#D0D0D0;}
.url-inp:focus{border-bottom-color:#AAA;}
.url-go{align-self:flex-end;padding:10px 28px;border-radius:100px;background:var(--black);border:none;font-family:var(--f);font-size:14px;font-weight:500;color:var(--white);cursor:pointer;transition:all .2s;letter-spacing:-0.2px;}
.url-go:hover:not(:disabled){background:#333;transform:translateY(-1px);}
.url-go:disabled{opacity:.25;cursor:not-allowed;}
.qpage{display:flex;flex-direction:column;align-items:center;padding:64px 24px 80px;min-height:calc(100vh - 80px);}
.q-thumb{width:220px;height:148px;background:var(--white);border:1px solid var(--border);border-radius:16px;box-shadow:var(--scard);overflow:hidden;margin-bottom:44px;display:flex;align-items:center;justify-content:center;}
.q-thumb img{width:100%;height:100%;object-fit:cover;display:block;}
.q-thumb-url{flex-direction:column;gap:8px;padding:16px;}
.q-url-t{font-size:11px;color:#BBB;max-width:180px;text-align:center;word-break:break-all;line-height:1.5;}
.q-h{font-family:var(--f);font-size:32px;font-weight:600;letter-spacing:-0.64px;text-align:center;margin-bottom:8px;}
.q-s{font-size:16px;font-weight:400;color:#AAA;text-align:center;margin-bottom:40px;}
.qg{width:100%;max-width:529px;margin-bottom:28px;opacity:0;animation:up .5s ease forwards;}
.q-lbl{font-size:11px;font-weight:600;color:#AAA;letter-spacing:.1em;text-transform:uppercase;margin-bottom:12px;}
.chips{display:flex;flex-wrap:wrap;gap:8px;}
.chip{padding:9px 20px;border-radius:100px;border:1px solid var(--border);background:var(--white);font-family:var(--f);font-size:14px;font-weight:500;color:#666;cursor:pointer;transition:all .16s;box-shadow:var(--scard);letter-spacing:-0.2px;}
.chip:hover{border-color:#AAA;color:var(--black);}
.chip.on{background:var(--black);color:var(--white);border-color:var(--black);}
.btn-go{margin-top:12px;padding:14px 52px;border-radius:100px;background:var(--black);color:var(--white);border:none;font-family:var(--f);font-size:16px;font-weight:500;letter-spacing:-0.32px;cursor:pointer;transition:all .22s;opacity:0;animation:up .5s ease forwards;}
.btn-go:hover:not(:disabled){background:#333;transform:translateY(-2px);box-shadow:0 8px 28px rgba(0,0,0,.15);}
.btn-go:disabled{opacity:.22;cursor:not-allowed;transform:none;}
.apage{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:calc(100vh - 80px);gap:28px;animation:fi .4s ease;}
.spin{width:52px;height:52px;border-radius:50%;border:1.5px solid transparent;border-top-color:var(--black);border-right-color:rgba(0,0,0,.15);animation:spin .9s linear infinite;}
@keyframes spin{to{transform:rotate(360deg)}}
.a-msg{font-size:20px;font-weight:600;font-style:italic;color:#AAA;letter-spacing:-0.4px;animation:fi .36s ease;}
.rpage{display:flex;flex-direction:column;align-items:center;padding:68px 24px 80px;min-height:calc(100vh - 80px);animation:fi .6s ease;}
.r-eye{font-size:14px;font-weight:500;color:#BBB;letter-spacing:.04em;text-align:center;margin-bottom:10px;}
.r-h{font-family:var(--f);font-size:clamp(30px,4vw,40px);font-weight:600;letter-spacing:-0.8px;text-align:center;margin-bottom:48px;}
.r-h em{font-style:italic;}
.fcard{width:100%;max-width:620px;background:var(--white);border:1px solid var(--border);border-radius:16px;padding:28px 32px;margin-bottom:14px;box-shadow:var(--scard);opacity:0;animation:up .65s ease forwards;}
.c-hd{display:flex;align-items:center;gap:14px;margin-bottom:20px;}
.c-bar{width:3px;height:26px;border-radius:4px;flex-shrink:0;}
.bg{background:linear-gradient(180deg,#6FC98A,#4AB870);}
.ba{background:linear-gradient(180deg,#F0B840,#E59020);}
.bb{background:linear-gradient(180deg,#84b6fc,#4A9FE0);}
.c-ttl{font-size:17px;font-weight:600;letter-spacing:-0.34px;}
.blist{list-style:none;padding:0;}
.bitem{display:flex;gap:12px;padding:10px 0;border-bottom:1px solid rgba(0,0,0,.05);align-items:flex-start;font-size:14px;font-weight:400;line-height:1.66;color:#3A3A3A;}
.bitem:last-child{border-bottom:none;padding-bottom:0;}
.bdot{width:6px;height:6px;border-radius:50%;margin-top:8px;flex-shrink:0;}
.dg{background:#6FC98A;}.da{background:#F0B840;}.db{background:#84b6fc;}
.res-link{display:inline-flex;align-items:center;gap:4px;color:#3a86e8;font-weight:600;text-decoration:none;border-bottom:1.5px solid rgba(58,134,232,0.22);padding-bottom:1px;transition:all .16s;word-break:break-word;}
.res-link:hover{color:#1a5fba;border-bottom-color:rgba(26,95,186,0.55);}
.res-link svg{flex-shrink:0;margin-bottom:1px;}
.res-desc{color:#666;font-weight:400;}
.btn-back{margin-top:40px;padding:12px 38px;border-radius:100px;border:1px solid var(--border);background:var(--white);box-shadow:var(--scard);font-family:var(--f);font-size:14px;font-weight:500;color:#AAA;cursor:pointer;transition:all .22s;opacity:0;animation:up .5s ease 1.4s forwards;letter-spacing:-0.2px;}
.btn-back:hover{border-color:#888;color:var(--black);}
.err{background:rgba(200,60,60,.05);border:1px solid rgba(200,60,60,.15);border-radius:12px;padding:14px 22px;font-size:14px;color:#B04040;max-width:520px;text-align:center;margin-top:20px;}
@keyframes fi{from{opacity:0}to{opacity:1}}
@keyframes up{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}}
`;

const QS = [
  {key:"stage",lbl:"What stage is this?",opts:["Early sketch","Mid-fidelity","Final polish","Just exploring"]},
  {key:"type", lbl:"Type of design?",    opts:["Mobile app","Website / web app","Wireframe","Branding / identity","Other"]},
  {key:"focus",lbl:"Where should I look?",opts:["Everywhere — full critique","Hierarchy & layout","Typography","Colour & contrast","User flow"]},
];
const MSGS = ["Reading your design…","Spotting patterns…","Thinking like a mentor…","Writing your feedback…"];

const SYSTEM_PROMPT = `You are Aura, a senior UX/UI design mentor. You give direct, warm, specific feedback. No filler words.

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

function bullets(text, kw) {
  const m = text.match(new RegExp(`##[^#\\n]*${kw}[^#\\n]*\\n([\\s\\S]*?)(?=\\n##|$)`, "i"));
  if (!m) return [];
  return m[1]
    .split("\n")
    .map(l => l.replace(/^[-•*\d.]+\s*/, "").replace(/\*\*/g, "").trim())
    .filter(l => l.length > 6);
}

function parseResources(text) {
  const raw = bullets(text, "Resources");
  return raw.map(line => {
    const urlMatch = line.match(/\|\s*URL:\s*(https?:\/\/[^\s|]+)/i);
    const url = urlMatch ? urlMatch[1].replace(/[.,)>]+$/, "") : null;
    const clean = line.replace(/\s*\|\s*URL:\s*https?:\/\/[^\s|]+/i, "").trim();
    const colonIdx = clean.indexOf(":");
    if (colonIdx !== -1) {
      return { label: clean.slice(0, colonIdx).trim(), desc: clean.slice(colonIdx + 1).trim(), url };
    }
    return { label: clean, desc: "", url };
  });
}


function LogoMark() {
  return (
    <svg width="38" height="40" viewBox="0 0 38 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="19" cy="20" r="14" stroke="#111" strokeWidth="2.2"/>
      <circle cx="19" cy="20" r="6" fill="#111"/>
      <line x1="19" y1="2" x2="19" y2="8" stroke="#111" strokeWidth="2.2" strokeLinecap="round"/>
      <line x1="19" y1="32" x2="19" y2="38" stroke="#111" strokeWidth="2.2" strokeLinecap="round"/>
      <line x1="2" y1="20" x2="8" y2="20" stroke="#111" strokeWidth="2.2" strokeLinecap="round"/>
      <line x1="30" y1="20" x2="36" y2="20" stroke="#111" strokeWidth="2.2" strokeLinecap="round"/>
    </svg>
  );
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

  const fRef = useRef(null);
  const tmr  = useRef(null);

  useEffect(() => {
    const s = document.createElement("style");
    s.textContent = CSS;
    document.head.appendChild(s);
    return () => document.head.removeChild(s);
  }, []);


  const handleFile = useCallback((file) => {
    if (!file?.type.startsWith("image/")) return;
    const r = new FileReader();
    r.onload = (e) => {
      const url = e.target.result;
      const [h, d] = url.split(",");
      setImgUrl(url);
      setImgData({ base64: d, mediaType: h.match(/:(.*?);/)[1] });
      setView("questions");
    };
    r.readAsDataURL(file);
  }, []);

  const ok = Object.values(ans).every(Boolean);

  const analyze = async () => {
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

      const good = bullets(text, "Landing Well");
      const attn = bullets(text, "Needs");
      const res2 = parseResources(text);

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

      {/* ── Sticky header: nav only ── */}
      <div className="sticky-header">
        <nav>
          <div className="n-logo" onClick={reset}>
            <div className="n-mark"><LogoMark/></div>
            <span className="n-word">Aura<span className="n-dot">.</span></span>
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
              <button className={`pill-btn${tab==="image"?" on":""}`} onClick={()=>setTab("image")}>Upload Image</button>
              <button className={`pill-btn${tab==="url"?" on":""}`} onClick={()=>setTab("url")}>Paste a URL</button>
            </div>
            {tab === "image" && (
              <div
                className={`icard${drag?" drag":""}`}
                onDrop={e=>{e.preventDefault();setDrag(false);handleFile(e.dataTransfer.files[0]);}}
                onDragOver={e=>{e.preventDefault();setDrag(true);}}
                onDragLeave={()=>setDrag(false)}
                onClick={()=>fRef.current?.click()}
              >
                <input ref={fRef} type="file" accept="image/*" onChange={e=>handleFile(e.target.files[0])}/>
                <div className="d-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#BBB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
                  </svg>
                </div>
                <p className="d-title">Drop your design here</p>
                <p className="d-sub">or click to browse your files</p>
                <div className="d-fmts">{["PNG","JPG","WEBP","GIF","Screenshot"].map(f=><span className="d-fmt" key={f}>{f}</span>)}</div>
              </div>
            )}
            {tab === "url" && (
              <div className="url-card" onClick={e=>e.stopPropagation()}>
                <p className="url-lbl">Website or design URL</p>
                <input
                  className="url-inp" type="text" placeholder="https://yourdesign.com"
                  value={siteUrl} onChange={e=>setSiteUrl(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&siteUrl.trim()&&setView("questions")}
                />
                <button className="url-go" disabled={!siteUrl.trim()} onClick={()=>siteUrl.trim()&&setView("questions")}>
                  Analyse this →
                </button>
              </div>
            )}
          </div>
        )}

        {view === "questions" && (
          <div className="qpage">
            <div className={`q-thumb${!imgUrl?" q-thumb-url":""}`}>
              {imgUrl
                ? <img src={imgUrl} alt="design"/>
                : <><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#CCC" strokeWidth="1.4" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/></svg><p className="q-url-t">{siteUrl}</p></>
              }
            </div>
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
            <div className="spin"/>
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
