import { useState, useEffect, useRef } from "react";

const ADMIN_PASSWORD = "peleg2024";
const STORAGE_KEYS = { players: "pg-players", details: "pg-details", knowledge: "pg-knowledge", familyKnowledge: "pg-family", photos: "pg-photos", history: "pg-history", apikey: "pg-apikey" };

const CATEGORIES = [
  { id: "history", name: "היסטוריה", icon: "🏛️" },
  { id: "movies", name: "סרטים וטלוויזיה", icon: "🎬" },
  { id: "sports", name: "ספורט", icon: "⚽" },
  { id: "geography", name: "גיאוגרפיה", icon: "🌍" },
  { id: "food", name: "אוכל ולייפסטייל", icon: "🍕" },
  { id: "celebrities", name: "אנשים מפורסמים", icon: "🌟" },
  { id: "politics", name: "פוליטיקה", icon: "🏛️" },
  { id: "social", name: "סושיאל מדיה וטכנולוגיה", icon: "📱" },
  { id: "music", name: "מוזיקה", icon: "🎵" },
  { id: "israeli", name: "ישראלי אמיתי", icon: "🇮🇱" },
  { id: "family", name: "משפחת פלג", icon: "👨‍👩‍👧‍👦" },
  { id: "lucky", name: "I'm Feeling Lucky", icon: "🍀" },
];
const FAMILIES = ["גרין", "לוין", "פרוים"];
const ROLES = ["אבא", "אמא", "בן", "בת"];
const DIFFICULTY_LABELS = [
  { easy: "אין לי מושג 🤷", medium: "יאללה קצת רצינות 🤔", hard: "אני גאון 🧠" },
  { easy: "ניחוש מושכל 🎯", medium: "לא נולדתי אתמול 😎", hard: "תביאו מה שיש 💪" },
  { easy: "בוא נתחיל בקטנה 🐣", medium: "אני יודע דבר או שניים 📚", hard: "שום דבר לא מפחיד אותי 🦁" },
  { easy: "אני פה בשביל הכיף 🎉", medium: "חצי מומחה 🧐", hard: "בטח חושבים שאני לא יודע 😏" },
  { easy: "מה יש להפסיד? 😅", medium: "סביר שאני יודע 🤞", hard: "תקראו לי פרופסור 🎓" },
];
const CHALLENGES = [
  "🎤 שיר שיר שלם בלי לצחוק!", "💃 רקוד 15 שניות כאילו אף אחד לא רואה!",
  "🎭 חקה בן משפחה - השאר מנחשים!", "🤪 עשה את הפרצוף הכי מצחיק שאתה יכול!",
  "💪 עשה 10 כפיפות בטן עכשיו!", "🤫 ספר סוד שאף אחד לא יודע!",
  "🎬 שחק סצנה מהסרט האהוב עליך!", "📞 התקשר למישהו ותגיד לו שאתה אוהב אותו!",
  "🐔 עשה חיקוי של חיה - השאר מנחשים!", "👶 התנהג כמו תינוק למשך 30 שניות!",
  "🎵 שיר את ההמנון בקול אופרה!", "🧘 עמוד על רגל אחת למשך 20 שניות!",
  "😂 ספר בדיחה - אם אף אחד לא צוחק, הפסדת!", "🪞 הסתכל בעיניים של מישהו 15 שניות בלי לצחוק!",
  "👑 נאם נאום ניצחון כאילו ניצחת בבחירות!", "🍳 תאר מתכון מורכב בלי להשתמש במילה 'אז'!",
];
const GAME_MODES = [
  { id: "full", name: "משחק מלא", questions: 5, rounds: [2, 2, 1], icon: "🏆", desc: "5 שאלות (2+2+1)" },
  { id: "short", name: "משחק קצר", questions: 3, rounds: [2, 1], icon: "⚡", desc: "3 שאלות (2+1)" },
  { id: "rush", name: "חייב לזוז!", questions: 1, rounds: [1], icon: "🏃", desc: "שאלה אחת - יאללה!" },
];
const POINTS = { easy: 1, medium: 3, hard: 5, challenge: 6 };

const shuffleArray = a => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };

// --- API helpers with API key and CORS headers ---

function getApiHeaders(apiKey) {
  return {
    "Content-Type": "application/json",
    "x-api-key": apiKey,
    "anthropic-version": "2023-06-01",
    "anthropic-dangerous-direct-browser-access": "true",
  };
}

async function askClaude(prompt, sys, apiKey) {
  if (!apiKey) { console.error("No API key"); return null; }
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: getApiHeaders(apiKey),
      body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, system: sys, messages: [{ role: "user", content: prompt }] }),
    });
    const d = await r.json();
    return d.content?.[0]?.text || "";
  } catch (e) { console.error(e); return null; }
}

async function askClaudeWithImage(base64, mediaType, prompt, sys, apiKey) {
  if (!apiKey) { console.error("No API key"); return null; }
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: getApiHeaders(apiKey),
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514", max_tokens: 1000, system: sys,
        messages: [{ role: "user", content: [
          { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
          { type: "text", text: prompt }
        ] }],
      }),
    });
    const d = await r.json();
    return d.content?.[0]?.text || "";
  } catch (e) { console.error(e); return null; }
}

async function askClaudeWithDoc(base64, mediaType, prompt, sys, apiKey) {
  if (!apiKey) { console.error("No API key"); return null; }
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: getApiHeaders(apiKey),
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514", max_tokens: 1000, system: sys,
        messages: [{ role: "user", content: [
          { type: "document", source: { type: "base64", media_type: mediaType, data: base64 } },
          { type: "text", text: prompt }
        ] }],
      }),
    });
    const d = await r.json();
    return d.content?.[0]?.text || "";
  } catch (e) { console.error(e); return null; }
}

// Compress image to ~300x300 jpeg
function compressImage(dataUrl, maxSize = 300) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      let w = img.width, h = img.height;
      if (w > h) { if (w > maxSize) { h = h * maxSize / w; w = maxSize; } }
      else { if (h > maxSize) { w = w * maxSize / h; h = maxSize; } }
      c.width = w; c.height = h;
      c.getContext("2d").drawImage(img, 0, 0, w, h);
      resolve(c.toDataURL("image/jpeg", 0.7));
    };
    img.src = dataUrl;
  });
}

// --- Storage helpers using localStorage (synchronous) ---
function saveData(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)); }
  catch (e) { console.error("Save error:", key, e); }
}
function loadData(key, fallback) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch { return fallback; }
}

function StarBackground() {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 0, overflow: "hidden", background: "linear-gradient(135deg, #0a0a2e 0%, #1a1a4e 30%, #2d1b69 60%, #0a0a2e 100%)" }}>
      {Array.from({ length: 50 }).map((_, i) => (
        <div key={i} style={{ position: "absolute", width: i % 3 === 0 ? 3 : 2, height: i % 3 === 0 ? 3 : 2, background: "white", borderRadius: "50%", top: `${(i * 37) % 100}%`, left: `${(i * 53) % 100}%`, opacity: 0.3 + (i % 5) * 0.15, animation: `twinkle ${2 + (i % 3)}s ease-in-out infinite`, animationDelay: `${(i % 4) * 0.7}s` }} />
      ))}
      <style>{`
        @keyframes twinkle { 0%,100% { opacity:0.3 } 50% { opacity:1 } }
        @keyframes float { 0%,100% { transform:translateY(0) } 50% { transform:translateY(-10px) } }
        @keyframes popIn { 0% { transform:scale(0);opacity:0 } 50% { transform:scale(1.2) } 100% { transform:scale(1);opacity:1 } }
        @keyframes slideUp { from { transform:translateY(30px);opacity:0 } to { transform:translateY(0);opacity:1 } }
        @keyframes pulse { 0%,100% { transform:scale(1) } 50% { transform:scale(1.05) } }
        @keyframes confetti { 0% { transform:translateY(0) rotate(0deg);opacity:1 } 100% { transform:translateY(400px) rotate(720deg);opacity:0 } }
        @keyframes glow { 0%,100% { box-shadow:0 0 20px rgba(255,215,0,0.5) } 50% { box-shadow:0 0 40px rgba(255,215,0,0.9) } }
      `}</style>
    </div>
  );
}

function Btn({ children, onClick, style, disabled, size = "md" }) {
  const s = { sm: { padding: "8px 18px", fontSize: 14 }, md: { padding: "14px 32px", fontSize: 18 }, lg: { padding: "18px 48px", fontSize: 24 } }[size];
  return <button disabled={disabled} onClick={onClick} style={{ ...s, border: "none", borderRadius: 16, fontWeight: "bold", cursor: disabled ? "not-allowed" : "pointer", background: disabled ? "#555" : "linear-gradient(135deg,#f093fb,#f5576c)", color: "white", transition: "all 0.3s", fontFamily: "inherit", opacity: disabled ? 0.5 : 1, ...style }}
    onMouseEnter={e => { if (!disabled) e.target.style.transform = "scale(1.05)"; }} onMouseLeave={e => { e.target.style.transform = "scale(1)"; }}>{children}</button>;
}

function PlayerAvatar({ player, size = 80, onClick, selected }) {
  return (
    <div onClick={onClick} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, cursor: onClick ? "pointer" : "default", transition: "all 0.3s", transform: selected ? "scale(1.1)" : "scale(1)" }}>
      <div style={{ width: size, height: size, borderRadius: "50%", overflow: "hidden", border: selected ? "4px solid #f5576c" : "3px solid rgba(255,255,255,0.3)", boxShadow: selected ? "0 0 20px rgba(245,87,108,0.6)" : "0 4px 15px rgba(0,0,0,0.3)", background: "#2a2a5e", display: "flex", alignItems: "center", justifyContent: "center", animation: selected ? "pulse 1.5s ease-in-out infinite" : "none" }}>
        {player.photo ? <img src={player.photo} alt={player.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: size * 0.45, color: "white" }}>{player.name?.[0] || "?"}</span>}
      </div>
      <span style={{ color: "white", fontSize: size > 60 ? 16 : 13, fontWeight: "bold", textAlign: "center", maxWidth: size + 20, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{player.name}</span>
    </div>
  );
}

function Confetti() {
  const c = ["#f5576c", "#f093fb", "#4facfe", "#43e97b", "#fa709a", "#fee140", "#a18cd1"];
  return <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 9999 }}>{Array.from({ length: 60 }).map((_, i) => <div key={i} style={{ position: "absolute", top: -20, left: `${(i * 41) % 100}%`, width: 8 + (i % 4) * 3, height: 8 + (i % 4) * 3, background: c[i % c.length], borderRadius: i % 2 ? "50%" : "2px", animation: `confetti ${2 + (i % 3)}s ease-out forwards`, animationDelay: `${(i % 8) * 0.25}s` }} />)}</div>;
}

function DropDown({ value, onChange, options, placeholder, style: xs }) {
  return <select value={value || ""} onChange={e => onChange(e.target.value || null)} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.1)", color: value ? "white" : "rgba(255,255,255,0.5)", fontSize: 14, fontFamily: "inherit", direction: "rtl", cursor: "pointer", ...xs }}>
    <option value="" style={{ background: "#1a1a4e", color: "rgba(255,255,255,0.5)" }}>{placeholder}</option>
    {options.map(o => <option key={o} value={o} style={{ background: "#1a1a4e", color: "white" }}>{o}</option>)}
  </select>;
}

function ConfirmDialog({ message, onConfirm, onCancel }) {
  return <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
    <div style={{ background: "linear-gradient(135deg,#1a1a4e,#2d1b69)", borderRadius: 20, padding: 30, maxWidth: 400, width: "90%", textAlign: "center", direction: "rtl" }}>
      <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
      <p style={{ color: "white", fontSize: 20, lineHeight: 1.6, marginBottom: 24 }}>{message}</p>
      <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
        <Btn onClick={onConfirm} style={{ background: "linear-gradient(135deg,#e74c3c,#c0392b)" }}>כן, בטוח!</Btn>
        <Btn onClick={onCancel} style={{ background: "rgba(255,255,255,0.2)" }}>ביטול</Btn>
      </div>
    </div>
  </div>;
}

function SpinWheel({ challenges, onResult }) {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState(null);
  const [phase, setPhase] = useState("ready");
  const items = challenges.slice(0, 10);
  const seg = 360 / items.length;
  const startSpin = () => { setPhase("spinning"); setSpinning(true); setResult(null); setRotation(p => p + 1800 + Math.random() * 1800); };
  const stopSpin = () => { setPhase("stopped"); setSpinning(false); setTimeout(() => { const n = rotation % 360; setResult(items[Math.floor(((360 - n + seg / 2) % 360) / seg) % items.length]); }, 500); };
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
      <div style={{ position: "relative", width: 350, height: 350 }}>
        <div style={{ position: "absolute", top: -18, left: "50%", transform: "translateX(-50%)", fontSize: 36, zIndex: 10 }}>▼</div>
        <svg width="350" height="350" viewBox="0 0 350 350" style={{ transition: spinning ? `transform ${3.5}s cubic-bezier(0.17,0.67,0.12,0.99)` : "none", transform: `rotate(${rotation}deg)` }}>
          {items.map((item, i) => {
            const cols = ["#f5576c", "#4facfe", "#43e97b", "#fa709a", "#fee140", "#a18cd1", "#f093fb", "#30cfd0", "#ff9a9e", "#fbc2eb"];
            const s = (i * seg - 90) * Math.PI / 180, e = ((i + 1) * seg - 90) * Math.PI / 180;
            const x1 = 175 + 170 * Math.cos(s), y1 = 175 + 170 * Math.sin(s), x2 = 175 + 170 * Math.cos(e), y2 = 175 + 170 * Math.sin(e);
            const m = ((i + 0.5) * seg - 90) * Math.PI / 180, tx = 175 + 100 * Math.cos(m), ty = 175 + 100 * Math.sin(m);
            return <g key={i}><path d={`M175,175 L${x1},${y1} A170,170 0 0,1 ${x2},${y2} Z`} fill={cols[i % cols.length]} stroke="white" strokeWidth="2" /><text x={tx} y={ty} textAnchor="middle" dominantBaseline="middle" transform={`rotate(${(i + 0.5) * seg},${tx},${ty})`} style={{ fontSize: 18, fill: "white", fontWeight: "bold" }}>{item.split(" ")[0]}</text></g>;
          })}
          <circle cx="175" cy="175" r="25" fill="white" stroke="#333" strokeWidth="2" />
        </svg>
      </div>
      {!result && <Btn onClick={phase === "spinning" ? stopSpin : startSpin} size="lg" style={{ background: phase === "spinning" ? "linear-gradient(135deg,#f5576c,#ff0844)" : undefined }}>{phase === "ready" ? "🎡 סובב!" : phase === "spinning" ? "✋ עצור!" : "🎡 סובב שוב!"}</Btn>}
      {result && <div style={{ animation: "popIn 0.5s", textAlign: "center" }}><div style={{ fontSize: 28, color: "white", fontWeight: "bold", background: "rgba(245,87,108,0.3)", padding: "20px 30px", borderRadius: 16, border: "2px solid #f5576c" }}>{result}</div><div style={{ marginTop: 16 }}><Btn onClick={() => onResult(result)} size="lg">!יאללה בואו נצביע</Btn></div></div>}
    </div>
  );
}

export default function PeleGames() {
  const [screen, setScreen] = useState("splash");
  const [players, setPlayers] = useState([]);
  const [playerDetails, setPlayerDetails] = useState({});
  const [familyKnowledge, setFamilyKnowledge] = useState("");
  const [playerKnowledge, setPlayerKnowledge] = useState({});
  const [selectedPlayers, setSelectedPlayers] = useState({});
  const [gameMode, setGameMode] = useState(null);
  const [playerOrder, setPlayerOrder] = useState([]);
  const [gameSchedule, setGameSchedule] = useState([]);
  const [scheduleIdx, setScheduleIdx] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState(null);
  const [usedCategories, setUsedCategories] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [claudeReaction, setClaudeReaction] = useState("");
  const [loading, setLoading] = useState(false);
  const [difficultySet, setDifficultySet] = useState(0);
  const [currentChallenge, setCurrentChallenge] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);
  const [adminTab, setAdminTab] = useState("knowledge");
  const [knowledgeInput, setKnowledgeInput] = useState("");
  const [playerStats, setPlayerStats] = useState({});
  const [announcementText, setAnnouncementText] = useState("");
  const [voteResult, setVoteResult] = useState(null);
  const [showScoreboard, setShowScoreboard] = useState(false);
  const [endStats, setEndStats] = useState(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showHistoryConfirm, setShowHistoryConfirm] = useState(false);
  const [gameHistory, setGameHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [fileProcessing, setFileProcessing] = useState(null);
  const [apiKey, setApiKey] = useState("");

  const fileInputRef = useRef(null);
  const playerPhotoRef = useRef(null);
  const playerFileRef = useRef(null);
  const [editingPlayerIdx, setEditingPlayerIdx] = useState(-1);
  const [fileTargetPlayer, setFileTargetPlayer] = useState(null);

  // Load persistent data on mount (synchronous - localStorage is sync)
  useEffect(() => {
    const p = loadData(STORAGE_KEYS.players, []);
    const det = loadData(STORAGE_KEYS.details, {});
    const kn = loadData(STORAGE_KEYS.knowledge, {});
    const fk = loadData(STORAGE_KEYS.familyKnowledge, "");
    const ph = loadData(STORAGE_KEYS.photos, {});
    const hist = loadData(STORAGE_KEYS.history, []);
    const savedApiKey = loadData(STORAGE_KEYS.apikey, "");
    const playersWithPhotos = p.map(pl => ({ ...pl, photo: ph[pl.name] || pl.photo || null, score: 0 }));
    setPlayers(playersWithPhotos);
    setPlayerDetails(det);
    setPlayerKnowledge(kn);
    setFamilyKnowledge(fk);
    setGameHistory(hist);
    setApiKey(savedApiKey);
    setDataLoaded(true);
  }, []);

  // Save data whenever it changes
  useEffect(() => {
    if (!dataLoaded) return;
    const t = setTimeout(() => {
      const photosMap = {};
      players.forEach(p => { if (p.photo) photosMap[p.name] = p.photo; });
      saveData(STORAGE_KEYS.players, players.map(p => ({ name: p.name, score: 0 })));
      saveData(STORAGE_KEYS.photos, photosMap);
    }, 500);
    return () => clearTimeout(t);
  }, [players, dataLoaded]);

  useEffect(() => { if (dataLoaded) saveData(STORAGE_KEYS.details, playerDetails); }, [playerDetails, dataLoaded]);
  useEffect(() => { if (dataLoaded) saveData(STORAGE_KEYS.knowledge, playerKnowledge); }, [playerKnowledge, dataLoaded]);
  useEffect(() => { if (dataLoaded) saveData(STORAGE_KEYS.familyKnowledge, familyKnowledge); }, [familyKnowledge, dataLoaded]);
  useEffect(() => { if (dataLoaded) saveData(STORAGE_KEYS.history, gameHistory); }, [gameHistory, dataLoaded]);
  useEffect(() => { if (dataLoaded) saveData(STORAGE_KEYS.apikey, apiKey); }, [apiKey, dataLoaded]);

  const activePlayers = players.filter(p => selectedPlayers[p.name]);
  const schedulePlayer = gameSchedule.length > 0 && scheduleIdx < gameSchedule.length ? activePlayers[gameSchedule[scheduleIdx]?.playerLocalIdx] : null;

  const getPlayerInfo = (name) => {
    const d = playerDetails[name] || {};
    const parts = [];
    if (d.age) parts.push(`גיל: ${d.age}`);
    if (d.family) parts.push(`משפחה: ${d.family}`);
    if (d.gender) parts.push(`מין: ${d.gender}`);
    if (d.role) parts.push(`תפקיד: ${d.role}`);
    return [parts.join(", "), playerKnowledge[name] || ""].filter(Boolean).join(". ");
  };

  const systemPrompt = `אתה "הדוד קלוד" - מנחה משחק טריוויה למשפחת פלג (כינוי לשלוש משפחות חברות: גרין, לוין ופרוים). אתה מצחיק, חצוף, מביך, אוהב לעשות צחוקים. משפחה ישראלית פתוחה - אתה חופשי וקצת גס. עברית בלבד. אימוג'ים.
מידע משפחתי: ${familyKnowledge}
משתתפים: ${players.map(p => `${p.name}: ${getPlayerInfo(p.name)}`).join("\n")}`;

  const generateQuestion = async (cat, diff, name) => {
    setLoading(true);
    const cn = CATEGORIES.find(c => c.id === cat)?.name || cat;
    const dh = { easy: "קלה", medium: "בינונית", hard: "קשה" }[diff];
    const pi = getPlayerInfo(name);
    const det = playerDetails[name] || {};
    const prompt = cat === "family"
      ? `צור שאלת טריוויה על משפחת פלג (גרין, לוין, פרוים) ברמה ${dh}. משתתף: ${name}. מידע: ${pi}\nהחזר JSON בלבד:\n{"question":"","options":["","","",""],"correct":0,"funFact":""}`
      : `צור שאלת טריוויה בקטגוריית "${cn}" ברמה ${dh}. קהל ישראלי. ${det.age ? `גיל: ${det.age}` : ""}\nהחזר JSON בלבד:\n{"question":"","options":["","","",""],"correct":0,"funFact":""}`;
    const resp = await askClaude(prompt, systemPrompt + "\nJSON תקין בלבד. בלי markdown/backticks.", apiKey);
    try { setCurrentQuestion(JSON.parse((resp || "").replace(/```json|```/g, "").trim())); }
    catch { setCurrentQuestion({ question: "מי הנשיא הראשון של ישראל?", options: ["חיים ויצמן", "דוד בן גוריון", "יצחק בן צבי", "זלמן שזר"], correct: 0, funFact: "חיים ויצמן היה כימאי!" }); }
    setLoading(false);
  };

  const generateReaction = async (ok, q, name, diff) => {
    const resp = await askClaude(`${name} ענה ${ok ? "נכון ✅" : "לא נכון ❌"} ברמה ${{ easy: "קלה", medium: "בינונית", hard: "קשה" }[diff]}.\nשאלה: ${q.question}\nתשובה נכונה: ${q.options[q.correct]}\nמידע: ${getPlayerInfo(name)}\nתגובה מצחיקה חצופה מביכה 2-3 משפטים.`, systemPrompt, apiKey);
    return resp || (ok ? `${name} ידע/ה! 😏` : `אוי ${name}... 🤦`);
  };

  const generateAnnouncement = async (name) => {
    const resp = await askClaude(`הבא: ${name}. מידע: ${getPlayerInfo(name)}\nהכרזה מצחיקה חצופה 1-2 משפטים.`, systemPrompt, apiKey);
    return resp || `יאללה ${name}! 🎤`;
  };

  const generateEndStats = async () => {
    const sorted = [...activePlayers].sort((a, b) => b.score - a.score);
    const info = activePlayers.map(p => `${p.name} (${getPlayerInfo(p.name)}): ${p.score}נק, ${JSON.stringify(playerStats[p.name] || {})}`).join("\n");
    const resp = await askClaude(`משחק נגמר!\n${info}\nמנצח: ${sorted[0]?.name}\nמפסיד: ${sorted[sorted.length - 1]?.name}\nJSON מצחיק מביך:\n{"winner":{"name":"","speech":""},"loser":{"name":"","shame":""},"funStats":[{"player":"","title":"","desc":""}]}`, systemPrompt + "\nJSON תקין בלבד.", apiKey);
    try { return JSON.parse((resp || "").replace(/```json|```/g, "").trim()); }
    catch { return { winner: { name: sorted[0]?.name, speech: `${sorted[0]?.name} מלך/ת! 👑` }, loser: { name: sorted[sorted.length - 1]?.name, shame: `${sorted[sorted.length - 1]?.name}... 😅` }, funStats: [] }; }
  };

  const handleAnswerSchedule = async (idx) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(idx);
    const p = schedulePlayer;
    const ok = idx === currentQuestion.correct;
    if (ok) {
      const pts = POINTS[selectedDifficulty];
      const pName = p.name;
      setPlayers(prev => prev.map(pl => pl.name === pName ? { ...pl, score: pl.score + pts } : pl));
      setShowConfetti(true); setTimeout(() => setShowConfetti(false), 3000);
    }
    setPlayerStats(prev => {
      const s = { ...(prev[p.name] || { correct: 0, wrong: 0, categories: {}, difficulties: {} }) };
      ok ? s.correct++ : s.wrong++;
      s.categories = { ...s.categories, [selectedCategory]: (s.categories[selectedCategory] || 0) + (ok ? 1 : 0) };
      s.difficulties = { ...s.difficulties, [selectedDifficulty]: (s.difficulties[selectedDifficulty] || 0) + (ok ? 1 : 0) };
      return { ...prev, [p.name]: s };
    });
    setLoading(true);
    const reaction = await generateReaction(ok, currentQuestion, p.name, selectedDifficulty);
    setClaudeReaction(reaction);
    setLoading(false);
  };

  const resetQState = () => { setSelectedCategory(null); setSelectedDifficulty(null); setCurrentQuestion(null); setSelectedAnswer(null); setClaudeReaction(""); setDifficultySet(p => (p + 1) % DIFFICULTY_LABELS.length); };

  const advanceSchedule = () => {
    const ni = scheduleIdx + 1;
    if (ni >= gameSchedule.length) { handleEndGame(); return; }
    const cur = gameSchedule[scheduleIdx], nxt = gameSchedule[ni];
    setScheduleIdx(ni); resetQState();
    if (nxt.playerLocalIdx !== cur.playerLocalIdx) {
      setScreen("announce");
      const p = activePlayers[nxt.playerLocalIdx];
      (async () => { setLoading(true); setAnnouncementText(await generateAnnouncement(p.name)); setLoading(false); })();
    } else setScreen("categories");
  };

  const buildSchedule = (mode, order) => {
    const s = [];
    for (const rq of mode.rounds) for (const pIdx of order) for (let q = 0; q < rq; q++) s.push({ playerLocalIdx: pIdx });
    return s;
  };

  const startGame = (mode) => {
    const ap = players.filter(p => selectedPlayers[p.name]);
    if (ap.length < 1) return;
    setGameMode(mode);
    const order = shuffleArray(ap.map((_, i) => i));
    setPlayerOrder(order);
    const sched = buildSchedule(mode, order);
    setGameSchedule(sched); setScheduleIdx(0);
    setUsedCategories({}); setPlayerStats({});
    setPlayers(prev => prev.map(p => ({ ...p, score: 0 })));
    setShowConfetti(false); setScreen("announce");
    const first = ap[order[0]];
    setTimeout(async () => { setLoading(true); setAnnouncementText(await generateAnnouncement(first.name)); setLoading(false); }, 200);
  };

  const handleEndGame = async () => {
    setLoading(true);
    const stats = await generateEndStats();
    setEndStats(stats);
    const sorted = [...activePlayers].sort((a, b) => b.score - a.score);
    const entry = { date: new Date().toLocaleDateString("he-IL"), mode: gameMode?.name, players: activePlayers.map(p => ({ name: p.name, score: p.score })), top3: sorted.slice(0, 3).map(p => ({ name: p.name, score: p.score })) };
    setGameHistory(prev => [entry, ...prev].slice(0, 10));
    setLoading(false); setScreen("end"); setShowConfetti(true);
  };

  const handleChallengeVote = (ok) => {
    if (ok) {
      const pName = schedulePlayer?.name;
      setPlayers(prev => prev.map(p => p.name === pName ? { ...p, score: p.score + POINTS.challenge } : p));
      setShowConfetti(true); setTimeout(() => setShowConfetti(false), 3000);
    }
    setVoteResult(ok);
  };

  const resetGame = () => {
    setScreen("splash"); setGameMode(null); setGameSchedule([]); setScheduleIdx(0);
    setCurrentQuestion(null); setSelectedAnswer(null); setClaudeReaction(""); setShowConfetti(false);
    setShowResetConfirm(false); setUsedCategories({}); setPlayerStats({});
    setPlayers(prev => prev.map(p => ({ ...p, score: 0 }))); setSelectedPlayers({});
  };

  const handleFileUpload = (e) => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = (ev) => setFamilyKnowledge(prev => (prev ? prev + "\n" : "") + ev.target.result);
    r.readAsText(f);
  };

  const handlePlayerPhoto = async (e, idx) => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = async (ev) => {
      const compressed = await compressImage(ev.target.result, 300);
      setPlayers(prev => prev.map((p, i) => i === idx ? { ...p, photo: compressed } : p));
    };
    r.readAsDataURL(f);
  };

  const handlePlayerFileUpload = async (e) => {
    const f = e.target.files[0]; if (!f || !fileTargetPlayer) return;
    const name = fileTargetPlayer;
    setFileProcessing(name);

    const isImage = f.type.startsWith("image/");
    const isPdf = f.type === "application/pdf";
    const isWord = f.type.includes("word") || f.name.endsWith(".docx") || f.name.endsWith(".doc");

    const reader = new FileReader();
    reader.onload = async (ev) => {
      let extractedText = "";
      if (isImage) {
        const base64 = ev.target.result.split(",")[1];
        extractedText = await askClaudeWithImage(base64, f.type, "חלץ את כל הטקסט מהתמונה הזו. החזר רק את הטקסט ללא הסברים.", "אתה מחלץ טקסט מתמונות. החזר רק את הטקסט שבתמונה.", apiKey);
      } else if (isPdf) {
        const base64 = ev.target.result.split(",")[1];
        extractedText = await askClaudeWithDoc(base64, "application/pdf", "חלץ את כל הטקסט מהמסמך. החזר רק את הטקסט.", "אתה מחלץ טקסט ממסמכים. החזר רק טקסט.", apiKey);
      } else if (isWord) {
        try {
          const mammoth = await import("mammoth");
          const arrayBuffer = ev.target.result;
          const result = await mammoth.extractRawText({ arrayBuffer });
          extractedText = result.value;
        } catch { extractedText = "שגיאה בקריאת קובץ Word"; }
      } else {
        extractedText = ev.target.result;
      }

      if (extractedText) {
        setPlayerKnowledge(prev => ({ ...prev, [name]: (prev[name] ? prev[name] + "\n" : "") + extractedText }));
      }
      setFileProcessing(null);
    };

    if (isWord) reader.readAsArrayBuffer(f);
    else if (isImage || isPdf) reader.readAsDataURL(f);
    else reader.readAsText(f);
    e.target.value = "";
  };

  const getScheduleProgress = () => gameSchedule.length ? `שאלה ${scheduleIdx + 1} מתוך ${gameSchedule.length}` : "";
  const getRoundInfo = () => {
    if (!gameMode || !gameSchedule.length) return "";
    let c = 0, r = 0;
    for (const rq of gameMode.rounds) { c += rq * activePlayers.length; r++; if (scheduleIdx < c) break; }
    return `סיבוב ${r} מתוך ${gameMode.rounds.length}`;
  };

  const isGameScreen = ["announce", "categories", "difficulty", "question", "wheel"].includes(screen);

  const GameBar = () => (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, background: "rgba(10,10,46,0.9)", backdropFilter: "blur(10px)", padding: "8px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>{getScheduleProgress()}</span>
        <span style={{ color: "rgba(255,255,255,0.3)" }}>|</span>
        <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>{getRoundInfo()}</span>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <Btn onClick={() => setShowScoreboard(true)} size="sm" style={{ background: "rgba(255,255,255,0.15)", padding: "5px 14px", fontSize: 13 }}>📊</Btn>
        <Btn onClick={() => setShowResetConfirm(true)} size="sm" style={{ background: "rgba(231,76,60,0.6)", padding: "5px 14px", fontSize: 13 }}>🔄 מחדש</Btn>
      </div>
    </div>
  );

  const HistoryModal = () => (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 150, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowHistory(false)}>
      <div onClick={e => e.stopPropagation()} style={{ background: "linear-gradient(135deg,#1a1a4e,#2d1b69)", borderRadius: 20, padding: 30, maxWidth: 550, width: "90%", maxHeight: "80vh", overflow: "auto", direction: "rtl" }}>
        <h2 style={{ color: "white", textAlign: "center", marginTop: 0 }}>🏆 היסטוריית משחקים</h2>
        {gameHistory.length === 0 ? <p style={{ color: "rgba(255,255,255,0.5)", textAlign: "center" }}>אין משחקים עדיין</p> :
          gameHistory.map((g, i) => (
            <div key={i} style={{ background: "rgba(255,255,255,0.06)", borderRadius: 12, padding: 14, marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ color: "white", fontWeight: "bold" }}>{g.date}</span>
                <span style={{ color: "#f093fb", fontSize: 14 }}>{g.mode}</span>
              </div>
              <div style={{ display: "flex", gap: 16 }}>
                {g.top3?.map((p, j) => (
                  <div key={j} style={{ textAlign: "center" }}>
                    <span style={{ fontSize: 20 }}>{j === 0 ? "🥇" : j === 1 ? "🥈" : "🥉"}</span>
                    <div style={{ color: "white", fontSize: 14 }}>{p.name}</div>
                    <div style={{ color: "#f5576c", fontSize: 13 }}>{p.score}⭐</div>
                  </div>
                ))}
              </div>
            </div>
          ))
        }
        <div style={{ textAlign: "center", marginTop: 12 }}><Btn onClick={() => setShowHistory(false)} size="sm">סגור</Btn></div>
      </div>
    </div>
  );

  // SCREENS
  const renderSplash = () => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: 30, zIndex: 1, position: "relative" }}>
      <div style={{ position: "absolute", top: 16, left: 16 }}>
        <Btn onClick={() => setShowHistory(true)} size="sm" style={{ background: "rgba(255,255,255,0.15)", padding: "6px 14px", fontSize: 14 }}>🏆</Btn>
      </div>
      <div style={{ animation: "float 3s ease-in-out infinite", textAlign: "center" }}>
        <div style={{ fontSize: 72, fontWeight: "900", background: "linear-gradient(135deg,#f5576c,#f093fb,#4facfe)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>🎮 PeleGames</div>
        <div style={{ fontSize: 26, color: "rgba(255,255,255,0.8)", fontWeight: "300" }}>משחק הטריוויה של משפחת פלג</div>
        <div style={{ fontSize: 18, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>גרין 🤝 לוין 🤝 פרוים</div>
        <div style={{ fontSize: 20, color: "rgba(255,255,255,0.6)", marginTop: 8 }}>מנחה: הדוד קלוד 🤖</div>
      </div>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
        <Btn onClick={() => setScreen("admin")} size="lg" style={{ background: "linear-gradient(135deg,#667eea,#764ba2)" }}>🔐 אדמין</Btn>
        <Btn onClick={() => { setSelectedPlayers({}); setScreen("players"); }} size="lg">👥 שחקנים</Btn>
        <Btn onClick={() => { if (players.length >= 1) { setSelectedPlayers({}); setScreen("selectPlayers"); } }} size="lg" style={{ background: "linear-gradient(135deg,#43e97b,#38f9d7)" }} disabled={players.length < 1}>🚀 יאללה משחקים!</Btn>
      </div>
      {!apiKey && <div style={{ color: "#f5576c", fontSize: 14, background: "rgba(245,87,108,0.15)", padding: "8px 16px", borderRadius: 8 }}>⚠️ לא הוגדר API Key - הכנס דרך מסך האדמין</div>}
      {players.length > 0 && <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", marginTop: 10 }}>{players.map((p, i) => <PlayerAvatar key={i} player={p} size={55} />)}</div>}
    </div>
  );

  const renderSelectPlayers = () => {
    const selCount = Object.values(selectedPlayers).filter(Boolean).length;
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minHeight: "100vh", padding: 30, zIndex: 1, position: "relative", direction: "rtl" }}>
        <h1 style={{ color: "white", fontSize: 36, marginBottom: 8 }}>🎯 בחרו מי משחק!</h1>
        <p style={{ color: "rgba(255,255,255,0.5)", marginTop: 0 }}>נבחרו: {selCount} שחקנים</p>
        <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
          <Btn onClick={() => { const m = {}; players.forEach(p => m[p.name] = true); setSelectedPlayers(m); }} size="sm" style={{ background: "linear-gradient(135deg,#43e97b,#38f9d7)" }}>✅ בחר הכל</Btn>
          <Btn onClick={() => setSelectedPlayers({})} size="sm" style={{ background: "rgba(255,255,255,0.2)" }}>❌ נקה הכל</Btn>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "center", maxWidth: 900, marginBottom: 24 }}>
          {players.map((p, i) => {
            const sel = !!selectedPlayers[p.name];
            return (
              <div key={i} onClick={() => setSelectedPlayers(prev => ({ ...prev, [p.name]: !prev[p.name] }))}
                style={{ background: sel ? "rgba(67,233,123,0.15)" : "rgba(255,255,255,0.05)", borderRadius: 16, padding: 16, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, minWidth: 130, cursor: "pointer", border: sel ? "3px solid #43e97b" : "3px solid rgba(255,255,255,0.1)", transition: "all 0.3s" }}>
                <PlayerAvatar player={p} size={70} selected={sel} />
                {sel && <div style={{ color: "#43e97b", fontSize: 24 }}>✓</div>}
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <Btn onClick={() => setScreen("splash")} style={{ background: "rgba(255,255,255,0.2)" }}>חזרה</Btn>
          <Btn onClick={() => { if (selCount >= 1) setScreen("mode"); }} disabled={selCount < 1} size="lg">🎮 בחר מצב משחק ({selCount})</Btn>
        </div>
      </div>
    );
  };

  const renderAdmin = () => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minHeight: "100vh", padding: 30, zIndex: 1, position: "relative" }}>
      {!adminLoggedIn ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, marginTop: "20vh" }}>
          <div style={{ fontSize: 40 }}>🔐</div>
          <input type="password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} placeholder="הכנס סיסמה"
            style={{ padding: "12px 24px", borderRadius: 12, border: "2px solid rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.1)", color: "white", fontSize: 18, textAlign: "center" }}
            onKeyDown={e => { if (e.key === "Enter" && adminPassword === ADMIN_PASSWORD) setAdminLoggedIn(true); }} />
          <div style={{ display: "flex", gap: 10 }}>
            <Btn onClick={() => { if (adminPassword === ADMIN_PASSWORD) setAdminLoggedIn(true); }}>כניסה</Btn>
            <Btn onClick={() => setScreen("splash")} size="sm" style={{ background: "rgba(255,255,255,0.2)" }}>חזרה</Btn>
          </div>
        </div>
      ) : (
        <div style={{ width: "100%", maxWidth: 900, direction: "rtl" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h1 style={{ color: "white", margin: 0 }}>⚙️ ניהול</h1>
            <Btn onClick={() => { setScreen("splash"); setAdminLoggedIn(false); setAdminPassword(""); }} size="sm" style={{ background: "rgba(255,255,255,0.2)" }}>חזרה</Btn>
          </div>

          {/* API Key Section */}
          <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 12, padding: 16, marginBottom: 20 }}>
            <h3 style={{ color: "white", margin: "0 0 10px 0" }}>🔑 Anthropic API Key</h3>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="sk-ant-..."
                style={{ flex: 1, padding: "10px 16px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.1)", color: "white", fontSize: 14, fontFamily: "monospace", direction: "ltr" }} />
              {apiKey && <span style={{ color: "#43e97b", fontSize: 20 }}>✓</span>}
            </div>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 6 }}>המפתח נשמר בדפדפן בלבד (localStorage)</div>
          </div>

          <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
            {[["knowledge", "📚 ידע"], ["details", "📋 פרטים"], ["summary", "👁️ סיכום"], ["historyAdmin", "🏆 היסטוריה"]].map(([t, l]) => (
              <Btn key={t} onClick={() => setAdminTab(t)} size="sm" style={{ background: adminTab === t ? "linear-gradient(135deg,#f5576c,#f093fb)" : "rgba(255,255,255,0.15)" }}>{l}</Btn>
            ))}
          </div>

          {adminTab === "knowledge" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <textarea value={knowledgeInput} onChange={e => setKnowledgeInput(e.target.value)} placeholder="מידע על המשפחה..."
                style={{ width: "100%", minHeight: 200, padding: 16, borderRadius: 12, border: "2px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.1)", color: "white", fontSize: 16, direction: "rtl", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
              <div style={{ display: "flex", gap: 10 }}>
                <Btn onClick={() => { if (knowledgeInput.trim()) { setFamilyKnowledge(prev => (prev ? prev + "\n" : "") + knowledgeInput); setKnowledgeInput(""); } }}>💾 שמור</Btn>
                <Btn onClick={() => fileInputRef.current?.click()} style={{ background: "linear-gradient(135deg,#667eea,#764ba2)" }}>📁 קובץ</Btn>
                <input ref={fileInputRef} type="file" accept=".txt,.md,.json,.csv" onChange={handleFileUpload} style={{ display: "none" }} />
              </div>
              {familyKnowledge && (
                <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 12, padding: 16, maxHeight: 300, overflow: "auto" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <h3 style={{ color: "white", margin: 0 }}>מידע שנטען:</h3>
                    <Btn onClick={() => setFamilyKnowledge("")} size="sm" style={{ background: "#e74c3c" }}>🗑️ מחק</Btn>
                  </div>
                  <pre style={{ color: "rgba(255,255,255,0.8)", whiteSpace: "pre-wrap", fontSize: 14, margin: 0 }}>{familyKnowledge}</pre>
                </div>
              )}
            </div>
          )}

          {adminTab === "details" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <h3 style={{ color: "white", margin: 0 }}>📋 פרטי משתתפים</h3>
              <input ref={playerFileRef} type="file" accept=".txt,.md,.json,.csv,.pdf,.doc,.docx,image/*" onChange={handlePlayerFileUpload} style={{ display: "none" }} />
              {players.length === 0 ? <p style={{ color: "rgba(255,255,255,0.5)" }}>הוסף שחקנים קודם</p> :
                players.map((p, i) => {
                  const det = playerDetails[p.name] || {};
                  const isProcessing = fileProcessing === p.name;
                  return (
                    <div key={i} style={{ background: "rgba(255,255,255,0.05)", borderRadius: 12, padding: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                        <PlayerAvatar player={p} size={40} />
                        <span style={{ color: "white", fontSize: 18, fontWeight: "bold" }}>{p.name}</span>
                      </div>
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
                        <input type="number" value={det.age || ""} onChange={e => setPlayerDetails(prev => ({ ...prev, [p.name]: { ...prev[p.name], age: e.target.value } }))}
                          placeholder="גיל" style={{ width: 70, padding: "8px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.1)", color: "white", fontSize: 14, textAlign: "center", fontFamily: "inherit" }} />
                        <DropDown value={det.family} onChange={v => setPlayerDetails(prev => ({ ...prev, [p.name]: { ...prev[p.name], family: v } }))} options={FAMILIES} placeholder="משפחה" />
                        <DropDown value={det.gender} onChange={v => setPlayerDetails(prev => ({ ...prev, [p.name]: { ...prev[p.name], gender: v } }))} options={["זכר", "נקבה"]} placeholder="מין" />
                        <DropDown value={det.role} onChange={v => setPlayerDetails(prev => ({ ...prev, [p.name]: { ...prev[p.name], role: v } }))} options={ROLES} placeholder="תפקיד" />
                      </div>
                      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                        <Btn onClick={() => { setFileTargetPlayer(p.name); setTimeout(() => playerFileRef.current?.click(), 50); }} size="sm"
                          style={{ background: isProcessing ? "rgba(255,255,255,0.1)" : "linear-gradient(135deg,#667eea,#764ba2)", fontSize: 13 }} disabled={isProcessing}>
                          {isProcessing ? "⏳ מעבד..." : "📎 טען קובץ"}
                        </Btn>
                      </div>
                      <textarea value={playerKnowledge[p.name] || ""} onChange={e => setPlayerKnowledge(prev => ({ ...prev, [p.name]: e.target.value }))}
                        placeholder={`מידע נוסף על ${p.name}...`}
                        style={{ width: "100%", minHeight: 80, padding: 10, borderRadius: 8, border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.08)", color: "white", fontSize: 14, direction: "rtl", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" }} />
                    </div>
                  );
                })
              }
            </div>
          )}

          {adminTab === "summary" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <h3 style={{ color: "white" }}>מה הדוד קלוד יודע:</h3>
              {players.length === 0 ? <p style={{ color: "rgba(255,255,255,0.5)" }}>אין שחקנים</p> :
                players.map((p, i) => {
                  const det = playerDetails[p.name] || {};
                  const info = getPlayerInfo(p.name);
                  return (
                    <div key={i} style={{ background: "rgba(255,255,255,0.08)", borderRadius: 12, padding: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                        <PlayerAvatar player={p} size={45} />
                        <div>
                          <h3 style={{ color: "white", margin: 0 }}>{p.name}</h3>
                          {det.family && <span style={{ color: "#f093fb", fontSize: 13 }}>משפחת {det.family}</span>}
                          {det.role && <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}> • {det.role}</span>}
                          {det.age && <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}> • גיל {det.age}</span>}
                        </div>
                      </div>
                      <p style={{ color: "rgba(255,255,255,0.7)", margin: 0, fontSize: 14, whiteSpace: "pre-wrap" }}>{info || "אין מידע"}</p>
                      {(playerKnowledge[p.name] || Object.keys(det).length > 0) && (
                        <Btn onClick={() => { setPlayerKnowledge(prev => { const n = { ...prev }; delete n[p.name]; return n; }); setPlayerDetails(prev => { const n = { ...prev }; delete n[p.name]; return n; }); }}
                          size="sm" style={{ background: "#e74c3c", marginTop: 8 }}>🗑️ מחק הכל</Btn>
                      )}
                    </div>
                  );
                })
              }
            </div>
          )}

          {adminTab === "historyAdmin" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ color: "white", margin: 0 }}>🏆 היסטוריית משחקים</h3>
                {gameHistory.length > 0 && <Btn onClick={() => setShowHistoryConfirm(true)} size="sm" style={{ background: "#e74c3c" }}>🗑️ מחק היסטוריה</Btn>}
              </div>
              {gameHistory.length === 0 ? <p style={{ color: "rgba(255,255,255,0.5)" }}>אין משחקים</p> :
                gameHistory.map((g, i) => (
                  <div key={i} style={{ background: "rgba(255,255,255,0.06)", borderRadius: 12, padding: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ color: "white", fontWeight: "bold" }}>{g.date}</span>
                      <span style={{ color: "#f093fb", fontSize: 14 }}>{g.mode}</span>
                    </div>
                    <div style={{ display: "flex", gap: 16 }}>{g.top3?.map((p, j) => <div key={j} style={{ textAlign: "center" }}><span style={{ fontSize: 20 }}>{j === 0 ? "🥇" : j === 1 ? "🥈" : "🥉"}</span><div style={{ color: "white", fontSize: 14 }}>{p.name}</div><div style={{ color: "#f5576c", fontSize: 13 }}>{p.score}⭐</div></div>)}</div>
                    <div style={{ marginTop: 8, fontSize: 13, color: "rgba(255,255,255,0.4)" }}>{g.players?.map(p => `${p.name}:${p.score}`).join(" | ")}</div>
                  </div>
                ))
              }
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderPlayers = () => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minHeight: "100vh", padding: 30, zIndex: 1, position: "relative", direction: "rtl" }}>
      <h1 style={{ color: "white", fontSize: 36, marginBottom: 20 }}>👥 ניהול שחקנים</h1>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "center", maxWidth: 900, marginBottom: 24 }}>
        {players.map((p, i) => (
          <div key={i} style={{ background: "rgba(255,255,255,0.08)", borderRadius: 16, padding: 16, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, minWidth: 140 }}>
            <div onClick={() => { setEditingPlayerIdx(i); setTimeout(() => playerPhotoRef.current?.click(), 50); }} style={{ cursor: "pointer", position: "relative" }}>
              <PlayerAvatar player={p} size={70} />
              <div style={{ position: "absolute", bottom: 15, right: -4, background: "#f5576c", borderRadius: "50%", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>📷</div>
            </div>
            <input value={p.name} onChange={e => setPlayers(prev => prev.map((pl, j) => j === i ? { ...pl, name: e.target.value } : pl))}
              style={{ textAlign: "center", padding: "6px 10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.1)", color: "white", fontSize: 14, width: 110, fontFamily: "inherit" }} />
            <Btn onClick={() => setPlayers(prev => prev.filter((_, j) => j !== i))} size="sm" style={{ background: "#e74c3c", padding: "4px 12px", fontSize: 12 }}>הסר</Btn>
          </div>
        ))}
        {players.length < 13 && (
          <div onClick={() => setPlayers(prev => [...prev, { name: `שחקן ${prev.length + 1}`, photo: null, score: 0 }])}
            style={{ background: "rgba(255,255,255,0.05)", border: "2px dashed rgba(255,255,255,0.3)", borderRadius: 16, padding: 16, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, minWidth: 140, minHeight: 160, cursor: "pointer" }}>
            <span style={{ fontSize: 40 }}>➕</span><span style={{ color: "rgba(255,255,255,0.6)" }}>הוסף שחקן</span>
          </div>
        )}
      </div>
      <input ref={playerPhotoRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => { if (editingPlayerIdx >= 0) handlePlayerPhoto(e, editingPlayerIdx); }} />
      <Btn onClick={() => setScreen("splash")} style={{ background: "rgba(255,255,255,0.2)" }}>חזרה</Btn>
    </div>
  );

  const renderMode = () => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: 30, zIndex: 1, position: "relative", direction: "rtl" }}>
      <h1 style={{ color: "white", fontSize: 40 }}>🎮 בחרו מצב</h1>
      <div style={{ color: "rgba(255,255,255,0.5)", marginTop: -20 }}>{Object.values(selectedPlayers).filter(Boolean).length} שחקנים נבחרו</div>
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap", justifyContent: "center" }}>
        {GAME_MODES.map(m => (
          <div key={m.id} onClick={() => startGame(m)} style={{ background: "rgba(255,255,255,0.08)", borderRadius: 20, padding: "30px 40px", cursor: "pointer", textAlign: "center", transition: "all 0.3s", border: "2px solid rgba(255,255,255,0.1)", minWidth: 200 }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.15)"; e.currentTarget.style.transform = "scale(1.05)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.transform = "scale(1)"; }}>
            <div style={{ fontSize: 50 }}>{m.icon}</div>
            <div style={{ color: "white", fontSize: 24, fontWeight: "bold", marginTop: 8 }}>{m.name}</div>
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 15, marginTop: 6 }}>{m.desc}</div>
          </div>
        ))}
      </div>
      <Btn onClick={() => setScreen("selectPlayers")} style={{ background: "rgba(255,255,255,0.2)" }}>חזרה</Btn>
    </div>
  );

  const renderAnnounce = () => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: 30, zIndex: 1, position: "relative", direction: "rtl", paddingTop: 50 }}>
      {loading ? <div style={{ fontSize: 40, color: "white", animation: "pulse 1s infinite" }}>🎤 הדוד קלוד מכין הכרזה...</div> : schedulePlayer ? <>
        <div style={{ animation: "popIn 0.6s" }}><PlayerAvatar player={schedulePlayer} size={140} /></div>
        <div style={{ fontSize: 28, color: "white", textAlign: "center", maxWidth: 600, lineHeight: 1.6, animation: "slideUp 0.5s", background: "rgba(255,255,255,0.08)", padding: "20px 30px", borderRadius: 16 }}>{announcementText}</div>
        <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 16 }}>{getScheduleProgress()} | {getRoundInfo()}</div>
        <Btn onClick={() => setScreen("categories")} size="lg">!יאללה</Btn>
      </> : null}
    </div>
  );

  const renderCategories = () => {
    const p = schedulePlayer;
    const used = usedCategories[p?.name] || [];
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minHeight: "100vh", padding: "60px 30px 30px", zIndex: 1, position: "relative", direction: "rtl" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
          <PlayerAvatar player={p} size={55} />
          <div><h2 style={{ color: "white", margin: 0 }}>{p?.name} - בחר/י קטגוריה!</h2><div style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>{getScheduleProgress()}</div></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 14, maxWidth: 800, width: "100%" }}>
          {CATEGORIES.map(cat => {
            const u = used.includes(cat.id);
            return <div key={cat.id} onClick={() => { if (u) return; setSelectedCategory(cat.id); setUsedCategories(prev => ({ ...prev, [p.name]: [...(prev[p.name] || []), cat.id] })); if (cat.id === "lucky") { setCurrentChallenge(null); setVoteResult(null); setScreen("wheel"); } else setScreen("difficulty"); }}
              style={{ background: u ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.08)", borderRadius: 16, padding: 20, textAlign: "center", cursor: u ? "not-allowed" : "pointer", transition: "all 0.3s", border: u ? "2px solid rgba(255,255,255,0.05)" : "2px solid rgba(255,255,255,0.1)", opacity: u ? 0.35 : 1 }}
              onMouseEnter={e => { if (!u) { e.currentTarget.style.background = "rgba(255,255,255,0.15)"; e.currentTarget.style.transform = "scale(1.05)"; } }}
              onMouseLeave={e => { e.currentTarget.style.background = u ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.08)"; e.currentTarget.style.transform = "scale(1)"; }}>
              <div style={{ fontSize: 36 }}>{cat.icon}</div>
              <div style={{ color: "white", fontSize: 15, fontWeight: "bold", marginTop: 6 }}>{cat.name}</div>
              {u && <div style={{ color: "#f5576c", fontSize: 12, marginTop: 4 }}>✓</div>}
            </div>;
          })}
        </div>
      </div>
    );
  };

  const renderDifficulty = () => {
    const labels = DIFFICULTY_LABELS[difficultySet % DIFFICULTY_LABELS.length];
    const p = schedulePlayer;
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: 30, zIndex: 1, position: "relative", direction: "rtl", paddingTop: 50 }}>
        <PlayerAvatar player={p} size={80} />
        <h2 style={{ color: "white", fontSize: 30 }}>בחר/י רמת קושי!</h2>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", justifyContent: "center" }}>
          {[{ key: "easy", label: labels.easy, pts: 1, color: "#43e97b" }, { key: "medium", label: labels.medium, pts: 3, color: "#4facfe" }, { key: "hard", label: labels.hard, pts: 5, color: "#f5576c" }].map(d => (
            <div key={d.key} onClick={() => { setSelectedDifficulty(d.key); generateQuestion(selectedCategory, d.key, p.name); setScreen("question"); }}
              style={{ background: `linear-gradient(135deg,${d.color}33,${d.color}11)`, border: `2px solid ${d.color}`, borderRadius: 20, padding: "30px 40px", cursor: "pointer", textAlign: "center", transition: "all 0.3s", minWidth: 180 }}
              onMouseEnter={e => e.currentTarget.style.transform = "scale(1.08)"} onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
              <div style={{ color: "white", fontSize: 22, fontWeight: "bold" }}>{d.label}</div>
              <div style={{ color: d.color, fontSize: 16, marginTop: 8 }}>{d.pts} נקודות</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderQuestion = () => {
    const p = schedulePlayer;
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: 24, zIndex: 1, position: "relative", direction: "rtl", padding: "60px 30px 30px" }}>
        {showConfetti && <Confetti />}
        {loading && !currentQuestion ? <div style={{ fontSize: 30, color: "white", animation: "pulse 1s infinite" }}>🤔 הדוד קלוד מכין שאלה...</div> : currentQuestion ? <>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <PlayerAvatar player={p} size={50} />
            <div style={{ color: "rgba(255,255,255,0.5)" }}>{CATEGORIES.find(c => c.id === selectedCategory)?.icon} {CATEGORIES.find(c => c.id === selectedCategory)?.name}</div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 20, padding: "30px 40px", maxWidth: 700, width: "100%", textAlign: "center" }}>
            <h2 style={{ color: "white", fontSize: 26, lineHeight: 1.5, margin: 0 }}>{currentQuestion.question}</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, maxWidth: 700, width: "100%" }}>
            {currentQuestion.options.map((opt, i) => {
              const isSel = selectedAnswer === i, isCor = i === currentQuestion.correct, show = selectedAnswer !== null;
              let bg = "rgba(255,255,255,0.08)", brd = "2px solid rgba(255,255,255,0.15)";
              if (show) { if (isCor) { bg = "rgba(67,233,123,0.3)"; brd = "2px solid #43e97b"; } else if (isSel) { bg = "rgba(245,87,108,0.3)"; brd = "2px solid #f5576c"; } }
              return <div key={i} onClick={() => handleAnswerSchedule(i)} style={{ background: bg, border: brd, borderRadius: 16, padding: "18px 24px", cursor: show ? "default" : "pointer", transition: "all 0.3s", textAlign: "center" }}
                onMouseEnter={e => { if (!show) e.currentTarget.style.background = "rgba(255,255,255,0.15)"; }} onMouseLeave={e => { if (!show) e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}>
                <span style={{ color: "white", fontSize: 20 }}>{opt}</span>{show && isCor && " ✅"}{show && isSel && !isCor && " ❌"}
              </div>;
            })}
          </div>
          {selectedAnswer !== null && <div style={{ animation: "slideUp 0.5s", textAlign: "center", maxWidth: 700, width: "100%" }}>
            {loading ? <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 18, padding: 20 }}>🤖 חושב...</div> : claudeReaction && <>
              <div style={{ background: "linear-gradient(135deg,rgba(245,87,108,0.15),rgba(240,147,251,0.15))", borderRadius: 16, padding: "20px 30px", border: "1px solid rgba(245,87,108,0.3)", marginBottom: 10 }}>
                <div style={{ fontSize: 14, color: "#f5576c", marginBottom: 6 }}>🤖 הדוד קלוד:</div>
                <div style={{ color: "white", fontSize: 20, lineHeight: 1.6 }}>{claudeReaction}</div>
              </div>
              {currentQuestion.funFact && <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, marginBottom: 10 }}>💡 {currentQuestion.funFact}</div>}
              <Btn onClick={advanceSchedule} size="lg">הבא! ➡️</Btn>
            </>}
          </div>}
        </> : null}
      </div>
    );
  };

  const renderWheel = () => {
    const p = schedulePlayer;
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: 20, zIndex: 1, position: "relative", direction: "rtl", paddingTop: 50 }}>
        {showConfetti && <Confetti />}
        <h2 style={{ color: "white", fontSize: 30 }}>🍀 I'm Feeling Lucky!</h2>
        <PlayerAvatar player={p} size={70} />
        {!currentChallenge ? <SpinWheel challenges={shuffleArray(CHALLENGES)} onResult={ch => setCurrentChallenge(ch)} /> :
          voteResult === null ? <div style={{ animation: "popIn 0.5s", textAlign: "center" }}>
            <div style={{ fontSize: 28, color: "white", fontWeight: "bold", background: "rgba(255,255,255,0.08)", padding: "24px 36px", borderRadius: 16, marginBottom: 20, maxWidth: 500 }}>{currentChallenge}</div>
            <h3 style={{ color: "#f5576c", fontSize: 22 }}>?{p?.name} עשה/תה את זה</h3>
            <div style={{ display: "flex", gap: 20, justifyContent: "center" }}>
              <Btn onClick={() => handleChallengeVote(true)} size="lg" style={{ background: "linear-gradient(135deg,#43e97b,#38f9d7)" }}>👍 כן!</Btn>
              <Btn onClick={() => handleChallengeVote(false)} size="lg" style={{ background: "linear-gradient(135deg,#f5576c,#ff0844)" }}>👎 לא!</Btn>
            </div>
          </div> :
          <div style={{ animation: "popIn 0.5s", textAlign: "center" }}>
            <div style={{ fontSize: 50 }}>{voteResult ? "🎉" : "😅"}</div>
            <div style={{ fontSize: 26, color: "white", margin: "16px 0" }}>{voteResult ? `+${POINTS.challenge} נקודות ל${p?.name}!` : `${p?.name} לא הצליח/ה...`}</div>
            <Btn onClick={() => { setCurrentChallenge(null); setVoteResult(null); advanceSchedule(); }} size="lg">הבא! ➡️</Btn>
          </div>
        }
      </div>
    );
  };

  const renderEnd = () => {
    const sorted = [...activePlayers].sort((a, b) => b.score - a.score);
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minHeight: "100vh", padding: 30, gap: 24, zIndex: 1, position: "relative", direction: "rtl" }}>
        {showConfetti && <Confetti />}
        <h1 style={{ color: "white", fontSize: 48, animation: "float 3s ease-in-out infinite" }}>🏆 סוף המשחק!</h1>
        {endStats && <>
          <div style={{ background: "linear-gradient(135deg,rgba(255,215,0,0.2),rgba(255,215,0,0.05))", borderRadius: 20, padding: "30px 40px", textAlign: "center", animation: "glow 2s infinite", border: "2px solid gold", maxWidth: 600, width: "100%" }}>
            <div style={{ fontSize: 60 }}>👑</div><h2 style={{ color: "gold", fontSize: 30 }}>מלך/מלכת הטריוויה</h2>
            <PlayerAvatar player={sorted[0]} size={100} />
            <div style={{ color: "white", fontSize: 20, marginTop: 12, lineHeight: 1.6 }}>{endStats.winner?.speech}</div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 20, padding: "24px 36px", textAlign: "center", border: "2px solid #e74c3c", maxWidth: 600, width: "100%" }}>
            <div style={{ fontSize: 40 }}>🤡</div><h3 style={{ color: "#e74c3c" }}>טקס הבושה</h3>
            <PlayerAvatar player={sorted[sorted.length - 1]} size={70} />
            <div style={{ color: "white", fontSize: 18, marginTop: 10, lineHeight: 1.6 }}>{endStats.loser?.shame}</div>
          </div>
        </>}
        <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 20, padding: 24, maxWidth: 600, width: "100%" }}>
          <h3 style={{ color: "white", textAlign: "center" }}>📊 ניקוד סופי</h3>
          {sorted.map((p, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
              <span style={{ color: i === 0 ? "gold" : i === 1 ? "silver" : i === 2 ? "#cd7f32" : "white", fontSize: 22, fontWeight: "bold", minWidth: 30 }}>{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}</span>
              <PlayerAvatar player={p} size={36} /><span style={{ color: "white", flex: 1, fontSize: 18 }}>{p.name}</span>
              <span style={{ color: "#f5576c", fontSize: 20, fontWeight: "bold" }}>{p.score} ⭐</span>
            </div>
          ))}
        </div>
        {endStats?.funStats?.length > 0 && <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 20, padding: 24, maxWidth: 600, width: "100%" }}>
          <h3 style={{ color: "white", textAlign: "center" }}>😂 סטטיסטיקות</h3>
          {endStats.funStats.map((s, i) => <div key={i} style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}><span style={{ color: "#f5576c", fontWeight: "bold" }}>{s.player}</span><span style={{ color: "gold" }}> - {s.title}: </span><span style={{ color: "rgba(255,255,255,0.8)" }}>{s.desc}</span></div>)}
        </div>}
        <div style={{ display: "flex", gap: 16, marginBottom: 30 }}>
          <Btn onClick={() => { setScreen("splash"); setShowConfetti(false); }} size="lg">🏠 הביתה</Btn>
          <Btn onClick={() => { setScreen("selectPlayers"); setShowConfetti(false); setSelectedPlayers({}); }} size="lg" style={{ background: "linear-gradient(135deg,#43e97b,#38f9d7)" }}>🔄 משחק חדש</Btn>
        </div>
      </div>
    );
  };

  const renderScoreboardPopup = () => {
    const sorted = [...activePlayers].sort((a, b) => b.score - a.score);
    return <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowScoreboard(false)}>
      <div onClick={e => e.stopPropagation()} style={{ background: "linear-gradient(135deg,#1a1a4e,#2d1b69)", borderRadius: 20, padding: 30, maxWidth: 500, width: "90%", direction: "rtl" }}>
        <h2 style={{ color: "white", textAlign: "center", marginTop: 0 }}>📊 ניקוד</h2>
        {sorted.map((p, i) => <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <span style={{ color: i === 0 ? "gold" : "white", fontSize: 18, minWidth: 25 }}>{i + 1}.</span>
          <PlayerAvatar player={p} size={30} /><span style={{ color: "white", flex: 1 }}>{p.name}</span>
          <span style={{ color: "#f5576c", fontWeight: "bold" }}>{p.score} ⭐</span>
        </div>)}
        <div style={{ textAlign: "center", marginTop: 16 }}><Btn onClick={() => setShowScoreboard(false)} size="sm">סגור</Btn></div>
      </div>
    </div>;
  };

  if (!dataLoaded) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#0a0a2e" }}><div style={{ color: "white", fontSize: 30, animation: "pulse 1s infinite" }}>🎮 טוען PeleGames...</div></div>;

  return (
    <div style={{ fontFamily: "'Segoe UI',Tahoma,sans-serif", minHeight: "100vh", direction: "rtl" }}>
      <StarBackground />
      {isGameScreen && <GameBar />}
      {showScoreboard && renderScoreboardPopup()}
      {showHistory && <HistoryModal />}
      {showResetConfirm && <ConfirmDialog message="להתחיל מחדש? המשחק יתאפס, השחקנים והמידע יישמרו." onConfirm={resetGame} onCancel={() => setShowResetConfirm(false)} />}
      {showHistoryConfirm && <ConfirmDialog message="למחוק את כל היסטוריית המשחקים?" onConfirm={() => { setGameHistory([]); setShowHistoryConfirm(false); }} onCancel={() => setShowHistoryConfirm(false)} />}
      {screen === "splash" && renderSplash()}
      {screen === "admin" && renderAdmin()}
      {screen === "players" && renderPlayers()}
      {screen === "selectPlayers" && renderSelectPlayers()}
      {screen === "mode" && renderMode()}
      {screen === "announce" && renderAnnounce()}
      {screen === "categories" && renderCategories()}
      {screen === "difficulty" && renderDifficulty()}
      {screen === "question" && renderQuestion()}
      {screen === "wheel" && renderWheel()}
      {screen === "end" && renderEnd()}
    </div>
  );
}
