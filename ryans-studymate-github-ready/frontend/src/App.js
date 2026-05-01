import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import "@/App.css";
import axios from "axios";
import { toPng } from "html-to-image";
import {
  House,
  BookOpen,
  Timer,
  Alarm,
  ChartBar,
  ClockCounterClockwise,
  Gear,
  Plus,
  Trash,
  Play,
  Pause,
  ArrowClockwise,
  DownloadSimple,
  UploadSimple,
  MusicNote,
  Flame,
  Target,
  PencilSimple,
  Check,
  X,
  Notebook,
  Exam,
  ShareNetwork,
  Sparkle,
} from "@phosphor-icons/react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Dot,
} from "recharts";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ACCENTS = ["#FFD600", "#00C896", "#5BC0EB", "#B388FF", "#FF6B6B", "#FFB38A", "#FF8AD8", "#7CFFCB", "#8AB4FF", "#F97316", "#A3E635", "#F43F5E"];
const MOODS = [
  { id: "great", emoji: "🤩", label: "great", color: "#00C896" },
  { id: "good", emoji: "😊", label: "good", color: "#FFD600" },
  { id: "okay", emoji: "🙂", label: "okay", color: "#FFB38A" },
  { id: "meh", emoji: "😐", label: "meh", color: "#B388FF" },
  { id: "bad", emoji: "😩", label: "bad", color: "#FF6B6B" },
];

// ============ Helpers ============
const fmtMins = (m) => {
  if (!m && m !== 0) return "0 min";
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h && r) return `${h} hr ${r} min`;
  if (h) return `${h} hr`;
  return `${r} min`;
};
const todayStr = () => new Date().toISOString().slice(0, 10);
const addDays = (date, count) => {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + count);
  return copy;
};
const dateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
const parseDateKey = (value) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
};
const startOfWeek = (date) => {
  const copy = new Date(date);
  const day = copy.getDay() || 7;
  copy.setDate(copy.getDate() - day + 1);
  copy.setHours(0, 0, 0, 0);
  return copy;
};
const monthGridDays = (selectedDate) => {
  const first = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
  const start = startOfWeek(first);
  return Array.from({ length: 42 }, (_, index) => addDays(start, index));
};

// ============ Duration Chip — BLACK text on bright bg (user requirement) ============
const DurationChip = ({ minutes, color = "#FFD600", testid, rotate = 0 }) => (
  <span
    data-testid={testid}
    className="inline-flex items-center px-3 py-1 rounded-full font-bold text-black border-2 border-[#1a1a2e]"
    style={{
      background: color,
      fontFamily: "JetBrains Mono, monospace",
      transform: rotate ? `rotate(${rotate}deg)` : undefined,
      boxShadow: "2px 2px 0 #1a1a2e",
    }}
  >
    {fmtMins(minutes)}
  </span>
);

// ============ Sidebar ============
const Sidebar = ({ active, onChange }) => {
  const items = [
    { id: "today", label: "Today", icon: House, color: "#FFD600" },
    { id: "subjects", label: "Subjects", icon: BookOpen, color: "#5BC0EB" },
    { id: "pomodoro", label: "Pomodoro", icon: Timer, color: "#FF6B6B" },
    { id: "schedule", label: "Schedule", icon: Alarm, color: "#B388FF" },
    { id: "journal", label: "Journal", icon: Notebook, color: "#FFB38A" },
    { id: "mocks", label: "Mock Tests", icon: Exam, color: "#00C896" },
    { id: "stats", label: "Stats", icon: ChartBar, color: "#FFD600" },
    { id: "records", label: "Records", icon: ClockCounterClockwise, color: "#5BC0EB" },
    { id: "settings", label: "Settings", icon: Gear, color: "#B388FF" },
  ];
  return (
    <aside className="w-64 shrink-0 h-screen sticky top-0 p-5 flex flex-col" style={{ borderRight: "2px solid #1a1a2e", background: "#FFF7E3" }}>
      <div className="mb-8 px-2">
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center justify-center h-10 w-10 rounded-2xl border-2 border-[#1a1a2e] text-2xl"
            style={{ background: "#FFD600", boxShadow: "3px 3px 0 #1a1a2e" }}
          >
            <Sparkle weight="fill" size={22} />
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#1a1a2e]" style={{ fontFamily: "Bricolage Grotesque" }}>
            Studi<span className="text-[#FF6B6B]">.</span>
          </h1>
        </div>
        <p className="text-xs text-[#4b4b63] mt-2 ml-1" style={{ fontFamily: "DM Sans" }}>
          your playful study buddy
        </p>
      </div>
      <nav className="flex flex-col gap-1.5">
        {items.map(({ id, label, icon: Icon, color }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              data-testid={`nav-${id}`}
              onClick={() => onChange(id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl text-left transition-all duration-150 ${
                isActive ? "border-2 border-[#1a1a2e] font-bold text-[#1a1a2e]" : "text-[#4b4b63] hover:bg-white/60 border-2 border-transparent"
              }`}
              style={{
                fontFamily: "DM Sans",
                background: isActive ? color : "transparent",
                boxShadow: isActive ? "3px 3px 0 #1a1a2e" : "none",
                transform: isActive ? "translate(-1px,-1px)" : "none",
              }}
            >
              <Icon size={20} weight={isActive ? "fill" : "regular"} />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>
      <div className="mt-auto px-2 text-[10px] text-[#8e8ea3] tracking-widest uppercase">focus · log · grow</div>
    </aside>
  );
};

// ============ Share Streak Card ============
const ShareStreakCard = ({ streak, todayStats, weekly, onClose }) => {
  const ref = useRef(null);
  const [busy, setBusy] = useState(false);
  const totalWeek = (weekly?.days || []).reduce((a, b) => a + b.minutes, 0);

  const download = async () => {
    if (!ref.current) return;
    setBusy(true);
    try {
      const dataUrl = await toPng(ref.current, { pixelRatio: 2, cacheBust: true });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `studi-streak-${todayStr()}.png`;
      a.click();
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1a1a2e]/60 backdrop-blur-sm" data-testid="share-modal">
      <div className="max-w-lg w-full">
        <div className="flex items-center justify-between mb-3">
          <div className="font-bold text-white text-lg" style={{ fontFamily: "Bricolage Grotesque" }}>
            Share my streak ✨
          </div>
          <button onClick={onClose} className="bg-white nb-btn px-3 py-1.5 text-sm" data-testid="share-close-btn">
            Close
          </button>
        </div>

        <div
          ref={ref}
          data-testid="share-card"
          className="rounded-3xl p-8 relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg,#FFD600 0%,#FFB38A 50%,#FF6B6B 100%)",
            border: "3px solid #1a1a2e",
            boxShadow: "8px 8px 0 #1a1a2e",
          }}
        >
          <div className="absolute -top-6 -right-6 h-32 w-32 rounded-full" style={{ background: "#5BC0EB", border: "3px solid #1a1a2e" }} />
          <div className="absolute -bottom-8 -left-4 h-24 w-24 rounded-full" style={{ background: "#B388FF", border: "3px solid #1a1a2e" }} />
          <div className="relative">
            <div className="flex items-center gap-2 text-[#1a1a2e] font-bold uppercase tracking-widest text-xs">
              <Sparkle weight="fill" /> studi · streak
            </div>
            <div className="mt-4 flex items-end gap-3">
              <div className="text-8xl font-extrabold text-[#1a1a2e] leading-none" style={{ fontFamily: "Bricolage Grotesque" }}>
                {streak?.current || 0}
              </div>
              <div className="pb-2 text-[#1a1a2e] text-xl font-bold">days strong 🔥</div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="bg-white/90 rounded-2xl p-4 border-2 border-[#1a1a2e]">
                <div className="text-[10px] uppercase tracking-widest text-[#4b4b63]">today</div>
                <div className="mt-1 inline-block text-xl font-bold text-black px-3 py-1 rounded-full bg-[#FFD600] border-2 border-[#1a1a2e]" style={{ fontFamily: "JetBrains Mono" }}>
                  {fmtMins(todayStats?.total_minutes || 0)}
                </div>
              </div>
              <div className="bg-white/90 rounded-2xl p-4 border-2 border-[#1a1a2e]">
                <div className="text-[10px] uppercase tracking-widest text-[#4b4b63]">this week</div>
                <div className="mt-1 inline-block text-xl font-bold text-black px-3 py-1 rounded-full bg-[#00C896] border-2 border-[#1a1a2e]" style={{ fontFamily: "JetBrains Mono" }}>
                  {fmtMins(totalWeek)}
                </div>
              </div>
            </div>
            <div className="mt-6 flex items-end justify-between gap-2 h-20">
              {(weekly?.days || []).map((d, i) => {
                const max = Math.max(1, ...(weekly?.days || []).map((x) => x.minutes));
                const h = Math.max(6, (d.minutes / max) * 70);
                return (
                  <div key={d.date} className="flex flex-col items-center gap-1 flex-1">
                    <div
                      className="w-full rounded-t-md border-2 border-[#1a1a2e]"
                      style={{ height: h, background: ACCENTS[i % ACCENTS.length] }}
                    />
                    <span className="text-[10px] font-bold text-[#1a1a2e]">{d.label[0]}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-5 text-[#1a1a2e] text-sm font-bold">made with Studi · join the streak</div>
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={download}
            disabled={busy}
            data-testid="share-download-btn"
            className="bg-[#FFD600] nb-btn px-5 py-2.5 inline-flex items-center gap-2"
          >
            <DownloadSimple size={18} weight="bold" /> {busy ? "Rendering..." : "Download PNG"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============ Today View ============
const TodayView = ({ subjects, todayStats, streak, weekly, onLogged, settings }) => {
  const [subjectId, setSubjectId] = useState("");
  const [duration, setDuration] = useState(25);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    if (!subjectId && subjects.length) setSubjectId(subjects[0].id);
  }, [subjects, subjectId]);

  const goal = settings?.daily_goal_minutes || 240;
  const total = todayStats?.total_minutes || 0;
  const pct = Math.min(100, Math.round((total / goal) * 100));

  const submit = async (e) => {
    e.preventDefault();
    if (!subjectId || duration <= 0) return;
    setSubmitting(true);
    try {
      await axios.post(`${API}/sessions`, {
        subject_id: subjectId,
        duration_minutes: Number(duration),
        notes,
        date: todayStr(),
      });
      setNotes("");
      onLogged();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-5xl font-extrabold tracking-tight text-[#1a1a2e]" style={{ fontFamily: "Bricolage Grotesque" }}>
            Today<span className="text-[#FF6B6B]">.</span>
          </h2>
          <p className="text-[#4b4b63] mt-1">{new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</p>
        </div>
        <button
          onClick={() => setShareOpen(true)}
          data-testid="share-streak-btn"
          className="bg-[#B388FF] nb-btn px-4 py-2 inline-flex items-center gap-2"
        >
          <ShareNetwork weight="bold" size={18} /> Share my streak
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div data-testid="card-daily-goal" className="lg:col-span-2 nb-card p-6 relative" style={{ background: "#FFF" }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-[#4b4b63] text-sm font-bold uppercase tracking-widest">
              <Target size={18} weight="duotone" /> Daily Goal
            </div>
            <DurationChip minutes={goal} color="#5BC0EB" testid="goal-chip" rotate={2} />
          </div>
          <div className="flex items-end gap-4 mb-4">
            <div className="text-7xl font-extrabold text-[#1a1a2e] leading-none" style={{ fontFamily: "Bricolage Grotesque" }}>
              {pct}%
            </div>
            <div className="pb-2">
              <DurationChip minutes={total} color="#FFD600" testid="today-total-chip" rotate={-2} />
              <div className="text-xs text-[#4b4b63] mt-2 font-bold uppercase tracking-widest">studied today</div>
            </div>
          </div>
          <div className="h-4 w-full rounded-full overflow-hidden border-2 border-[#1a1a2e] bg-[#FFEFC2]">
            <div
              data-testid="goal-progress-bar"
              className="h-full transition-all duration-500"
              style={{ width: `${pct}%`, background: "linear-gradient(90deg,#FFD600,#00C896)" }}
            />
          </div>
        </div>

        <div data-testid="card-streak" className="nb-card p-6 flex flex-col justify-between" style={{ background: "#FF6B6B" }}>
          <div className="flex items-center gap-2 text-[#1a1a2e] text-sm font-bold uppercase tracking-widest">
            <Flame size={18} weight="fill" /> Streak
          </div>
          <div>
            <div className="text-7xl font-extrabold text-[#1a1a2e]" style={{ fontFamily: "Bricolage Grotesque" }}>
              {streak?.current || 0}
              <span className="text-2xl text-[#1a1a2e]/70 font-bold"> days</span>
            </div>
            <div className="mt-3 flex gap-2 flex-wrap">
              <span className="sticker text-xs" style={{ background: "#FFD600" }}>longest {streak?.longest || 0}d</span>
              <span className="sticker text-xs" style={{ background: "#FFF" }}>active {streak?.active_days || 0}d</span>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={submit} data-testid="form-log-session" className="nb-card p-6">
        <h3 className="text-2xl font-extrabold text-[#1a1a2e] mb-4" style={{ fontFamily: "Bricolage Grotesque" }}>
          Log a study session ✏️
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select data-testid="log-subject-select" value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="nb-input">
            {subjects.length === 0 && <option value="">No subjects — add one first</option>}
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <input data-testid="log-duration-input" type="number" min="1" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="Minutes" className="nb-input" />
          <input data-testid="log-notes-input" type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (optional)" className="nb-input" />
          <button data-testid="log-submit-btn" type="submit" disabled={submitting || !subjectId} className="nb-btn bg-[#FFD600] text-[#1a1a2e] px-4 py-2.5 disabled:opacity-50">
            {submitting ? "Saving..." : "Log Session"}
          </button>
        </div>
      </form>

      {todayStats && Object.keys(todayStats.by_subject || {}).length > 0 && (
        <div className="nb-card p-6">
          <h3 className="text-xl font-extrabold text-[#1a1a2e] mb-4" style={{ fontFamily: "Bricolage Grotesque" }}>
            Today by subject
          </h3>
          <div className="flex flex-wrap gap-3" data-testid="today-by-subject">
            {Object.entries(todayStats.by_subject).map(([name, mins], idx) => (
              <div key={name} className="flex items-center gap-2 nb-card-soft px-3 py-1.5">
                <span className="text-sm font-bold text-[#1a1a2e]">{name}</span>
                <DurationChip minutes={mins} color={ACCENTS[idx % ACCENTS.length]} />
              </div>
            ))}
          </div>
        </div>
      )}

      {shareOpen && <ShareStreakCard streak={streak} todayStats={todayStats} weekly={weekly} onClose={() => setShareOpen(false)} />}
    </div>
  );
};

// ============ Subjects View ============
const SubjectsView = ({ subjects, refresh }) => {
  const [name, setName] = useState("");
  const [color, setColor] = useState(ACCENTS[0]);
  const [target, setTarget] = useState(60);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editTarget, setEditTarget] = useState(60);
  const [editColor, setEditColor] = useState(ACCENTS[0]);

  const add = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    await axios.post(`${API}/subjects`, { name: name.trim(), color, target_minutes_daily: Number(target) });
    setName("");
    setTarget(60);
    refresh();
  };
  const remove = async (id) => {
    if (!window.confirm("Delete this subject? Past sessions are kept.")) return;
    await axios.delete(`${API}/subjects/${id}`);
    refresh();
  };
  const startEdit = (s) => { setEditingId(s.id); setEditName(s.name); setEditTarget(s.target_minutes_daily); setEditColor(s.color || ACCENTS[0]); };
  const saveEdit = async (id) => {
    await axios.put(`${API}/subjects/${id}`, { name: editName, color: editColor, target_minutes_daily: Number(editTarget) });
    setEditingId(null);
    refresh();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-5xl font-extrabold tracking-tight text-[#1a1a2e]" style={{ fontFamily: "Bricolage Grotesque" }}>
        Subjects<span className="text-[#5BC0EB]">.</span>
      </h2>

      <form onSubmit={add} data-testid="form-add-subject" className="nb-card p-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <input data-testid="subject-name-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Subject name (e.g. Mathematics)" className="md:col-span-4 nb-input" />
          <input data-testid="subject-target-input" type="number" min="1" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="Daily target (min)" className="md:col-span-2 nb-input" />
          <div className="md:col-span-3 flex items-center gap-2 nb-input overflow-x-auto" style={{ padding: "8px 12px" }}>
            {ACCENTS.map((c) => (
              <button type="button" key={c} aria-label={`color-${c}`} onClick={() => setColor(c)}
                className={`h-6 w-6 rounded-full border-2 border-[#1a1a2e] transition-transform shrink-0 ${color === c ? "scale-125" : ""}`}
                style={{ background: c }} />
            ))}
          </div>
          <input data-testid="subject-custom-color" type="color" value={color} onChange={(e) => setColor(e.target.value)} className="md:col-span-1 nb-input h-full p-1" aria-label="Custom subject color" />
          <button data-testid="add-subject-btn" type="submit" className="md:col-span-2 nb-btn bg-[#00C896] text-[#1a1a2e] px-4 py-2.5 inline-flex items-center justify-center gap-2">
            <Plus size={18} weight="bold" /> Add
          </button>
        </div>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="subjects-list">
        {subjects.length === 0 && <div className="md:col-span-2 text-center py-10 text-[#4b4b63]">No subjects yet. Add your first one above.</div>}
        {subjects.map((s) => (
          <div key={s.id} className="nb-card p-5 flex items-center justify-between gap-4" style={{ background: s.color + "33" }} data-testid={`subject-card-${s.id}`}>
            <div className="flex-1 min-w-0">
              {editingId === s.id ? (
                <div className="flex flex-col gap-2">
                  <input value={editName} onChange={(e) => setEditName(e.target.value)} className="nb-input text-sm" />
                  <input type="number" value={editTarget} onChange={(e) => setEditTarget(e.target.value)} className="nb-input text-sm w-32" />
                  <input type="color" value={editColor} onChange={(e) => setEditColor(e.target.value)} className="nb-input h-11 w-32 p-1" aria-label="Edit subject color" />
                </div>
              ) : (
                <>
                  <div className="text-xl font-extrabold text-[#1a1a2e] truncate" style={{ fontFamily: "Bricolage Grotesque" }}>{s.name}</div>
                  <div className="flex items-center gap-2 mt-2 text-xs text-[#4b4b63]">
                    <span className="font-bold uppercase tracking-widest">target</span>
                    <DurationChip minutes={s.target_minutes_daily} color={s.color} />
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              {editingId === s.id ? (
                <>
                  <button onClick={() => saveEdit(s.id)} className="nb-btn p-2 bg-[#00C896]" data-testid={`save-subject-${s.id}`}><Check size={16} weight="bold" /></button>
                  <button onClick={() => setEditingId(null)} className="nb-btn p-2 bg-white"><X size={16} weight="bold" /></button>
                </>
              ) : (
                <>
                  <button onClick={() => startEdit(s)} className="nb-btn p-2 bg-white" data-testid={`edit-subject-${s.id}`}><PencilSimple size={16} /></button>
                  <button onClick={() => remove(s.id)} className="nb-btn p-2 bg-[#FF6B6B]" data-testid={`delete-subject-${s.id}`}><Trash size={16} /></button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============ Pomodoro View ============
const PomodoroView = ({ subjects, settings, onLogged }) => {
  const [workMinutes, setWorkMinutes] = useState(settings?.pomodoro_work || 25);
  const [breakMinutes, setBreakMinutes] = useState(settings?.pomodoro_break || 5);
  const [subjectId, setSubjectId] = useState("");
  const [pomodoro, setPomodoro] = useState({
    isRunning: false,
    mode: "work",
    workDuration: (settings?.pomodoro_work || 25) * 60,
    breakDuration: (settings?.pomodoro_break || 5) * 60,
    timeLeft: (settings?.pomodoro_work || 25) * 60,
    interval: null,
    currentSubject: null,
  });
  const pomodoroRef = useRef(pomodoro);
  const audioRef = useRef(null);

  useEffect(() => { if (subjects.length && !subjectId) setSubjectId(subjects[0].id); }, [subjects, subjectId]);
  useEffect(() => { pomodoroRef.current = pomodoro; }, [pomodoro]);

  const playBeep = useCallback(() => {
    try {
      if (audioRef.current) audioRef.current.close();
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      audioRef.current = ctx;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.value = 880;
      g.gain.setValueAtTime(0.3, ctx.currentTime);
      o.start(); o.stop(ctx.currentTime + 0.6);
    } catch (e) { /* ignore */ }
  }, []);

  const stopPomodoroClock = useCallback(() => {
    const current = pomodoroRef.current;
    if (current?.interval) clearInterval(current.interval);
    setPomodoro((p) => ({ ...p, isRunning: false, interval: null }));
  }, []);

  const updateDurations = useCallback((workValue, breakValue) => {
    const workDuration = Math.max(1, Number(workValue || 25)) * 60;
    const breakDuration = Math.max(1, Number(breakValue || 5)) * 60;
    stopPomodoroClock();
    setPomodoro((p) => ({
      ...p,
      mode: "work",
      workDuration,
      breakDuration,
      timeLeft: workDuration,
      interval: null,
    }));
  }, [stopPomodoroClock]);

  useEffect(() => {
    if (!settings) return;
    const nextWork = settings.pomodoro_work || 25;
    const nextBreak = settings.pomodoro_break || 5;
    setWorkMinutes(nextWork);
    setBreakMinutes(nextBreak);
    updateDurations(nextWork, nextBreak);
  }, [settings, updateDurations]);

  useEffect(() => () => stopPomodoroClock(), [stopPomodoroClock]);

  const saveDurationSettings = async () => {
    const nextWork = Math.max(1, Number(workMinutes || 25));
    const nextBreak = Math.max(1, Number(breakMinutes || 5));
    updateDurations(nextWork, nextBreak);
    await axios.put(`${API}/settings`, {
      daily_goal_minutes: settings?.daily_goal_minutes || 240,
      pomodoro_work: nextWork,
      pomodoro_break: nextBreak,
    });
    onLogged && onLogged();
  };

  const startPomodoro = () => {
    if (pomodoroRef.current.isRunning) return;
    const interval = setInterval(() => {
      setPomodoro((current) => {
        if (current.timeLeft > 1) return { ...current, timeLeft: current.timeLeft - 1 };

        clearInterval(current.interval);
        playBeep();
        if (current.mode === "work" && current.currentSubject) {
          axios.post(`${API}/sessions`, {
            subject_id: current.currentSubject,
            duration_minutes: Math.round(current.workDuration / 60),
            notes: "Pomodoro session",
            date: todayStr(),
          }).then(() => onLogged && onLogged());
        }
        const nextMode = current.mode === "work" ? "break" : "work";
        const nextTime = nextMode === "work" ? current.workDuration : current.breakDuration;
        return { ...current, isRunning: false, mode: nextMode, timeLeft: nextTime, interval: null };
      });
    }, 1000);

    setPomodoro((p) => ({ ...p, isRunning: true, interval, currentSubject: subjectId }));
  };

  const resetPomodoro = () => {
    stopPomodoroClock();
    setPomodoro((p) => ({ ...p, mode: "work", timeLeft: p.workDuration, interval: null, currentSubject: subjectId || null }));
  };

  const switchMode = (nextMode) => {
    stopPomodoroClock();
    setPomodoro((p) => ({ ...p, mode: nextMode, timeLeft: nextMode === "work" ? p.workDuration : p.breakDuration, interval: null }));
  };

  const total = pomodoro.mode === "work" ? pomodoro.workDuration : pomodoro.breakDuration;
  const pct = total ? ((total - pomodoro.timeLeft) / total) * 100 : 0;
  const min = Math.floor(pomodoro.timeLeft / 60);
  const sec = pomodoro.timeLeft % 60;
  const ringColor = pomodoro.mode === "work" ? "#00C896" : "#5BC0EB";
  const RADIUS = 110;
  const CIRC = 2 * Math.PI * RADIUS;
  const dash = (pct / 100) * CIRC;

  return (
    <div className="space-y-6">
      <h2 className="text-5xl font-extrabold tracking-tight text-[#1a1a2e]" style={{ fontFamily: "Bricolage Grotesque" }}>
        Pomodoro<span className="text-[#FF6B6B]">.</span>
      </h2>
      <div className="nb-card p-8 flex flex-col items-center" style={{ background: "#FFF" }}>
        <div className="flex gap-2 mb-6">
          <button data-testid="pomo-mode-work" onClick={() => switchMode("work")}
            className={`nb-btn px-4 py-2 text-sm ${pomodoro.mode === "work" ? "bg-[#00C896]" : "bg-white"}`}>
            Work · {settings?.pomodoro_work || 25}m
          </button>
          <button data-testid="pomo-mode-break" onClick={() => switchMode("break")}
            className={`nb-btn px-4 py-2 text-sm ${pomodoro.mode === "break" ? "bg-[#5BC0EB]" : "bg-white"}`}>
            Break · {settings?.pomodoro_break || 5}m
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6 w-full max-w-2xl">
          <input data-testid="pomo-work-duration" type="number" min="1" max="180" value={workMinutes} onChange={(e) => setWorkMinutes(e.target.value)} className="nb-input text-sm" placeholder="Work minutes" />
          <input data-testid="pomo-break-duration" type="number" min="1" max="60" value={breakMinutes} onChange={(e) => setBreakMinutes(e.target.value)} className="nb-input text-sm" placeholder="Break minutes" />
          <button data-testid="pomo-save-durations" onClick={saveDurationSettings} className="nb-btn bg-[#5BC0EB] px-4 py-2 text-sm">Save durations</button>
        </div>
        <div className="relative" style={{ width: 260, height: 260 }}>
          <svg width="260" height="260" className="-rotate-90">
            <circle cx="130" cy="130" r={RADIUS} stroke="#FFEFC2" strokeWidth="14" fill="none" />
            <circle cx="130" cy="130" r={RADIUS} stroke={ringColor} strokeWidth="14" fill="none"
              strokeDasharray={`${dash} ${CIRC}`} strokeLinecap="round" style={{ transition: "stroke-dasharray 0.5s linear" }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div data-testid="pomo-time" className="text-6xl font-bold text-[#1a1a2e] tabular-nums" style={{ fontFamily: "JetBrains Mono" }}>
              {String(min).padStart(2, "0")}:{String(sec).padStart(2, "0")}
            </div>
            <div className="text-xs uppercase tracking-widest text-[#4b4b63] mt-2 font-bold">{pomodoro.mode}</div>
          </div>
        </div>
        <div className="mt-6 flex items-center gap-3 flex-wrap justify-center">
          <select data-testid="pomo-subject-select" value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="nb-input text-sm">
            {subjects.length === 0 && <option value="">Add subjects first</option>}
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <button data-testid="pomo-toggle-btn" onClick={pomodoro.isRunning ? stopPomodoroClock : startPomodoro} disabled={!subjectId && pomodoro.mode === "work"}
            className="nb-btn bg-[#FFD600] px-6 py-3 inline-flex items-center gap-2 disabled:opacity-50">
            {pomodoro.isRunning ? <Pause weight="fill" size={18} /> : <Play weight="fill" size={18} />}
            {pomodoro.isRunning ? "Pause" : "Start"}
          </button>
          <button data-testid="pomo-reset-btn" onClick={resetPomodoro} className="nb-btn bg-white px-4 py-3">
            <ArrowClockwise size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

// ============ Planner View ============
const PLANNER_KEY = "studi.planner.tasks.v1";

const PlannerView = ({ subjects }) => {
  const [view, setView] = useState("daily");
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [title, setTitle] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [tasks, setTasks] = useState(() => {
    try { return JSON.parse(localStorage.getItem(PLANNER_KEY) || "[]"); } catch { return []; }
  });

  useEffect(() => { if (subjects.length && !subjectId) setSubjectId(subjects[0].id); }, [subjects, subjectId]);
  useEffect(() => { localStorage.setItem(PLANNER_KEY, JSON.stringify(tasks)); }, [tasks]);

  const subjectFor = (id) => subjects.find((s) => s.id === id) || { name: "General", color: "#FFD600" };
  const addTask = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setTasks((items) => [...items, {
      id: crypto.randomUUID(),
      title: title.trim(),
      date: selectedDate,
      subjectId,
      done: false,
    }]);
    setTitle("");
  };
  const toggleTask = (id) => setTasks((items) => items.map((task) => task.id === id ? { ...task, done: !task.done } : task));
  const removeTask = (id) => setTasks((items) => items.filter((task) => task.id !== id));
  const tasksForDate = (day) => tasks.filter((task) => task.date === day);
  const taskChip = (task, compact = false) => {
    const subject = subjectFor(task.subjectId);
    return (
      <div key={task.id} className={`planner-task ${task.done ? "planner-task-done" : ""}`} style={{ borderLeftColor: subject.color }}>
        <div className="min-w-0">
          <div className="font-bold text-[#1a1a2e] truncate">{task.title}</div>
          {!compact && <div className="text-xs text-[#4b4b63] mt-1">{subject.name} - {task.date}</div>}
        </div>
        {!compact && (
          <div className="flex gap-2">
            <button type="button" onClick={() => toggleTask(task.id)} className="nb-btn bg-[#00C896] px-3 py-1 text-xs">{task.done ? "Undo" : "Done"}</button>
            <button type="button" onClick={() => removeTask(task.id)} className="nb-btn bg-[#FF6B6B] px-3 py-1 text-xs">Delete</button>
          </div>
        )}
      </div>
    );
  };

  const selected = parseDateKey(selectedDate);
  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(startOfWeek(selected), index));
  const monthDays = monthGridDays(selected);

  return (
    <div className="nb-card p-6" style={{ background: "#FFF" }}>
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <h3 className="text-xl font-extrabold text-[#1a1a2e]" style={{ fontFamily: "Bricolage Grotesque" }}>Daily / Weekly / Monthly Planner</h3>
        <div className="flex gap-2">
          {["daily", "weekly", "monthly"].map((type) => (
            <button key={type} type="button" onClick={() => setView(type)}
              className={`nb-btn px-3 py-1.5 text-xs capitalize ${view === type ? "bg-[#FFD600]" : "bg-white"}`}>
              {type}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={addTask} className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-5">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task (e.g. Revise algebra)" className="md:col-span-5 nb-input" />
        <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="md:col-span-2 nb-input" />
        <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="md:col-span-3 nb-input">
          {subjects.length === 0 && <option value="">No subjects yet</option>}
          {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <button type="submit" className="md:col-span-2 nb-btn bg-[#B388FF] px-4 py-2">Add task</button>
      </form>

      {view === "daily" && (
        <div className="space-y-3">
          {tasksForDate(selectedDate).length === 0 && <div className="text-center text-[#4b4b63] py-6">No tasks for this date.</div>}
          {tasksForDate(selectedDate).map((task) => taskChip(task))}
        </div>
      )}

      {view === "weekly" && (
        <div className="planner-grid planner-grid-week">
          {weekDays.map((day) => {
            const key = dateKey(day);
            return (
              <div key={key} className="planner-day">
                <div className="planner-day-title">{day.toLocaleDateString(undefined, { weekday: "short" })}<br />{day.toLocaleDateString(undefined, { month: "short", day: "numeric" })}</div>
                {tasksForDate(key).map((task) => taskChip(task, true))}
              </div>
            );
          })}
        </div>
      )}

      {view === "monthly" && (
        <div className="planner-grid planner-grid-month">
          {monthDays.map((day) => {
            const key = dateKey(day);
            const outside = day.getMonth() !== selected.getMonth();
            return (
              <div key={key} className={`planner-day ${outside ? "opacity-40" : ""}`}>
                <div className="planner-day-title">{day.getDate()}</div>
                {tasksForDate(key).slice(0, 3).map((task) => taskChip(task, true))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ============ Schedule View ============
const SCHEDULE_KEY = "studi.schedule.alarms.v1";
const MUSIC_KEY = "studi.schedule.music.v1";

const ScheduleView = ({ subjects }) => {
  const [alarms, setAlarms] = useState(() => { try { return JSON.parse(localStorage.getItem(SCHEDULE_KEY) || "[]"); } catch { return []; } });
  const [music, setMusic] = useState(() => { try { return JSON.parse(localStorage.getItem(MUSIC_KEY) || "null"); } catch { return null; } });
  const [now, setNow] = useState(new Date());
  const [label, setLabel] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const audioRef = useRef(null);
  const oscillatorRefs = useRef([]);
  const alarmContextRef = useRef(null);
  const triggeredRef = useRef(new Set());

  useEffect(() => { localStorage.setItem(SCHEDULE_KEY, JSON.stringify(alarms)); }, [alarms]);
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);

  useEffect(() => {
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const cur = `${hh}:${mm}`;
    const dayKey = now.toISOString().slice(0, 10);
    alarms.forEach((a) => {
      [["start", a.startTime], ["end", a.endTime]].forEach(([kind, time]) => {
        if (time === cur) {
          const k = `${dayKey}-${a.id}-${kind}`;
          if (!triggeredRef.current.has(k)) {
            triggeredRef.current.add(k);
            playAlarm();
            showNotification(`${kind === "start" ? "▶" : "⏹"} ${a.label || "Study block"} ${kind}`);
          }
        }
      });
    });
  }, [now, alarms]);

  const stopAlarm = () => {
    if (audioRef.current) {
      try { audioRef.current.pause(); audioRef.current.currentTime = 0; } catch (e) {}
    }
    oscillatorRefs.current.forEach((osc) => {
      try { osc.stop(); } catch (e) {}
    });
    oscillatorRefs.current = [];
  };
  const playAlarm = () => {
    stopAlarm();
    if (audioRef.current) {
      try { audioRef.current.currentTime = 0; audioRef.current.play().catch(() => {}); } catch (e) {}
    }
    else if (music?.dataUrl) {
      const a = new Audio(music.dataUrl);
      audioRef.current = a;
      a.play().catch(() => {});
    }
    else {
      try {
        const ctx = alarmContextRef.current || new (window.AudioContext || window.webkitAudioContext)();
        alarmContextRef.current = ctx;
        for (let i = 0; i < 3; i++) {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g); g.connect(ctx.destination);
          o.frequency.value = 880;
          g.gain.setValueAtTime(0.25, ctx.currentTime + i * 0.4);
          o.start(ctx.currentTime + i * 0.4); o.stop(ctx.currentTime + i * 0.4 + 0.3);
          oscillatorRefs.current.push(o);
        }
      } catch (e) {}
    }
  };
  const showNotification = (msg) => {
    if ("Notification" in window && Notification.permission === "granted") {
      try { new Notification("Studi", { body: msg }); } catch (e) {}
    }
  };
  const requestNotif = () => { if ("Notification" in window) Notification.requestPermission(); };
  const addAlarm = (e) => { e.preventDefault(); setAlarms((a) => [...a, { id: crypto.randomUUID(), label: label || "Study block", startTime, endTime }]); setLabel(""); };
  const removeAlarm = (id) => setAlarms((a) => a.filter((x) => x.id !== id));
  const onMusicUpload = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    stopAlarm();
    const reader = new FileReader();
    reader.onload = () => {
      const obj = { name: file.name, dataUrl: reader.result };
      setMusic(obj);
      localStorage.setItem(MUSIC_KEY, JSON.stringify(obj));
      audioRef.current = new Audio(obj.dataUrl);
      audioRef.current.preload = "auto";
    };
    reader.readAsDataURL(file);
  };
  const clearMusic = () => { stopAlarm(); setMusic(null); localStorage.removeItem(MUSIC_KEY); audioRef.current = null; };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-5xl font-extrabold tracking-tight text-[#1a1a2e]" style={{ fontFamily: "Bricolage Grotesque" }}>
          Schedule<span className="text-[#B388FF]">.</span>
        </h2>
        <button onClick={requestNotif} className="nb-btn bg-white px-3 py-1.5 text-xs">Enable browser notifications</button>
      </div>

      <div className="nb-card p-8 text-center" style={{ background: "linear-gradient(135deg,#FFD600,#FFB38A)" }}>
        <div className="text-xs tracking-widest text-[#1a1a2e] uppercase mb-2 font-bold">current time</div>
        <div data-testid="big-clock" className="text-7xl font-bold text-[#1a1a2e] tabular-nums" style={{ fontFamily: "JetBrains Mono" }}>
          {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}
        </div>
        <div className="text-sm text-[#1a1a2e]/80 mt-2 font-bold">{now.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>
      </div>

      <PlannerView subjects={subjects} />

      <div className="nb-card p-6">
        <h3 className="text-xl font-extrabold text-[#1a1a2e] mb-3 flex items-center gap-2" style={{ fontFamily: "Bricolage Grotesque" }}>
          <MusicNote size={20} weight="fill" color="#B388FF" /> Alarm Sound
        </h3>
        <div className="flex flex-wrap items-center gap-3">
          <label data-testid="upload-music-btn" className="cursor-pointer nb-btn bg-[#B388FF] px-4 py-2 inline-flex items-center gap-2">
            <UploadSimple size={16} weight="bold" /> Upload your music
            <input type="file" accept="audio/*" onChange={onMusicUpload} className="hidden" />
          </label>
          {music && (
            <>
              <span className="text-sm text-[#4b4b63]">Loaded: <span className="text-[#1a1a2e] font-bold">{music.name}</span></span>
              <audio ref={audioRef} src={music.dataUrl} preload="auto" />
              <button onClick={clearMusic} className="nb-btn bg-[#FF6B6B] px-3 py-1.5 text-xs">Remove</button>
            </>
          )}
          {!music && <span className="text-sm text-[#4b4b63]">Default beep will be used.</span>}
          <button onClick={playAlarm} data-testid="preview-music-btn" className="nb-btn bg-white px-3 py-1.5 text-xs">Preview</button>
          <button onClick={stopAlarm} data-testid="stop-music-btn" className="nb-btn bg-[#FFB38A] px-3 py-1.5 text-xs">Stop</button>
        </div>
      </div>

      <form onSubmit={addAlarm} data-testid="form-add-alarm" className="nb-card p-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <input data-testid="alarm-label-input" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Label (e.g. Math block)" className="md:col-span-5 nb-input" />
          <input data-testid="alarm-start-input" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="md:col-span-2 nb-input" />
          <input data-testid="alarm-end-input" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="md:col-span-2 nb-input" />
          <button type="submit" data-testid="add-alarm-btn" className="md:col-span-3 nb-btn bg-[#B388FF] px-4 py-2.5 inline-flex items-center justify-center gap-2">
            <Plus size={18} weight="bold" /> Add alarm
          </button>
        </div>
      </form>

      <div className="space-y-3" data-testid="alarms-list">
        {alarms.length === 0 && <div className="text-center text-[#4b4b63] py-8">No alarms yet. Schedule your study blocks above.</div>}
        {alarms.map((a) => (
          <div key={a.id} className="nb-card p-4 flex items-center justify-between gap-4" data-testid={`alarm-row-${a.id}`} style={{ background: "#FFF" }}>
            <div className="flex items-center gap-4 min-w-0">
              <Alarm size={32} weight="duotone" color="#B388FF" />
              <div className="min-w-0">
                <div className="font-bold text-[#1a1a2e] truncate text-lg" style={{ fontFamily: "Bricolage Grotesque" }}>{a.label}</div>
                <div className="text-xs mt-1 flex items-center gap-2">
                  <span className="font-bold text-black bg-[#FFD600] px-2 py-0.5 rounded-full border-2 border-[#1a1a2e]" style={{ fontFamily: "JetBrains Mono" }}>{a.startTime}</span>
                  <span className="text-[#4b4b63]">→</span>
                  <span className="font-bold text-black bg-[#FF6B6B] px-2 py-0.5 rounded-full border-2 border-[#1a1a2e]" style={{ fontFamily: "JetBrains Mono" }}>{a.endTime}</span>
                </div>
              </div>
            </div>
            <button onClick={() => removeAlarm(a.id)} className="nb-btn p-2 bg-[#FF6B6B]" data-testid={`delete-alarm-${a.id}`}><Trash size={16} /></button>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============ Journal View ============
const JournalView = () => {
  const [date, setDate] = useState(todayStr());
  const [mood, setMood] = useState("okay");
  const [content, setContent] = useState("");
  const [entries, setEntries] = useState([]);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);

  const loadList = useCallback(async () => {
    const r = await axios.get(`${API}/journal`);
    setEntries(r.data);
  }, []);

  const loadDate = useCallback(async (d) => {
    const r = await axios.get(`${API}/journal/${d}`);
    setMood(r.data.mood || "okay");
    setContent(r.data.content || "");
  }, []);

  useEffect(() => { loadList(); }, [loadList]);
  useEffect(() => { loadDate(date); }, [date, loadDate]);

  const save = async () => {
    setSaving(true);
    try {
      await axios.post(`${API}/journal`, { date, mood, content });
      setSavedAt(new Date().toLocaleTimeString());
      loadList();
    } finally { setSaving(false); }
  };

  const removeEntry = async (id) => {
    if (!window.confirm("Delete this journal entry?")) return;
    await axios.delete(`${API}/journal/${id}`);
    loadList();
    if (entries.find((e) => e.id === id)?.date === date) { setContent(""); setMood("okay"); }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-5xl font-extrabold tracking-tight text-[#1a1a2e]" style={{ fontFamily: "Bricolage Grotesque" }}>
        Journal<span className="text-[#FFB38A]">.</span>
      </h2>

      <div className="nb-card p-6" style={{ background: "#FFF" }}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <label className="text-xs uppercase tracking-widest font-bold text-[#4b4b63]">date</label>
            <input data-testid="journal-date-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="nb-input text-sm" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {MOODS.map((m) => (
              <button key={m.id} type="button" data-testid={`mood-${m.id}`} onClick={() => setMood(m.id)}
                className={`nb-btn px-3 py-1.5 text-sm flex items-center gap-1.5 ${mood === m.id ? "" : "opacity-70"}`}
                style={{ background: mood === m.id ? m.color : "#fff" }}>
                <span>{m.emoji}</span><span className="font-bold">{m.label}</span>
              </button>
            ))}
          </div>
        </div>
        <textarea
          data-testid="journal-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What did you learn today? What's tricky? What clicked?"
          className="w-full nb-input min-h-[200px] resize-y"
          style={{ fontFamily: "DM Sans", lineHeight: 1.6 }}
        />
        <div className="mt-4 flex items-center gap-3">
          <button onClick={save} disabled={saving} data-testid="journal-save-btn" className="nb-btn bg-[#FFD600] px-5 py-2.5">
            {saving ? "Saving…" : "Save entry"}
          </button>
          {savedAt && <span className="text-xs text-[#00C896] font-bold">saved at {savedAt}</span>}
        </div>
      </div>

      <div>
        <h3 className="text-xl font-extrabold text-[#1a1a2e] mb-3" style={{ fontFamily: "Bricolage Grotesque" }}>Past entries</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="journal-list">
          {entries.length === 0 && <div className="md:col-span-2 text-center text-[#4b4b63] py-8">No journal entries yet. Start with today.</div>}
          {entries.map((e) => {
            const m = MOODS.find((x) => x.id === e.mood) || MOODS[2];
            return (
              <div key={e.id} className="nb-card p-4 cursor-pointer" style={{ background: m.color + "33" }} onClick={() => setDate(e.date)} data-testid={`journal-entry-${e.id}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{m.emoji}</span>
                    <span className="font-bold text-[#1a1a2e]" style={{ fontFamily: "JetBrains Mono" }}>{e.date}</span>
                  </div>
                  <button onClick={(ev) => { ev.stopPropagation(); removeEntry(e.id); }} className="nb-btn p-1.5 bg-[#FF6B6B]" data-testid={`delete-journal-${e.id}`}><Trash size={14} /></button>
                </div>
                <p className="text-sm text-[#1a1a2e] line-clamp-3 whitespace-pre-wrap">{e.content || <em className="text-[#4b4b63]">empty</em>}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ============ Mocks View ============
const MocksView = ({ subjects }) => {
  const [name, setName] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [date, setDate] = useState(todayStr());
  const [score, setScore] = useState("");
  const [maxScore, setMaxScore] = useState(100);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);

  const load = useCallback(async () => {
    const [a, b] = await Promise.all([axios.get(`${API}/mocks`), axios.get(`${API}/mocks/stats/overview`)]);
    setItems(a.data); setStats(b.data);
  }, []);

  useEffect(() => { load(); }, [load]);

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim() || score === "" || !maxScore) return;
    await axios.post(`${API}/mocks`, {
      name: name.trim(), subject_id: subjectId || null, date,
      score: Number(score), max_score: Number(maxScore), notes,
    });
    setName(""); setScore(""); setNotes("");
    load();
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this mock test result?")) return;
    await axios.delete(`${API}/mocks/${id}`);
    load();
  };

  const trendData = (stats?.trend || []).map((t, i) => ({ ...t, idx: i + 1 }));

  return (
    <div className="space-y-6">
      <h2 className="text-5xl font-extrabold tracking-tight text-[#1a1a2e]" style={{ fontFamily: "Bricolage Grotesque" }}>
        Mock Tests<span className="text-[#00C896]">.</span>
      </h2>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StickerStat label="Tests" value={stats.count} color="#FFD600" />
          <StickerStat label="Average %" value={`${stats.avg}%`} color="#00C896" />
          <StickerStat label="Best %" value={`${stats.best}%`} color="#5BC0EB" />
          <StickerStat label="Lowest %" value={`${stats.worst}%`} color="#FF6B6B" />
        </div>
      )}

      <form onSubmit={submit} data-testid="form-add-mock" className="nb-card p-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <input data-testid="mock-name-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Test name (e.g. Mock #4)" className="md:col-span-4 nb-input" />
          <select data-testid="mock-subject-select" value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="md:col-span-3 nb-input">
            <option value="">No subject</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <input data-testid="mock-date-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="md:col-span-2 nb-input" />
          <input data-testid="mock-score-input" type="number" value={score} onChange={(e) => setScore(e.target.value)} placeholder="Score" className="md:col-span-1 nb-input" />
          <input data-testid="mock-max-input" type="number" value={maxScore} onChange={(e) => setMaxScore(e.target.value)} placeholder="Out of" className="md:col-span-1 nb-input" />
          <input data-testid="mock-notes-input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (optional)" className="md:col-span-9 nb-input" />
          <button data-testid="add-mock-btn" type="submit" className="md:col-span-3 nb-btn bg-[#00C896] px-4 py-2.5 inline-flex items-center justify-center gap-2">
            <Plus size={18} weight="bold" /> Log test
          </button>
        </div>
      </form>

      {trendData.length > 0 && (
        <div className="nb-card p-6" style={{ background: "#FFF" }}>
          <h3 className="text-xl font-extrabold text-[#1a1a2e] mb-4" style={{ fontFamily: "Bricolage Grotesque" }}>Performance trend</h3>
          <div style={{ width: "100%", height: 280 }} data-testid="mocks-chart">
            <ResponsiveContainer>
              <LineChart data={trendData} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="#1a1a2e22" vertical={false} />
                <XAxis dataKey="name" stroke="#4b4b63" tickLine={false} axisLine={{ stroke: "#1a1a2e" }} />
                <YAxis stroke="#4b4b63" tickLine={false} axisLine={{ stroke: "#1a1a2e" }} domain={[0, 100]} />
                <Tooltip contentStyle={{ background: "#FFF7E3", border: "2px solid #1a1a2e", borderRadius: 12, color: "#1a1a2e", boxShadow: "3px 3px 0 #1a1a2e" }}
                  labelStyle={{ color: "#1a1a2e", fontWeight: 700 }} formatter={(v) => [`${v}%`, "Score"]} />
                <Line type="monotone" dataKey="percentage" stroke="#FF6B6B" strokeWidth={3}
                  dot={(p) => <Dot {...p} r={6} fill="#FFD600" stroke="#1a1a2e" strokeWidth={2} />}
                  activeDot={{ r: 9, fill: "#FFD600", stroke: "#1a1a2e", strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="space-y-3" data-testid="mocks-list">
        {items.length === 0 && <div className="text-center text-[#4b4b63] py-8">No mock tests yet. Log your first one above!</div>}
        {items.map((m) => {
          const color = m.percentage >= 80 ? "#00C896" : m.percentage >= 60 ? "#FFD600" : m.percentage >= 40 ? "#FFB38A" : "#FF6B6B";
          return (
            <div key={m.id} className="nb-card p-4 flex items-center justify-between gap-4" style={{ background: "#FFF" }} data-testid={`mock-row-${m.id}`}>
              <div className="flex items-center gap-4 min-w-0">
                <div className="rounded-2xl border-2 border-[#1a1a2e] px-3 py-2 text-center" style={{ background: color, minWidth: 70, boxShadow: "2px 2px 0 #1a1a2e" }}>
                  <div className="text-xl font-extrabold text-[#1a1a2e]" style={{ fontFamily: "JetBrains Mono" }}>{m.percentage}%</div>
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-[#1a1a2e] text-lg" style={{ fontFamily: "Bricolage Grotesque" }}>{m.name}</div>
                  <div className="text-xs text-[#4b4b63] mt-0.5 flex flex-wrap gap-2 items-center">
                    <span style={{ fontFamily: "JetBrains Mono" }}>{m.date}</span>
                    {m.subject_name && <span className="sticker bg-[#5BC0EB] text-[10px]">{m.subject_name}</span>}
                    <span className="text-[#1a1a2e] font-bold">{m.score}/{m.max_score}</span>
                    {m.notes && <span className="truncate max-w-xs">— {m.notes}</span>}
                  </div>
                </div>
              </div>
              <button onClick={() => remove(m.id)} className="nb-btn p-2 bg-[#FF6B6B]" data-testid={`delete-mock-${m.id}`}><Trash size={16} /></button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const StickerStat = ({ label, value, color }) => (
  <div className="nb-card p-4" style={{ background: color }}>
    <div className="text-[10px] uppercase tracking-widest font-bold text-[#1a1a2e]/80">{label}</div>
    <div className="text-3xl font-extrabold text-[#1a1a2e] mt-1" style={{ fontFamily: "Bricolage Grotesque" }}>{value}</div>
  </div>
);

// ============ Stats View ============
const StatsView = ({ weekly, streak, todayStats }) => {
  const data = useMemo(() => (weekly?.days || []).map((d) => ({ ...d, hours: +(d.minutes / 60).toFixed(2) })), [weekly]);
  const subjectData = weekly?.subject_totals || [];
  const totalWeek = data.reduce((a, b) => a + b.minutes, 0);
  const avg = data.length ? Math.round(totalWeek / 7) : 0;

  return (
    <div className="space-y-6">
      <h2 className="text-5xl font-extrabold tracking-tight text-[#1a1a2e]" style={{ fontFamily: "Bricolage Grotesque" }}>
        Stats<span className="text-[#FFD600]">.</span>
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="This week" value={fmtMins(totalWeek)} color="#FFD600" testid="stat-week" />
        <StatCard label="Daily avg" value={fmtMins(avg)} color="#00C896" testid="stat-avg" />
        <StatCard label="Current streak" value={`${streak?.current || 0} days`} color="#FF6B6B" testid="stat-streak" />
      </div>

      {subjectData.length > 0 && (
        <div className="nb-card p-6" style={{ background: "#FFF" }}>
          <h3 className="text-xl font-extrabold text-[#1a1a2e] mb-4" style={{ fontFamily: "Bricolage Grotesque" }}>Subject-wise breakdown</h3>
          <div className="space-y-3" data-testid="subject-breakdown">
            {subjectData.map((item, index) => {
              const width = totalWeek ? Math.max(6, Math.round((item.minutes / totalWeek) * 100)) : 0;
              return (
                <div key={item.name}>
                  <div className="flex items-center justify-between text-sm font-bold text-[#1a1a2e] mb-1">
                    <span>{item.name}</span>
                    <span>{fmtMins(item.minutes)}</span>
                  </div>
                  <div className="h-5 rounded-full border-2 border-[#1a1a2e] bg-[#FFF7E3] overflow-hidden">
                    <div className="h-full" style={{ width: `${width}%`, background: item.color || ACCENTS[index % ACCENTS.length] }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="nb-card p-6" style={{ background: "#FFF" }}>
        <h3 className="text-xl font-extrabold text-[#1a1a2e] mb-4" style={{ fontFamily: "Bricolage Grotesque" }}>Weekly Activity (minutes)</h3>
        <div style={{ width: "100%", height: 320 }} data-testid="weekly-chart">
          <ResponsiveContainer>
            <BarChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="#1a1a2e22" vertical={false} />
              <XAxis dataKey="label" stroke="#1a1a2e" tickLine={false} axisLine={{ stroke: "#1a1a2e" }} />
              <YAxis stroke="#1a1a2e" tickLine={false} axisLine={{ stroke: "#1a1a2e" }} />
              <Tooltip contentStyle={{ background: "#FFF7E3", border: "2px solid #1a1a2e", borderRadius: 12, color: "#1a1a2e", boxShadow: "3px 3px 0 #1a1a2e" }}
                labelStyle={{ color: "#1a1a2e", fontWeight: 700 }} formatter={(v) => [`${v} min`, "Studied"]} />
              <Bar dataKey="minutes" radius={[10, 10, 0, 0]} stroke="#1a1a2e" strokeWidth={2}
                fill="#FFD600" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {todayStats && (
        <div className="nb-card p-6">
          <h3 className="text-xl font-extrabold text-[#1a1a2e] mb-2" style={{ fontFamily: "Bricolage Grotesque" }}>Today snapshot</h3>
          <div className="flex flex-wrap gap-3 items-center">
            <DurationChip minutes={todayStats.total_minutes} color="#FFD600" />
            <span className="text-[#4b4b63] text-sm">across {todayStats.sessions_count} sessions</span>
            <span className="sticker bg-[#FFEFC2] text-xs">goal {todayStats.goal_minutes} min</span>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ label, value, color, testid }) => (
  <div className="nb-card p-5" style={{ background: "#FFF" }} data-testid={testid}>
    <div className="text-xs uppercase tracking-widest text-[#4b4b63] font-bold">{label}</div>
    <div className="mt-2 inline-block text-2xl font-bold text-black px-3 py-1 rounded-full border-2 border-[#1a1a2e]"
      style={{ background: color, fontFamily: "JetBrains Mono", boxShadow: "2px 2px 0 #1a1a2e" }}>
      {value}
    </div>
  </div>
);

// ============ Records View ============
const RecordsView = ({ refresh }) => {
  const [items, setItems] = useState([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (from) params.date_from = from;
      if (to) params.date_to = to;
      const r = await axios.get(`${API}/sessions`, { params });
      setItems(r.data);
    } finally { setLoading(false); }
  }, [from, to]);

  useEffect(() => { load(); }, [load]);

  const remove = async (id) => {
    if (!window.confirm("Delete this session?")) return;
    await axios.delete(`${API}/sessions/${id}`);
    load(); refresh();
  };

  const totalMins = items.reduce((a, b) => a + b.duration_minutes, 0);

  return (
    <div className="space-y-6">
      <h2 className="text-5xl font-extrabold tracking-tight text-[#1a1a2e]" style={{ fontFamily: "Bricolage Grotesque" }}>
        Records<span className="text-[#5BC0EB]">.</span>
      </h2>

      <div className="nb-card p-4 flex flex-wrap items-center gap-3">
        <label className="text-sm font-bold text-[#4b4b63] uppercase tracking-widest">From</label>
        <input data-testid="records-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="nb-input text-sm" />
        <label className="text-sm font-bold text-[#4b4b63] uppercase tracking-widest">To</label>
        <input data-testid="records-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} className="nb-input text-sm" />
        <button onClick={() => { setFrom(""); setTo(""); }} className="nb-btn bg-white px-3 py-1.5 text-xs">Clear</button>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-[#4b4b63] font-bold">{items.length} sessions</span>
          <DurationChip minutes={totalMins} color="#00C896" testid="records-total-chip" />
        </div>
      </div>

      <div className="nb-card overflow-hidden" style={{ background: "#FFF" }}>
        <div className="grid grid-cols-12 gap-3 px-4 py-3 text-xs uppercase tracking-widest text-[#4b4b63] font-bold" style={{ borderBottom: "2px solid #1a1a2e" }}>
          <div className="col-span-2">Date</div>
          <div className="col-span-3">Subject</div>
          <div className="col-span-2">Duration</div>
          <div className="col-span-4">Notes</div>
          <div className="col-span-1 text-right">·</div>
        </div>
        <div className="max-h-[55vh] overflow-y-auto" data-testid="records-list">
          {loading && <div className="p-6 text-center text-[#4b4b63]">Loading…</div>}
          {!loading && items.length === 0 && <div className="p-6 text-center text-[#4b4b63]">No sessions in this range.</div>}
          {items.map((s) => (
            <div key={s.id} className="grid grid-cols-12 gap-3 px-4 py-3 items-center hover:bg-[#FFF7E3]" style={{ borderBottom: "1px dashed #1a1a2e44" }} data-testid={`record-row-${s.id}`}>
              <div className="col-span-2 text-sm text-[#1a1a2e]" style={{ fontFamily: "JetBrains Mono" }}>{s.date}</div>
              <div className="col-span-3 text-sm text-[#1a1a2e] font-bold truncate">{s.subject_name}</div>
              <div className="col-span-2"><DurationChip minutes={s.duration_minutes} color="#FFD600" /></div>
              <div className="col-span-4 text-sm text-[#4b4b63] truncate">{s.notes || "—"}</div>
              <div className="col-span-1 text-right">
                <button onClick={() => remove(s.id)} className="nb-btn p-1.5 bg-[#FF6B6B]" data-testid={`delete-record-${s.id}`}><Trash size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============ Settings View ============
const SettingsView = ({ settings, refresh }) => {
  const [goal, setGoal] = useState(settings?.daily_goal_minutes || 240);
  const [work, setWork] = useState(settings?.pomodoro_work || 25);
  const [brk, setBrk] = useState(settings?.pomodoro_break || 5);
  const [importBusy, setImportBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => { if (settings) { setGoal(settings.daily_goal_minutes); setWork(settings.pomodoro_work); setBrk(settings.pomodoro_break); } }, [settings]);

  const save = async () => {
    await axios.put(`${API}/settings`, { daily_goal_minutes: Number(goal), pomodoro_work: Number(work), pomodoro_break: Number(brk) });
    setMsg("Saved!"); setTimeout(() => setMsg(""), 1500); refresh();
  };

  const downloadFile = (filename, content, mime) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const exportJSON = async () => {
    const r = await axios.get(`${API}/export`);
    downloadFile(`studi-export-${todayStr()}.json`, JSON.stringify(r.data, null, 2), "application/json");
  };

  const exportCSV = async () => {
    const r = await axios.get(`${API}/export`);
    const rows = [["date", "subject_name", "duration_minutes", "notes", "started_at", "id", "subject_id"]];
    (r.data.sessions || []).forEach((s) => {
      rows.push([s.date, `"${(s.subject_name || "").replace(/"/g, '""')}"`, s.duration_minutes,
        `"${(s.notes || "").replace(/"/g, '""')}"`, s.started_at, s.id, s.subject_id]);
    });
    const csv = rows.map((r) => r.join(",")).join("\n");
    downloadFile(`studi-sessions-${todayStr()}.csv`, csv, "text/csv");
  };

  const onImport = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (!window.confirm("Import will REPLACE all existing data. Continue?")) { e.target.value = ""; return; }
    setImportBusy(true);
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const r = await axios.post(`${API}/import?replace=true`, json);
      setMsg(`Imported ${r.data.subjects} subjects, ${r.data.sessions} sessions, ${r.data.journal} journal, ${r.data.mock_tests} mocks.`);
      refresh();
    } catch (err) {
      setMsg("Import failed: " + (err.message || "invalid JSON"));
    } finally {
      setImportBusy(false); e.target.value = ""; setTimeout(() => setMsg(""), 4000);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-5xl font-extrabold tracking-tight text-[#1a1a2e]" style={{ fontFamily: "Bricolage Grotesque" }}>
        Settings<span className="text-[#B388FF]">.</span>
      </h2>

      <div className="nb-card p-6" style={{ background: "#FFF" }}>
        <h3 className="text-xl font-extrabold text-[#1a1a2e] mb-4" style={{ fontFamily: "Bricolage Grotesque" }}>Goals & Pomodoro</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Daily goal (minutes)"><input data-testid="setting-daily-goal" type="number" min="10" value={goal} onChange={(e) => setGoal(e.target.value)} className="w-full nb-input" /></Field>
          <Field label="Pomodoro work (minutes)"><input data-testid="setting-pomo-work" type="number" min="1" value={work} onChange={(e) => setWork(e.target.value)} className="w-full nb-input" /></Field>
          <Field label="Pomodoro break (minutes)"><input data-testid="setting-pomo-break" type="number" min="1" value={brk} onChange={(e) => setBrk(e.target.value)} className="w-full nb-input" /></Field>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button data-testid="settings-save-btn" onClick={save} className="nb-btn bg-[#FFD600] px-5 py-2.5">Save</button>
          {msg && <span className="text-sm text-[#00C896] font-bold">{msg}</span>}
        </div>
      </div>

      <div className="nb-card p-6">
        <h3 className="text-xl font-extrabold text-[#1a1a2e] mb-4" style={{ fontFamily: "Bricolage Grotesque" }}>Data export & import</h3>
        <p className="text-sm text-[#4b4b63] mb-4">Export everything (subjects, sessions, journal, mock tests) as editable JSON or sessions as CSV. Import a JSON file to restore (replaces all existing data).</p>
        <div className="flex flex-wrap items-center gap-3">
          <button data-testid="export-json-btn" onClick={exportJSON} className="nb-btn bg-[#5BC0EB] px-4 py-2 inline-flex items-center gap-2"><DownloadSimple size={16} weight="bold" /> Export JSON</button>
          <button data-testid="export-csv-btn" onClick={exportCSV} className="nb-btn bg-[#00C896] px-4 py-2 inline-flex items-center gap-2"><DownloadSimple size={16} weight="bold" /> Export CSV</button>
          <label data-testid="import-json-btn" className="cursor-pointer nb-btn bg-[#FFD600] px-4 py-2 inline-flex items-center gap-2">
            <UploadSimple size={16} weight="bold" /> {importBusy ? "Importing…" : "Import JSON"}
            <input type="file" accept="application/json" onChange={onImport} className="hidden" />
          </label>
        </div>
      </div>
    </div>
  );
};

const Field = ({ label, children }) => (
  <label className="block">
    <span className="text-xs uppercase tracking-widest text-[#4b4b63] font-bold">{label}</span>
    <div className="mt-1.5">{children}</div>
  </label>
);

// ============ App Shell ============
function App() {
  const [view, setView] = useState("today");
  const [subjects, setSubjects] = useState([]);
  const [todayStats, setTodayStats] = useState(null);
  const [weekly, setWeekly] = useState(null);
  const [streak, setStreak] = useState(null);
  const [settings, setSettings] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const [s, t, w, st, se] = await Promise.all([
        axios.get(`${API}/subjects`),
        axios.get(`${API}/stats/today`),
        axios.get(`${API}/stats/weekly`),
        axios.get(`${API}/stats/streak`),
        axios.get(`${API}/settings`),
      ]);
      setSubjects(s.data); setTodayStats(t.data); setWeekly(w.data); setStreak(st.data); setSettings(se.data);
    } catch (e) { console.error("refresh err", e); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <div className="App min-h-screen flex" style={{ fontFamily: "DM Sans, sans-serif" }}>
      <Sidebar active={view} onChange={setView} />
      <main className="flex-1 p-6 md:p-10 max-w-6xl mx-auto w-full">
        {view === "today" && <TodayView subjects={subjects} todayStats={todayStats} streak={streak} weekly={weekly} settings={settings} onLogged={refresh} />}
        {view === "subjects" && <SubjectsView subjects={subjects} refresh={refresh} />}
        {view === "pomodoro" && <PomodoroView subjects={subjects} settings={settings} onLogged={refresh} />}
        {view === "schedule" && <ScheduleView subjects={subjects} />}
        {view === "journal" && <JournalView />}
        {view === "mocks" && <MocksView subjects={subjects} />}
        {view === "stats" && <StatsView weekly={weekly} streak={streak} todayStats={todayStats} />}
        {view === "records" && <RecordsView refresh={refresh} />}
        {view === "settings" && <SettingsView settings={settings} refresh={refresh} />}
      </main>
    </div>
  );
}

export default App;
