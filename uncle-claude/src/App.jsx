import { useState, useEffect, useRef } from "react";
import { saveShared, loadShared, deleteShared, listShared } from "./firebase.js";

const ADMIN_PASS = "peleg2024";

const getQuestions = (age, g) => {
  const m = g === "male";
  const isKid = age < 18;
  const isYoung = age >= 18 && age <= 30;

  const base = [
    { q: m ? "אז ספר לי, מה הכינוי שלך בבית? יש לך כינוי מביך שאתה לא רוצה שאף אחד ידע? 😏" : "אז ספרי לי, מה הכינוי שלך בבית? יש לך כינוי מביך שאת לא רוצה שאף אחד ידע? 😏", key: "nickname", followup: true },
    { q: m ? "מה התחביב הכי משונה שלך? משהו שאתה עושה ואף אחד לא יודע? 🤫" : "מה התחביב הכי משונה שלך? משהו שאת עושה ואף אחד לא יודע? 🤫", key: "weird_hobby", followup: true },
    { q: m ? "אם היית חיה, איזה חיה היית? ולמה? 🦁" : "אם היית חיה, איזה חיה היית? ולמה? 🦁", key: "animal", followup: false },
    { q: m ? "מה האוכל האהוב עליך? ומה האוכל שאתה הכי שונא? 🍕🤢" : "מה האוכל האהוב עליך? ומה האוכל שאת הכי שונאת? 🍕🤢", key: "food", followup: true },
    { q: m ? "מה השיר שאתה שר במקלחת? תהיה כנה! 🎤🚿" : "מה השיר שאת שרה במקלחת? תהיי כנה! 🎤🚿", key: "shower_song", followup: false },
    { q: m ? "מה הדבר הכי מביך שקרה לך אי פעם? אל תחסוך פרטים! 😳" : "מה הדבר הכי מביך שקרה לך אי פעם? אל תחסכי פרטים! 😳", key: "embarrassing", followup: true },
    { q: m ? "אם היית יכול לגנוב כישרון של מישהו מהמשפחה, של מי ומה? 🎭" : "אם היית יכולה לגנוב כישרון של מישהו מהמשפחה, של מי ומה? 🎭", key: "steal_talent", followup: false },
    { q: m ? "מה החלום הכי מוזר שחלמת לאחרונה? 💤🌙" : "מה החלום הכי מוזר שחלמת לאחרונה? 💤🌙", key: "weird_dream", followup: false },
  ];

  const kidQs = [
    { q: m ? "מה השם של המורה הכי מצחיק שלך? ולמה הוא מצחיק? 📚" : "מה השם של המורה הכי מצחיקה שלך? ולמה היא מצחיקה? 📚", key: "funny_teacher", followup: true },
    { q: m ? "מה הדבר שהכי מעצבן אותך בהורים שלך? 😤" : "מה הדבר שהכי מעצבן אותך בהורים שלך? 😤", key: "parents_annoying", followup: true },
    { q: m ? "אם היית מקבל מיליון שקל מחר, מה הדבר הראשון שהיית קונה? 💰" : "אם היית מקבלת מיליון שקל מחר, מה הדבר הראשון שהיית קונה? 💰", key: "million", followup: false },
    { q: m ? "מי החבר הכי טוב שלך ומה הסיפור הכי מצחיק שלכם ביחד? 👯" : "מי החברה הכי טובה שלך ומה הסיפור הכי מצחיק שלכם ביחד? 👯", key: "best_friend", followup: true },
    { q: m ? "מה הדבר שאתה הכי גרוע בו? בלי בושות! 😜" : "מה הדבר שאת הכי גרועה בו? בלי בושות! 😜", key: "worst_at", followup: false },
    { q: m ? "מה הסוד הכי קטן שלך? משהו שלא סיפרת להורים? 🤫" : "מה הסוד הכי קטן שלך? משהו שלא סיפרת להורים? 🤫", key: "small_secret", followup: true },
    { q: m ? "אם היית גיבור על, מה הכוח שלך היה? 🦸" : "אם היית גיבורת על, מה הכוח שלך היה? 🦸", key: "superpower", followup: false },
    { q: m ? "תאר את עצמך ב-3 מילים. רק 3! 🔢" : "תארי את עצמך ב-3 מילים. רק 3! 🔢", key: "three_words", followup: false },
    { q: m ? "מה האפליקציה שאתה הכי מכור אליה? 📱" : "מה האפליקציה שאת הכי מכורה אליה? 📱", key: "addicted_app", followup: true },
    { q: m ? "מי הדמות מסדרה או סרט שהכי דומה לך? 🎬" : "מי הדמות מסדרה או סרט שהכי דומה לך? 🎬", key: "character", followup: true },
    { q: m ? "מה הדבר שהכי שנוי במחלוקת בינך לבין ההורים? ⚔️" : "מה הדבר שהכי שנוי במחלוקת בינך לבין ההורים? ⚔️", key: "argue_parents", followup: false },
    { q: m ? "אם היית יכול לשנות דבר אחד בבית ספר, מה היית משנה? 🏫" : "אם היית יכולה לשנות דבר אחד בבית ספר, מה היית משנה? 🏫", key: "change_school", followup: false },
  ];

  const youngQs = [
    { q: m ? "ספר לי על הנשיקה הראשונה שלך! איפה, מתי, ומה הרגשת? 💋" : "ספרי לי על הנשיקה הראשונה שלך! איפה, מתי, ומה הרגשת? 💋", key: "first_kiss", followup: true },
    { q: m ? "מה הדבר הכי מטופש שעשית בגלל קראש? 💕🤦" : "מה הדבר הכי מטופש שעשית בגלל קראש? 💕🤦", key: "crush_stupid", followup: true },
    { q: m ? "מה הדבר שהכי מעצבן אותך במשפחה? כנות מלאה! 😤" : "מה הדבר שהכי מעצבן אותך במשפחה? כנות מלאה! 😤", key: "family_annoying", followup: false },
    { q: m ? "אם היית מקבל מיליון שקל, מה הדבר הראשון והאחרון שהיית עושה? 💰" : "אם היית מקבלת מיליון שקל, מה הדבר הראשון והאחרון שהיית עושה? 💰", key: "million", followup: false },
    { q: m ? "מה הדבר הכי לא חוקי (או כמעט) שעשית? 🚔" : "מה הדבר הכי לא חוקי (או כמעט) שעשית? 🚔", key: "illegal", followup: true },
    { q: m ? "מה החלום שלך בחיים? הדבר הכי גדול שאתה רוצה להשיג? ✨" : "מה החלום שלך בחיים? הדבר הכי גדול שאת רוצה להשיג? ✨", key: "life_dream", followup: false },
    { q: m ? "תאר את עצמך ב-3 מילים. רק 3! 🔢" : "תארי את עצמך ב-3 מילים. רק 3! 🔢", key: "three_words", followup: false },
    { q: m ? "מי מהמשפחה הכי מבין אותך? ומי הכי לא? 👨‍👩‍👧‍👦" : "מי מהמשפחה הכי מבינה אותך? ומי הכי לא? 👨‍👩‍👧‍👦", key: "family_understands", followup: true },
    { q: m ? "מה הדבר הכי ויראלי שעשית ברשתות? 📱🔥" : "מה הדבר הכי ויראלי שעשית ברשתות? 📱🔥", key: "viral", followup: true },
    { q: m ? "מה הטעות הכי גדולה שעשית ולמדת ממנה? 📖" : "מה הטעות הכי גדולה שעשית ולמדת ממנה? 📖", key: "biggest_mistake", followup: false },
    { q: m ? "איזה שיר מתאר את החיים שלך עכשיו? 🎵" : "איזה שיר מתאר את החיים שלך עכשיו? 🎵", key: "life_song", followup: true },
    { q: m ? "מה הדבר שאתה עושה בסתר שאף אחד לא יודע? 🕵️" : "מה הדבר שאת עושה בסתר שאף אחד לא יודע? 🕵️", key: "secret_thing", followup: true },
  ];

  const adultQs = [
    { q: m ? "ספר לי על הנשיקה הראשונה שלך! כן כן, חוזרים אחורה! 💋" : "ספרי לי על הנשיקה הראשונה שלך! כן כן, חוזרות אחורה! 💋", key: "first_kiss", followup: true },
    { q: m ? "מה הדבר הכי מטופש שעשית כשהיית צעיר? 🤦" : "מה הדבר הכי מטופש שעשית כשהיית צעירה? 🤦", key: "young_stupid", followup: true },
    { q: m ? "מה הסוד הכי גדול שלך שאף אחד במשפחה לא יודע? 🤫🔒" : "מה הסוד הכי גדול שלך שאף אחד במשפחה לא יודע? 🤫🔒", key: "big_secret", followup: true },
    { q: m ? "מה הדבר שהכי מעצבן אותך בבת הזוג? (אל תדאג, זה ביניני) 😤💑" : "מה הדבר שהכי מעצבן אותך בבן הזוג? (אל תדאגי, זה ביניני) 😤💑", key: "partner_annoying", followup: false },
    { q: m ? "אם היית יכול לחזור בזמן לרגע אחד בחיים, לאיזה רגע? ⏰" : "אם היית יכולה לחזור בזמן לרגע אחד בחיים, לאיזה רגע? ⏰", key: "time_travel", followup: true },
    { q: m ? "מה הדבר שאתה הכי גאה בו בחיים? 🏆" : "מה הדבר שאת הכי גאה בו בחיים? 🏆", key: "proudest", followup: false },
    { q: m ? "תאר את עצמך ב-3 מילים. רק 3! 🔢" : "תארי את עצמך ב-3 מילים. רק 3! 🔢", key: "three_words", followup: false },
    { q: m ? "מה הדבר שהיית רוצה שהילדים שלך ידעו עליך? 💡" : "מה הדבר שהיית רוצה שהילדים שלך ידעו עליך? 💡", key: "kids_know", followup: false },
    { q: m ? "מה הטעות הכי גדולה שעשית בחיים ומה למדת? 📖" : "מה הטעות הכי גדולה שעשית בחיים ומה למדת? 📖", key: "life_mistake", followup: true },
    { q: m ? "מה עשית בצעירותך שהיום היית מתבייש בזה? 😬" : "מה עשית בצעירותך שהיום היית מתביישת בזה? 😬", key: "youth_shame", followup: true },
    { q: m ? "מה העצה הכי טובה שקיבלת אי פעם? ממי? 🧠" : "מה העצה הכי טובה שקיבלת אי פעם? ממי? 🧠", key: "best_advice", followup: false },
    { q: m ? "אם היית יכול להתחיל קריירה חדשה מחר, מה היית בוחר? 💼" : "אם היית יכולה להתחיל קריירה חדשה מחר, מה היית בוחרת? 💼", key: "new_career", followup: true },
  ];

  const ageSpecific = isKid ? kidQs : isYoung ? youngQs : adultQs;

  const bonus1 = [
    { q: m ? "אם היית צריך לבחור שם חדש לעצמך, מה היית בוחר? ✨" : "אם היית צריכה לבחור שם חדש לעצמך, מה היית בוחרת? ✨", key: "new_name", followup: false },
    { q: m ? "מה הדבר שאתה הכי מפחד ממנו? פחד אמיתי! 😱" : "מה הדבר שאת הכי מפחדת ממנו? פחד אמיתי! 😱", key: "fear", followup: true },
    { q: m ? "אם היית יכול להחליף חיים עם מישהו ליום אחד, עם מי? 🔄" : "אם היית יכולה להחליף חיים עם מישהו ליום אחד, עם מי? 🔄", key: "swap_lives", followup: true },
    { q: m ? "מה המילה או הביטוי שאתה הכי הרבה משתמש בו? 🗣️" : "מה המילה או הביטוי שאת הכי הרבה משתמשת בו? 🗣️", key: "catchphrase", followup: false },
    { q: m ? "מה הדבר שאתה הכי רוצה שהמשפחה תדע עליך? 💝" : "מה הדבר שאת הכי רוצה שהמשפחה תדע עליך? 💝", key: "want_family_know", followup: false },
  ];

  const bonus2 = [
    { q: m ? "מה היית עושה אם היית בלתי נראה ליום? 👻" : "מה היית עושה אם היית בלתי נראית ליום? 👻", key: "invisible", followup: true },
    { q: m ? "מה התירוץ הכי יצירתי שהמצאת פעם? 🤥" : "מה התירוץ הכי יצירתי שהמצאת פעם? 🤥", key: "creative_excuse", followup: false },
    { q: m ? "אם היית יכול למחוק זיכרון אחד, מה היית מוחק? 🧹" : "אם היית יכולה למחוק זיכרון אחד, מה היית מוחקת? 🧹", key: "erase_memory", followup: true },
    { q: m ? "מה הדבר הכי יקר שהרסת בטעות? 💸" : "מה הדבר הכי יקר שהרסת בטעות? 💸", key: "broke_expensive", followup: false },
    { q: m ? "תן ציון למשפחה שלך מ-1 עד 10 ותנמק! 📊" : "תני ציון למשפחה שלך מ-1 עד 10 ותנמקי! 📊", key: "family_score", followup: true },
  ];

  const bonus3 = [
    { q: m ? "מה הדבר הכי מוזר שאכלת אי פעם? 🤮" : "מה הדבר הכי מוזר שאכלת אי פעם? 🤮", key: "weird_food", followup: false },
    { q: m ? "אם היית צריך לשרוד על אי בודד עם בן משפחה אחד, את מי היית לוקח? 🏝️" : "אם היית צריכה לשרוד על אי בודד עם בן משפחה אחד, את מי היית לוקחת? 🏝️", key: "island", followup: true },
    { q: m ? "מה הביטוי שההורים/ילדים שלך תמיד אומרים שמשגע אותך? 🔄😤" : "מה הביטוי שההורים/ילדים שלך תמיד אומרים שמשגע אותך? 🔄😤", key: "annoying_phrase", followup: false },
    { q: m ? "אם החיים שלך היו סרט, מה היה שמו? 🎬" : "אם החיים שלך היו סרט, מה היה שמו? 🎬", key: "life_movie", followup: false },
    { q: m ? "שאלה אחרונה באמת! מה המסר שלך למשפחה? 💌" : "שאלה אחרונה באמת! מה המסר שלך למשפחה? 💌", key: "message_family", followup: false },
  ];

  return [...base, ...ageSpecific, ...bonus1, ...bonus2, ...bonus3];
};

const TYPING_DELAY = 1200;
const SHORT_DELAY = 800;

async function callClaude(messages, sys, apiKey, model = "claude-sonnet-4-5-20250929", maxTokens = 300, timeoutMs = 15000) {
  if (!apiKey) return { text: null, error: "No API key" };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true"
      },
      body: JSON.stringify({ model, max_tokens: maxTokens, system: sys, messages }),
    });
    clearTimeout(timeout);
    if (!r.ok) {
      const body = await r.text();
      console.warn(`[callClaude] API error ${r.status}: ${body}`);
      return { text: null, error: "API " + r.status + ": " + body.slice(0, 200) };
    }
    const d = await r.json();
    const text = d.content?.[0]?.text || null;
    return { text, error: text ? null : "Empty response" };
  } catch (e) {
    clearTimeout(timeout);
    const msg = e.name === "AbortError" ? "Request timeout (15s)" : e.message;
    console.error("[callClaude] failed:", msg);
    return { text: null, error: msg };
  }
}

function StarBg() {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 0, overflow: "hidden", background: "linear-gradient(135deg,#0a0a2e,#1a1a4e 30%,#2d1b69 60%,#0a0a2e)" }}>
      {Array.from({ length: 40 }).map((_, i) => (
        <div key={i} style={{
          position: "absolute", width: i % 3 === 0 ? 3 : 2, height: i % 3 === 0 ? 3 : 2,
          background: "white", borderRadius: "50%",
          top: `${(i * 37) % 100}%`, left: `${(i * 53) % 100}%`,
          opacity: 0.3 + (i % 5) * 0.12,
          animation: `tw ${2 + i % 3}s ease-in-out infinite`,
          animationDelay: `${(i % 4) * 0.5}s`
        }} />
      ))}
      <style>{`
        @keyframes tw{0%,100%{opacity:.3}50%{opacity:1}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
        @keyframes popIn{0%{transform:scale(0);opacity:0}50%{transform:scale(1.15)}100%{transform:scale(1);opacity:1}}
        @keyframes slideUp{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes typing{0%{opacity:.3}50%{opacity:1}100%{opacity:.3}}
        ::placeholder{color:rgba(255,255,255,0.4)}
        input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none}
      `}</style>
    </div>
  );
}

function Btn({ children, onClick, style, disabled, size = "md" }) {
  const s = { sm: { padding: "8px 18px", fontSize: 14 }, md: { padding: "14px 28px", fontSize: 18 }, lg: { padding: "18px 44px", fontSize: 24 } }[size];
  return (
    <button disabled={disabled} onClick={onClick}
      style={{ ...s, border: "none", borderRadius: 16, fontWeight: "bold", cursor: disabled ? "not-allowed" : "pointer", background: disabled ? "#555" : "linear-gradient(135deg,#f093fb,#f5576c)", color: "white", transition: "all 0.3s", fontFamily: "inherit", opacity: disabled ? 0.5 : 1, ...style }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.transform = "scale(1.05)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}>
      {children}
    </button>
  );
}

function TypingIndicator() {
  return (
    <div style={{ display: "flex", gap: 6, padding: "12px 18px", background: "rgba(255,255,255,0.08)", borderRadius: "18px 18px 18px 4px", width: "fit-content" }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "#f093fb", animation: `typing 1.2s ease-in-out infinite`, animationDelay: `${i * 0.3}s` }} />
      ))}
    </div>
  );
}

function UncleAvatar({ src, size = 36 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", overflow: "hidden", border: "2px solid #f093fb", flexShrink: 0 }}>
      {src
        ? <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg,#667eea,#764ba2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.5 }}>🤖</div>
      }
    </div>
  );
}

function ChatBubble({ text, isUser, avatarSrc }) {
  return (
    <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", marginBottom: 10, animation: "slideUp 0.3s ease-out", gap: 8, alignItems: "flex-end" }}>
      {!isUser && <UncleAvatar src={avatarSrc} size={32} />}
      <div style={{
        maxWidth: "75%", padding: "12px 18px",
        borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
        background: isUser ? "linear-gradient(135deg,#f093fb,#f5576c)" : "rgba(255,255,255,0.1)",
        color: "white", fontSize: 17, lineHeight: 1.6, whiteSpace: "pre-wrap", direction: "rtl", textAlign: "right"
      }}>{text}</div>
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState("splash");
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [typing, setTyping] = useState(false);
  const [answers, setAnswers] = useState({});
  const [allQuestions, setAllQuestions] = useState([]);
  const [mainQAnswered, setMainQAnswered] = useState(0);
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [showContinue, setShowContinue] = useState(null);
  const [done, setDone] = useState(false);
  const [awaitingFollowup, setAwaitingFollowup] = useState(false);
  const [gibberishRetry, setGibberishRetry] = useState(0);
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);
  const [adminPass, setAdminPass] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [playerData, setPlayerData] = useState([]);
  const [loadingAdmin, setLoadingAdmin] = useState(false);
  const [setupDone, setSetupDone] = useState(false);
  const [uncleImg, setUncleImg] = useState(null);
  const [testMode, setTestMode] = useState(false);
  const [resumeData, setResumeData] = useState(null);
  const [checkingResume, setCheckingResume] = useState(false);
  const [showExitPrompt, setShowExitPrompt] = useState(false);
  const [exitPass, setExitPass] = useState("");
  const [continueFiredAt, setContinueFiredAt] = useState(new Set());
  const [apiError, setApiError] = useState(false);
  const [errorLogs, setErrorLogs] = useState([]);
  const [apiKeyStatus, setApiKeyStatus] = useState(null);

  const chatEndRef = useRef(null);
  const inputRef = useRef(null);
  const avatarRef = useRef(null);
  const processingRef = useRef(false);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages, typing]);
  useEffect(() => {
    if (!typing && !done && !showContinue && !showExitPrompt && inputRef.current) inputRef.current.focus();
  }, [typing, done, showContinue, showExitPrompt, chatMessages]);

  useEffect(() => {
    (async () => {
      const k = await loadShared("uncle-claude-apikey", "");
      console.log("[uncle-claude] API key loaded:", k ? "yes" : "NO");
      if (k) { setApiKey(k); setSetupDone(true); }
      const img = await loadShared("uncle-claude-avatar", null);
      if (img) setUncleImg(img);
      const tm = await loadShared("uncle-claude-testmode", false);
      setTestMode(tm);
    })();
  }, []);

  const verifyApiKey = async (key) => {
    setApiKeyStatus("checking");
    const msg = [{ role: "user", content: "Say ok" }];
    const sys = "Reply with ok.";
    const [haiku, sonnet] = await Promise.all([
      callClaude(msg, sys, key, "claude-haiku-4-5-20251001", 5, 8000),
      callClaude(msg, sys, key, "claude-sonnet-4-5-20250929", 5, 8000),
    ]);
    if (haiku.text && sonnet.text) setApiKeyStatus("ok");
    else {
      const parts = [];
      if (!haiku.text) parts.push("Haiku: " + (haiku.error || "failed"));
      if (!sonnet.text) parts.push("Sonnet: " + (sonnet.error || "failed"));
      setApiKeyStatus({ error: parts.join("\n") });
    }
  };

  const addErrorLog = (source, message) => {
    const entry = { source, message, time: new Date().toISOString() };
    setErrorLogs(prev => [entry, ...prev].slice(0, 5));
    (async () => {
      try {
        const prev = await loadShared("uncle-claude-errorlog", []);
        await saveShared("uncle-claude-errorlog", [entry, ...prev].slice(0, 5));
      } catch (e) {
        console.error("addErrorLog failed:", e);
      }
    })();
  };

  const getSys = () =>
    `אתה "הדוד קלוד" - דמות מצחיקה, חמה, קצת משוגעת ומקסימה. מנחה שאלון היכרות למשפחת פלג (גרין, לוין, פרוים). עברית, אימוג'ים, מצחיק וחביב. לא מביך ולא גס - חם, מעודד ונלהב. קצר 1-2 משפטים. ${gender === "male" ? "המשתתף זכר - פנה אליו בלשון זכר." : "המשתתפת נקבה - פני אליה בלשון נקבה."}`;

  const addBot = (text, delay = TYPING_DELAY) => new Promise(resolve => {
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setChatMessages(prev => [...prev, { text, isUser: false }]);
      resolve();
    }, delay);
  });

  const buildContext = () => {
    const entries = Object.entries(answers);
    if (entries.length === 0) return "";
    const lines = entries.map(([k, v]) => `${k}: ${v}`).join("\n");
    return `\n\nתשובות קודמות של ${name}:\n${lines}`;
  };

  const genReaction = async (question, answer) => {
    const ctx = buildContext();
    const { text, error } = await callClaude(
      [{ role: "user", content: `${name} ענה: "${answer}" על: "${question}"\nתגובה מצחיקה חמה 1-2 משפטים.${ctx ? " אם רלוונטי, שלב התייחסות לתשובות קודמות." : ""}` }],
      getSys() + ctx, apiKey, "claude-sonnet-4-5-20250929", 150
    );
    if (text) { setApiError(false); return text; }
    setApiError(true);
    if (error) addErrorLog("genReaction", error);
    return gender === "male" ? "מעניין מאוד! 😄" : "מעניינת מאוד! 😄";
  };

  const genFollowup = async (question, answer) => {
    const ctx = buildContext();
    const { text, error } = await callClaude(
      [{ role: "user", content: `${name} ענה: "${answer}" על: "${question}"\nשאל שאלת המשך ספציפית לתשובה. רק השאלה.${ctx ? " אפשר להתייחס לתשובות קודמות אם רלוונטי." : ""}` }],
      getSys() + ctx, apiKey, "claude-sonnet-4-5-20250929", 100
    );
    if (!text && error) addErrorLog("genFollowup", error);
    return text;
  };

  const checkGibberish = async (answer, question) => {
    if (answer.length < 2 || /^(.)\1{3,}$/.test(answer)) return true;
    const { text, error } = await callClaude(
      [{ role: "user", content: `Question asked: "${question}"\nAnswer given: "${answer}"\n\nIs this answer gibberish/random keyboard mashing, or a real attempt to answer? The answer may be in Hebrew. Reply ONLY "gibberish" or "ok". When in doubt, say "ok".` }],
      "You classify if answers are gibberish. Reply ONLY gibberish or ok. When in doubt, say ok.",
      apiKey, "claude-haiku-4-5-20251001", 10
    );
    if (!text && error) addErrorLog("checkGibberish", error);
    return text?.toLowerCase()?.includes("gibberish") || false;
  };

  const saveProgress = async (ans, qIdx, mqA, completed = false) => {
    try {
      const data = {
        name, age, gender, answers: ans,
        questionsAnswered: Object.keys(ans).length,
        mainQuestionsAnswered: mqA,
        currentQIdx: qIdx,
        totalQuestions: allQuestions.length,
        completed,
        timestamp: new Date().toISOString()
      };
      await saveShared(`player-data:${name}`, data);
    } catch (e) {
      addErrorLog("saveProgress", e.message);
    }
  };

  const getContinuePrompt = (mqCount) => {
    const interval = testMode ? 5 : 15;
    if (mqCount > 0 && mqCount % interval === 0 && mqCount < allQuestions.length && !continueFiredAt.has(mqCount)) {
      const remaining = allQuestions.length - mqCount;
      const msgs = [
        {
          msg: `וואו, כבר ${mqCount} שאלות! 🎉\n${gender === "male" ? "אתה אלוף!" : "את אלופה!"}\n\nיש לי עוד שאלות כיפיות ומפתיעות!\nככל ש${gender === "male" ? "תספר" : "תספרי"} יותר, ערב המשחק יהיה הרבה יותר כיף! 🎮\n\n${gender === "male" ? "ממשיך" : "ממשיכה"}?`,
          y: "!ברור", n: "מספיק לי 😅"
        },
        {
          msg: `${mqCount} שאלות! ${gender === "male" ? "אתה" : "את"} מכונה! 💪\n\nנשארו עוד ${remaining} שאלות מפתיעות...\nמי ש${gender === "male" ? "ממשיך" : "ממשיכה"} - מגלה עוד דברים מעניינים על עצמו!\n\nמה ${gender === "male" ? "אומר" : "אומרת"}?`,
          y: "!בוא נמשיך", n: "חלאס 🛑"
        },
        {
          msg: `כבר ${mqCount}! ${gender === "male" ? "אתה" : "את"} בטופ! 🏆\n\nעוד ${remaining} שאלות כיפיות ומשעשעות!\nהשאלות הבאות הכי מעניינות, מבטיח!\n\nנו?`,
          y: "!יאללה גמרנו את זה", n: gender === "male" ? "אני יוצא מפה 😂" : "אני יוצאת מפה 😂"
        },
      ];
      const idx = Math.min(Math.floor((mqCount / interval) - 1), msgs.length - 1);
      return msgs[idx];
    }
    return null;
  };

  const checkResume = async (playerName) => {
    setCheckingResume(true);
    const existing = await loadShared(`player-data:${playerName}`, null);
    setCheckingResume(false);
    if (existing && !existing.completed && existing.currentQIdx > 0) {
      setResumeData(existing);
      return true;
    }
    if (existing && existing.completed) {
      setResumeData({ ...existing, askRedo: true });
      return true;
    }
    return false;
  };

  const startChat = async (resumeFrom = null) => {
    const qs = getQuestions(parseInt(age), gender);
    setAllQuestions(qs);
    setScreen("chat");
    setDone(false);
    setChatMessages([]);
    setShowContinue(null);
    setAwaitingFollowup(false);
    setGibberishRetry(0);
    setCurrentQIdx(0);
    setApiError(false);
    processingRef.current = false;

    if (resumeFrom && !resumeFrom.askRedo) {
      const savedAnswers = resumeFrom.answers || {};
      const savedIdx = resumeFrom.currentQIdx || 0;
      const savedMQ = resumeFrom.mainQuestionsAnswered || 0;
      setAnswers(savedAnswers);
      setMainQAnswered(savedMQ);
      const interval = testMode ? 5 : 15;
      const fired = new Set();
      for (let i = interval; i <= savedMQ; i += interval) fired.add(i);
      setContinueFiredAt(fired);
      await addBot(`היי ${name}! 🎉\nשמח לראות אותך חוזר! נמשיך מאיפה שעצרנו? 😊`, 1500);
      await proceedToQuestion(savedIdx, savedMQ, qs);
    } else {
      setAnswers({});
      setMainQAnswered(0);
      setContinueFiredAt(new Set());
      const gw = gender === "male" ? "אח יקר" : "אחותי היקרה";
      await addBot(`היי ${name}! 🎉\nאני הדוד קלוד, ואני פה כדי להכיר אותך!\nשמעתי שמשפחת פלג מתכננת משהו מיוחד... 🤫`, 2000);
      await addBot(`בוא נדבר קצת, ${gw}! אני הולך לשאול אותך כמה שאלות כיפיות.\nככל ש${gender === "male" ? "תהיה יותר כנה" : "תהיי יותר כנה"} - ככה יהיה יותר כיף! 😄\n\n${gender === "male" ? "מוכן" : "מוכנה"}? יאללה!`, 1500);
      await proceedToQuestion(0, 0, qs);
    }
  };

  const proceedToQuestion = async (qIdx, mqCount, qsOverride = null) => {
    processingRef.current = false;
    const qs = qsOverride || allQuestions;
    if (!qs.length || qIdx >= qs.length) { await finishChat(); return; }
    const cp = getContinuePrompt(mqCount);
    if (cp) {
      setContinueFiredAt(prev => new Set([...prev, mqCount]));
      setShowContinue({ ...cp, nextIdx: qIdx, mqCount });
      return;
    }
    await addBot(qs[qIdx].q, TYPING_DELAY);
    setCurrentQIdx(qIdx);
    setGibberishRetry(0);
    setAwaitingFollowup(false);
  };

  const handleSend = async () => {
    if (processingRef.current) return;
    const text = inputValue.trim();
    if (!text || typing || done) return;
    processingRef.current = true;
    setInputValue("");
    setChatMessages(prev => [...prev, { text, isUser: true }]);

    try {
      const q = allQuestions[currentQIdx];

      if (awaitingFollowup) {
        const newAns = { ...answers, [`${q.key}_followup`]: text };
        setAnswers(newAns);
        setAwaitingFollowup(false);
        const nextMQ = mainQAnswered + 1;
        setMainQAnswered(nextMQ);
        await saveProgress(newAns, currentQIdx + 1, nextMQ);
        const reaction = await genReaction("שאלת המשך", text);
        await addBot(reaction, SHORT_DELAY);
        await proceedToQuestion(currentQIdx + 1, nextMQ);
        return;
      }

      // Run gibberish check in parallel with reaction + followup
      const [isGib, reaction, fu] = await Promise.all([
        (apiKey && !apiError) ? checkGibberish(text, q.q || "") : Promise.resolve(false),
        genReaction(q.q, text),
        (q.followup && apiKey && !apiError) ? genFollowup(q.q, text) : Promise.resolve(null)
      ]);

      // Handle gibberish result — discard reaction/followup if gibberish on first try
      if (isGib && apiKey && !apiError) {
        if (gibberishRetry === 0) {
          setGibberishRetry(1);
          await addBot(gender === "male"
            ? `אממ... ${name}, מה? 🤔\nנראה לי שהאצבעות שלך רקדו על המקלדת!\nבוא ננסה שוב, הפעם ברצינות (קצת) 😄`
            : `אממ... ${name}, מה? 🤔\nנראה לי שהאצבעות שלך רקדו על המקלדת!\nבואי ננסה שוב, הפעם ברצינות (קצת) 😄`, SHORT_DELAY);
          return;
        }
        // gibberishRetry >= 1: accept the answer, reset retry counter
        setGibberishRetry(0);
      }

      const newAns = { ...answers, [q.key]: text };
      setAnswers(newAns);

      await addBot(reaction, SHORT_DELAY);

      if (fu) {
        await saveProgress(newAns, currentQIdx, mainQAnswered);
        await addBot(fu, TYPING_DELAY);
        setAwaitingFollowup(true);
        return;
      }

      const nextMQ = mainQAnswered + 1;
      setMainQAnswered(nextMQ);
      await saveProgress(newAns, currentQIdx + 1, nextMQ);
      await proceedToQuestion(currentQIdx + 1, nextMQ);
    } catch (e) {
      console.error("handleSend error:", e);
      addErrorLog("handleSend", e.message);
      try { await addBot("אוי, משהו השתבש... בוא ננסה שוב! 😅", SHORT_DELAY); } catch (_) {}
    } finally {
      processingRef.current = false;
    }
  };

  const handleContinue = (yes) => {
    const cp = showContinue;
    setShowContinue(null);
    if (yes) setTimeout(() => proceedToQuestion(cp.nextIdx, cp.mqCount), 300);
    else finishChat();
  };

  const finishChat = async () => {
    setDone(true);
    const total = Object.keys(answers).length;
    await addBot(`🎉🎉🎉\n\nוואו ${name}! סיימנו!\nענית על ${total} שאלות ועכשיו אני מכיר אותך הרבה יותר טוב!`, 1500);
    await addBot(`תודה רבה ששיחקת איתי! 🤗\nנתראה בערב המשחק... ו${gender === "male" ? "תתכונן" : "תתכונני"} להפתעות! 😈🎮\n\nהדוד קלוד שלכם ❤️`, 1200);
    await saveProgress(answers, allQuestions.length, mainQAnswered, true);
  };

  const downloadPlayerFile = (d) => {
    try {
      const lines = [
        `שם: ${d.name}`, `גיל: ${d.age}`,
        `מין: ${d.gender === "male" ? "זכר" : "נקבה"}`,
        `תאריך: ${new Date(d.timestamp).toLocaleString("he-IL")}`,
        `שאלות: ${d.questionsAnswered}`, "", "--- תשובות ---", ""
      ];
      if (d.answers) Object.entries(d.answers).forEach(([k, v]) => lines.push(`${k}: ${v}`));
      const blob = new Blob(["\ufeff" + lines.join("\n")], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const ts = d.timestamp ? new Date(d.timestamp).toISOString().replace(/[:.]/g, "-").slice(0, 16) : "unknown";
      a.href = url; a.download = `${d.name}_${ts}.txt`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) { console.error("Download error:", e); }
  };

  const loadAllPlayers = async () => {
    setLoadingAdmin(true);
    const keys = await listShared("player-data:");
    const all = [];
    for (const k of keys) { const d = await loadShared(k, null); if (d) all.push({ ...d, storageKey: k }); }
    all.sort((a, b) => (b.questionsAnswered || 0) - (a.questionsAnswered || 0));
    setPlayerData(all);
    const logs = await loadShared("uncle-claude-errorlog", []);
    setErrorLogs(logs);
    setLoadingAdmin(false);
    if (apiKey) verifyApiKey(apiKey);
  };

  const downloadAll = () => {
    playerData.filter(d => d.questionsAnswered > 0).forEach((d, i) => setTimeout(() => downloadPlayerFile(d), i * 200));
  };

  const handleAvatarUpload = (e) => {
    const f = e.target.files[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = async () => {
        const c = document.createElement("canvas");
        let w = img.width, h = img.height; const mx = 200;
        if (w > h) { if (w > mx) { h = h * mx / w; w = mx; } } else { if (h > mx) { w = w * mx / h; h = mx; } }
        c.width = w; c.height = h; c.getContext("2d").drawImage(img, 0, 0, w, h);
        const comp = c.toDataURL("image/jpeg", 0.8);
        setUncleImg(comp);
        await saveShared("uncle-claude-avatar", comp);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(f);
  };

  const toggleTestMode = async () => {
    const nv = !testMode;
    setTestMode(nv);
    await saveShared("uncle-claude-testmode", nv);
  };

  // ── SPLASH ────────────────────────────────────────────────────────────────
  if (screen === "splash") return (
    <div style={{ fontFamily: "'Segoe UI',Tahoma,sans-serif", minHeight: "100vh", direction: "rtl" }}>
      <StarBg />
      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: 24, padding: 20 }}>
        <div style={{ position: "absolute", top: 12, left: 12 }}>
          <Btn onClick={() => setScreen("admin")} size="sm" style={{ background: "rgba(255,255,255,0.1)", padding: "6px 12px", fontSize: 12 }}>🔐</Btn>
        </div>
        <div style={{ animation: "float 3s ease-in-out infinite", textAlign: "center" }}>
          <div style={{ width: 120, height: 120, borderRadius: "50%", overflow: "hidden", margin: "0 auto 16px", border: "4px solid #f093fb", boxShadow: "0 0 30px rgba(240,147,251,0.4)" }}>
            {uncleImg
              ? <img src={uncleImg} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg,#667eea,#764ba2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 60 }}>🤖</div>
            }
          </div>
          <div style={{ fontSize: 48, fontWeight: "900", background: "linear-gradient(135deg,#f5576c,#f093fb,#4facfe)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>הדוד קלוד</div>
          <div style={{ fontSize: 22, color: "rgba(255,255,255,0.7)", marginTop: 8 }}>רוצה להכיר אתכם! 😄</div>
          <div style={{ fontSize: 16, color: "rgba(255,255,255,0.4)", marginTop: 12, maxWidth: 400, margin: "12px auto 0" }}>משפחת פלג, הדוד קלוד מחכה לכם! כנסו, ענו על כמה שאלות מטורפות, ותתכוננו לערב משחק שלא תשכחו!</div>
        </div>
        <Btn onClick={() => setScreen("intro")} size="lg" style={{ marginTop: 10 }}>🎉 יאללה, בואו נכיר!</Btn>
        {testMode && <div style={{ color: "#f5576c", fontSize: 14, marginTop: 4 }}>🧪 מצב טסט פעיל - יציאה כל 5 שאלות</div>}
      </div>
    </div>
  );

  // ── INTRO ─────────────────────────────────────────────────────────────────
  if (screen === "intro") return (
    <div style={{ fontFamily: "'Segoe UI',Tahoma,sans-serif", minHeight: "100vh", direction: "rtl" }}>
      <StarBg />
      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: 20, padding: 20 }}>
        <UncleAvatar src={uncleImg} size={70} />
        <h2 style={{ color: "white", fontSize: 28, margin: 0 }}>ספרו לי קצת על עצמכם!</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, width: "100%", maxWidth: 350 }}>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="מה השם שלך?"
            style={{ padding: "14px 20px", borderRadius: 12, border: "2px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.1)", color: "white", fontSize: 18, textAlign: "center", fontFamily: "inherit", direction: "rtl" }} />
          <input type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="בן/בת כמה?"
            style={{ padding: "14px 20px", borderRadius: 12, border: "2px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.1)", color: "white", fontSize: 18, textAlign: "center", fontFamily: "inherit" }} />
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            {[["male", "👦 בן"], ["female", "👧 בת"]].map(([g, l]) => (
              <div key={g} onClick={() => setGender(g)} style={{ flex: 1, padding: 14, borderRadius: 12, border: gender === g ? "2px solid #f5576c" : "2px solid rgba(255,255,255,0.2)", background: gender === g ? "rgba(245,87,108,0.2)" : "rgba(255,255,255,0.05)", color: "white", fontSize: 18, textAlign: "center", cursor: "pointer", transition: "all 0.3s" }}>{l}</div>
            ))}
          </div>
        </div>
        <Btn onClick={async () => {
          if (!name.trim() || !age || !gender) return;
          const hasResume = await checkResume(name.trim());
          if (hasResume) setScreen("resume");
          else startChat();
        }} disabled={!name.trim() || !age || !gender || checkingResume} size="lg" style={{ marginTop: 10 }}>
          {checkingResume ? "⏳" : "🚀 יאללה!"}
        </Btn>
        <Btn onClick={() => setScreen("splash")} size="sm" style={{ background: "rgba(255,255,255,0.15)" }}>חזרה</Btn>
      </div>
    </div>
  );

  // ── RESUME ────────────────────────────────────────────────────────────────
  if (screen === "resume") return (
    <div style={{ fontFamily: "'Segoe UI',Tahoma,sans-serif", minHeight: "100vh", direction: "rtl" }}>
      <StarBg />
      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: 24, padding: 20 }}>
        <UncleAvatar src={uncleImg} size={80} />
        {resumeData?.askRedo ? (
          <>
            <h2 style={{ color: "white", fontSize: 26, textAlign: "center" }}>היי {name}! 🎉</h2>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 18, textAlign: "center", maxWidth: 400 }}>כבר סיימת את השאלון פעם! רוצה לעשות שוב מההתחלה?</p>
            <div style={{ display: "flex", gap: 12 }}>
              <Btn onClick={() => { setResumeData(null); startChat(); }} style={{ background: "linear-gradient(135deg,#43e97b,#38f9d7)" }}>🔄 מההתחלה!</Btn>
              <Btn onClick={() => { setScreen("splash"); setResumeData(null); }} style={{ background: "rgba(255,255,255,0.2)" }}>ביטול</Btn>
            </div>
          </>
        ) : (
          <>
            <h2 style={{ color: "white", fontSize: 26, textAlign: "center" }}>היי {name}! 👋</h2>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 18, textAlign: "center", maxWidth: 400 }}>
              מצאתי שעצרת באמצע! ענית על {resumeData?.questionsAnswered || 0} שאלות.{"\n"}רוצה להמשיך מאיפה שעצרת?
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <Btn onClick={() => { startChat(resumeData); setResumeData(null); }} style={{ background: "linear-gradient(135deg,#43e97b,#38f9d7)" }}>▶️ להמשיך!</Btn>
              <Btn onClick={() => { setResumeData(null); startChat(); }}>🔄 מההתחלה</Btn>
              <Btn onClick={() => { setScreen("splash"); setResumeData(null); }} size="sm" style={{ background: "rgba(255,255,255,0.2)" }}>ביטול</Btn>
            </div>
          </>
        )}
      </div>
    </div>
  );

  // ── ADMIN ─────────────────────────────────────────────────────────────────
  if (screen === "admin") return (
    <div style={{ fontFamily: "'Segoe UI',Tahoma,sans-serif", minHeight: "100vh", direction: "rtl" }}>
      <StarBg />
      <div style={{ position: "relative", zIndex: 1, padding: 30, maxWidth: 800, margin: "0 auto" }}>
        {!adminLoggedIn ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, marginTop: "20vh" }}>
            <UncleAvatar src={uncleImg} size={60} />
            <input type="password" value={adminPass} onChange={e => setAdminPass(e.target.value)} placeholder="סיסמה"
              style={{ padding: "12px 24px", borderRadius: 12, border: "2px solid rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.1)", color: "white", fontSize: 18, textAlign: "center" }}
              onKeyDown={e => { if (e.key === "Enter" && adminPass === ADMIN_PASS) { setAdminLoggedIn(true); loadAllPlayers(); } }} />
            <div style={{ display: "flex", gap: 10 }}>
              <Btn onClick={() => { if (adminPass === ADMIN_PASS) { setAdminLoggedIn(true); loadAllPlayers(); } }}>כניסה</Btn>
              <Btn onClick={() => { setScreen("splash"); setAdminPass(""); }} size="sm" style={{ background: "rgba(255,255,255,0.2)" }}>חזרה</Btn>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h1 style={{ color: "white", margin: 0 }}>⚙️ אדמין</h1>
              <Btn onClick={() => { setScreen("splash"); setAdminLoggedIn(false); setAdminPass(""); }} size="sm" style={{ background: "rgba(255,255,255,0.2)" }}>חזרה</Btn>
            </div>

            <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 12, padding: 16, marginBottom: 12 }}>
              <h3 style={{ color: "white", margin: "0 0 10px" }}>🔑 API Key (Claude)</h3>
              <div style={{ display: "flex", gap: 10 }}>
                <input value={apiKeyInput || apiKey} onChange={e => { setApiKeyInput(e.target.value); if (apiKeyStatus) setApiKeyStatus(null); }} placeholder="sk-ant-api03-..." type="password"
                  style={{ flex: 1, padding: "10px 16px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.08)", color: "white", fontSize: 14, fontFamily: "monospace" }} />
                <Btn onClick={async () => { const key = (apiKeyInput || apiKey).trim(); if (key) { await saveShared("uncle-claude-apikey", key); setApiKey(key); setSetupDone(true); setApiKeyInput(""); verifyApiKey(key); } }} size="sm">{setupDone ? "✅ שמור" : "💾 שמור"}</Btn>
                {apiKeyStatus === "checking" && <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>⏳</span>}
                {apiKeyStatus === "ok" && <span style={{ color: "#43e97b", fontSize: 18 }}>✓</span>}
                {apiKeyStatus && apiKeyStatus.error && (
                  <span onClick={() => alert(apiKeyStatus.error)}
                    style={{ color: "#f5576c", fontSize: 18, cursor: "pointer" }} title="לחץ לפרטים">✗</span>
                )}
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
              <div style={{ flex: 1, background: "rgba(255,255,255,0.06)", borderRadius: 12, padding: 16 }}>
                <h3 style={{ color: "white", margin: "0 0 10px" }}>🖼️ תמונה</h3>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <UncleAvatar src={uncleImg} size={45} />
                  <Btn onClick={() => avatarRef.current?.click()} size="sm" style={{ background: "linear-gradient(135deg,#667eea,#764ba2)", fontSize: 13 }}>📷 החלף</Btn>
                  <input ref={avatarRef} type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: "none" }} />
                </div>
              </div>
              <div style={{ flex: 1, background: "rgba(255,255,255,0.06)", borderRadius: 12, padding: 16 }}>
                <h3 style={{ color: "white", margin: "0 0 10px" }}>🧪 מצב טסט</h3>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div onClick={toggleTestMode} style={{ width: 50, height: 28, borderRadius: 14, background: testMode ? "#43e97b" : "rgba(255,255,255,0.2)", cursor: "pointer", position: "relative", transition: "all 0.3s" }}>
                    <div style={{ width: 22, height: 22, borderRadius: "50%", background: "white", position: "absolute", top: 3, left: testMode ? 25 : 3, transition: "all 0.3s" }} />
                  </div>
                  <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>יציאה כל 5 שאלות</span>
                </div>
              </div>
            </div>

            <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 12, padding: 16, marginBottom: 12, textAlign: "center" }}>
              <div style={{ fontSize: 36, fontWeight: "bold", color: "white" }}>
                {playerData.filter(d => d.completed).length}
                <span style={{ fontSize: 20, color: "rgba(255,255,255,0.5)" }}> / {playerData.length} מילאו</span>
              </div>
              <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 10, height: 12, marginTop: 10, overflow: "hidden" }}>
                <div style={{ background: "linear-gradient(135deg,#43e97b,#38f9d7)", height: "100%", borderRadius: 10, width: playerData.length > 0 ? `${(playerData.filter(d => d.completed).length / playerData.length) * 100}%` : "0%", transition: "width 0.5s" }} />
              </div>
              <Btn onClick={loadAllPlayers} size="sm" style={{ background: "rgba(255,255,255,0.15)", marginTop: 10 }}>{loadingAdmin ? "⏳" : "🔄 רענן"}</Btn>
            </div>

            <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden", marginBottom: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 70px 50px", padding: "12px 16px", background: "rgba(255,255,255,0.05)", fontWeight: "bold", color: "rgba(255,255,255,0.7)", fontSize: 14 }}>
                <span>שם</span><span style={{ textAlign: "center" }}>שאלות</span><span style={{ textAlign: "center" }}>סטטוס</span><span style={{ textAlign: "center" }}>📥</span><span style={{ textAlign: "center" }}>🗑️</span>
              </div>
              {playerData.length === 0
                ? <div style={{ padding: 20, textAlign: "center", color: "rgba(255,255,255,0.4)" }}>{loadingAdmin ? "טוען..." : "אין נתונים"}</div>
                : playerData.map((d, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 70px 50px", padding: "10px 16px", borderTop: "1px solid rgba(255,255,255,0.06)", alignItems: "center" }}>
                    <span style={{ color: "white", fontWeight: "bold" }}>{d.name}</span>
                    <span style={{ color: "rgba(255,255,255,0.6)", textAlign: "center" }}>{d.questionsAnswered || 0}</span>
                    <span style={{ textAlign: "center", fontSize: 20 }}>{d.completed ? "✅" : d.questionsAnswered > 0 ? "⏳" : "❌"}</span>
                    <span style={{ textAlign: "center" }}>
                      {d.questionsAnswered > 0 && <Btn onClick={() => downloadPlayerFile(d)} size="sm" style={{ padding: "3px 8px", fontSize: 12, background: "linear-gradient(135deg,#667eea,#764ba2)" }}>📥</Btn>}
                    </span>
                    <span style={{ textAlign: "center" }}>
                      <Btn onClick={async () => { await deleteShared(d.storageKey); setPlayerData(prev => prev.filter((_, j) => j !== i)); }} size="sm" style={{ padding: "3px 8px", fontSize: 12, background: "#e74c3c" }}>🗑️</Btn>
                    </span>
                  </div>
                ))
              }
            </div>
            {playerData.filter(d => d.questionsAnswered > 0).length > 0 && (
              <div style={{ textAlign: "center" }}>
                <Btn onClick={downloadAll} style={{ background: "linear-gradient(135deg,#43e97b,#38f9d7)" }}>
                  📥 הורד הכל ({playerData.filter(d => d.questionsAnswered > 0).length})
                </Btn>
              </div>
            )}

            <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 12, padding: 16, marginTop: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <h3 style={{ color: "white", margin: 0 }}>📋 לוג שגיאות (אחרונות 5)</h3>
                {errorLogs.length > 0 && (
                  <Btn onClick={async () => { await saveShared("uncle-claude-errorlog", []); setErrorLogs([]); }} size="sm" style={{ background: "#e74c3c", padding: "4px 12px", fontSize: 12 }}>נקה לוג</Btn>
                )}
              </div>
              {errorLogs.length === 0
                ? <div style={{ color: "rgba(255,255,255,0.4)", textAlign: "center", padding: 12 }}>אין שגיאות</div>
                : errorLogs.map((log, i) => (
                  <div key={i} style={{ borderTop: i > 0 ? "1px solid rgba(255,255,255,0.06)" : "none", padding: "8px 0", direction: "ltr", textAlign: "left" }}>
                    <div style={{ display: "flex", gap: 8, fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>
                      <span>{new Date(log.time).toLocaleString("he-IL")}</span>
                      <span style={{ color: "#f5576c", fontWeight: "bold" }}>[{log.source}]</span>
                    </div>
                    <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, wordBreak: "break-all" }}>{log.message}</div>
                  </div>
                ))
              }
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // ── CHAT ──────────────────────────────────────────────────────────────────
  if (screen === "chat") return (
    <div style={{ fontFamily: "'Segoe UI',Tahoma,sans-serif", minHeight: "100vh", direction: "rtl", display: "flex", flexDirection: "column" }}>
      <StarBg />
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 10, background: "rgba(10,10,46,0.95)", backdropFilter: "blur(10px)", padding: "10px 20px", display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        <UncleAvatar src={uncleImg} size={40} />
        <div style={{ flex: 1 }}>
          <div style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>הדוד קלוד</div>
          <div style={{ color: "#43e97b", fontSize: 12 }}>מחובר ●</div>
        </div>
        <div onClick={() => setShowExitPrompt(true)} style={{ cursor: "pointer", fontSize: 16, opacity: 0.5, padding: "6px 10px", color: "white", background: "rgba(255,255,255,0.1)", borderRadius: 8 }}>✕</div>
      </div>

      {apiError && (
        <div style={{ position: "fixed", top: 62, left: 0, right: 0, zIndex: 10, background: "rgba(245,87,108,0.15)", padding: "6px 16px", textAlign: "center", fontSize: 13, color: "rgba(255,255,255,0.7)", direction: "rtl" }}>
          הדוד קלוד לא מצליח להתחבר - תשובות אוטומטיות
        </div>
      )}

      {showExitPrompt && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "linear-gradient(135deg,#1a1a4e,#2d1b69)", borderRadius: 20, padding: 30, maxWidth: 350, width: "90%", textAlign: "center", direction: "rtl" }}>
            <div style={{ fontSize: 30, marginBottom: 12 }}>🔐</div>
            <p style={{ color: "white", fontSize: 16, marginBottom: 16 }}>סיסמת אדמין ליציאה:</p>
            <input type="password" value={exitPass} onChange={e => setExitPass(e.target.value)} placeholder="סיסמה"
              style={{ padding: "10px 16px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.1)", color: "white", fontSize: 16, textAlign: "center", width: "80%", marginBottom: 16 }}
              onKeyDown={e => { if (e.key === "Enter" && exitPass === ADMIN_PASS) { finishChat(); setShowExitPrompt(false); setExitPass(""); } }} />
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <Btn onClick={() => { if (exitPass === ADMIN_PASS) { finishChat(); setShowExitPrompt(false); setExitPass(""); } }} size="sm">יציאה</Btn>
              <Btn onClick={() => { setShowExitPrompt(false); setExitPass(""); }} size="sm" style={{ background: "rgba(255,255,255,0.2)" }}>ביטול</Btn>
            </div>
          </div>
        </div>
      )}

      <div style={{ flex: 1, overflowY: "auto", padding: "70px 16px 80px", position: "relative", zIndex: 1 }}>
        {chatMessages.map((m, i) => <ChatBubble key={i} text={m.text} isUser={m.isUser} avatarSrc={uncleImg} />)}
        {typing && (
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end", marginBottom: 10 }}>
            <UncleAvatar src={uncleImg} size={32} />
            <TypingIndicator />
          </div>
        )}
        {showContinue && (
          <div style={{ animation: "popIn 0.4s", textAlign: "center", margin: "20px 0" }}>
            <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 16, padding: 20, maxWidth: 400, margin: "0 auto" }}>
              <div style={{ color: "white", fontSize: 18, lineHeight: 1.6, whiteSpace: "pre-wrap", marginBottom: 16 }}>{showContinue.msg}</div>
              <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                <Btn onClick={() => handleContinue(true)} style={{ background: "linear-gradient(135deg,#43e97b,#38f9d7)" }}>{showContinue.y}</Btn>
                <Btn onClick={() => handleContinue(false)} style={{ background: "rgba(255,255,255,0.2)" }}>{showContinue.n}</Btn>
              </div>
            </div>
          </div>
        )}
        {done && (
          <div style={{ textAlign: "center", margin: "20px 0", animation: "popIn 0.5s" }}>
            <div style={{ fontSize: 60 }}>🎉</div>
            <Btn onClick={() => { setScreen("splash"); setChatMessages([]); setAnswers({}); setDone(false); setName(""); setAge(""); setGender(null); setMainQAnswered(0); setCurrentQIdx(0); }} size="sm" style={{ background: "rgba(255,255,255,0.2)", marginTop: 12 }}>סגור</Btn>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {!done && !showContinue && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 10, background: "rgba(10,10,46,0.95)", backdropFilter: "blur(10px)", padding: "10px 16px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ display: "flex", gap: 10, maxWidth: 600, margin: "0 auto" }}>
            <input ref={inputRef} value={inputValue} onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleSend(); }}
              placeholder={typing ? "הדוד קלוד מקליד..." : "הקלד/י תשובה..."}
              disabled={typing}
              style={{ flex: 1, padding: "12px 18px", borderRadius: 24, border: "2px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.08)", color: "white", fontSize: 16, fontFamily: "inherit", direction: "rtl" }} />
            <Btn onClick={handleSend} disabled={typing || !inputValue.trim()} size="sm" style={{ borderRadius: 24, padding: "12px 20px" }}>שלח</Btn>
          </div>
        </div>
      )}
    </div>
  );

  return null;
}
