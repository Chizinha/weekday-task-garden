import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Check, Plus, Clock } from "lucide-react";
import bg from "@/assets/floral-bg.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Todo - Week | Cute weekly planner" },
      { name: "description", content: "A cute pastel weekly todo planner with color-tagged tasks." },
      { property: "og:title", content: "Todo - Week" },
      { property: "og:description", content: "A cute pastel weekly todo planner with color-tagged tasks." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type Tag = "green" | "yellow" | "pink" | "blue";
type Task = { id: number; title: string; deadline: string; description: string; tag: Tag; done: boolean };
type Draft = Omit<Task, "id" | "done"> & { day: string };

const TAGS: Tag[] = ["green", "yellow", "pink", "blue"];
const tagBg: Record<Tag, string> = {
  green: "bg-tag-green",
  yellow: "bg-tag-yellow",
  pink: "bg-tag-pink",
  blue: "bg-tag-blue",
};

const DAYS = [
  { name: "Monday", icon: "🌸" },
  { name: "Tuesday", icon: "🪻" },
  { name: "Wednesday", icon: "🌼" },
  { name: "Thursday", icon: "🌷" },
  { name: "Friday", icon: "🌺" },
  { name: "Saturday", icon: "🌻" },
  { name: "Sunday", icon: "💐" },
];

const STORAGE_KEY = "todo-week.tasks.v1";

let nextId = 100;
const newId = () => nextId++;

const sample = (id: number, tag: Tag, done: boolean, deadline = "12:00"): Task => ({
  id,
  title: "Title",
  deadline,
  description: "Description text that describes the task",
  tag,
  done,
});

const seedTasks = (): Record<string, Task[]> => ({
  Monday: [sample(1, "pink", true, "09:00"), sample(2, "yellow", false, "14:30")],
  Tuesday: [sample(3, "blue", true, "10:00"), sample(4, "pink", true, "13:00"), sample(5, "yellow", false, "18:00")],
});

// Storage can hold half-written or hand-edited JSON, so unusable entries are dropped.
const readStored = (): Record<string, Task[]> | null => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Record<string, unknown>;
    if (!data || typeof data !== "object") return null;
    const out: Record<string, Task[]> = {};
    for (const [day, list] of Object.entries(data)) {
      if (!Array.isArray(list)) continue;
      out[day] = list.filter(
        (t): t is Task =>
          !!t &&
          typeof t === "object" &&
          typeof (t as Task).id === "number" &&
          typeof (t as Task).title === "string" &&
          TAGS.includes((t as Task).tag),
      );
    }
    return out;
  } catch {
    return null;
  }
};

type Editing = { mode: "new"; day: string } | { mode: "edit"; day: string; id: number } | null;

export function Index() {
  const [tasks, setTasks] = useState<Record<string, Task[]>>(seedTasks);
  const [loaded, setLoaded] = useState(false);
  const [editing, setEditing] = useState<Editing>(null);
  const [loaded, setLoaded] = useState(false);

  // The saved list is read only after the page is up, so the first paint never
  // differs between visits and a refresh can't overwrite what's already stored.
  useEffect(() => {
    const stored = readStored();
    if (stored) {
      for (const list of Object.values(stored)) nextId = list.reduce((m, t) => Math.max(m, t.id + 1), nextId);
      setTasks(stored);
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch {
      // Private browsing or a full quota: the planner still works for this visit.
    }
  }, [tasks, loaded]);

  const toggle = (day: string, id: number) =>
    setTasks((t) => ({ ...t, [day]: (t[day] ?? []).map((x) => (x.id === id ? { ...x, done: !x.done } : x)) }));

  const save = ({ day, ...task }: Draft) => {
    const id = editing?.mode === "edit" ? editing.id : newId();
    setTasks((t) => {
      const next = { ...t };
      if (editing?.mode === "edit") {
        const old = (next[editing.day] ?? []).find((x) => x.id === editing.id);
        next[editing.day] = (next[editing.day] ?? []).filter((x) => x.id !== editing.id);
        next[day] = [...(next[day] ?? []), { ...task, id, done: old?.done ?? false }];
      } else {
        next[day] = [...(next[day] ?? []), { ...task, id, done: false }];
      }
      return next;
    });
    setEditing(null);
  };

  return (
    <main
      className="min-h-screen bg-cover bg-center bg-fixed px-4 py-10 font-sans text-ink"
      style={{ backgroundImage: `url(${bg})` }}
    >
      <h1 className="mb-8 text-center text-5xl font-medium tracking-tight">Todo - Week</h1>
      <div className="mx-auto max-w-[720px] rounded-[3.5rem] bg-card px-6 py-12 shadow-soft sm:px-[90px]">
        {DAYS.map((d, i) => {
          const open = editing?.day === d.name;
          const editTask = editing?.mode === "edit" && open ? tasks[d.name]?.find((x) => x.id === editing.id) : undefined;
          return (
            <section key={d.name} className={i > 0 ? "mt-12" : ""}>
              <div className="mb-6 flex items-center justify-between">
                <h2 className="flex items-center gap-4 text-4xl font-medium">
                  <span className="text-3xl">{d.icon}</span>
                  {d.name}
                </h2>
                <button
                  aria-label={`Add task to ${d.name}`}
                  onClick={() => setEditing(open && editing?.mode === "new" ? null : { mode: "new", day: d.name })}
                  className="grid h-14 w-14 place-items-center rounded-full bg-tag-green text-ink shadow-soft transition duration-300 hover:scale-110 active:scale-95"
                >
                  <Plus className={`h-9 w-9 transition-transform duration-300 ${open && editing?.mode === "new" ? "rotate-45" : ""}`} strokeWidth={3} />
                </button>
              </div>
              <div className={`grid transition-all duration-500 ease-out ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                <div className="overflow-hidden">
                  {open && (
                    <TaskForm
                      key={editing.mode === "edit" ? `e${editing.id}` : `n${d.name}`}
                      initial={editTask ? { ...editTask, day: d.name } : { title: "", deadline: "12:00", description: "", tag: "pink", day: d.name }}
                      isEdit={editing.mode === "edit"}
                      onSave={save}
                      onCancel={() => setEditing(null)}
                    />
                  )}
                </div>
              </div>
              <ul className="space-y-4">
                {(tasks[d.name] ?? []).map((t) => (
                  <li key={t.id} className="flex animate-in fade-in slide-in-from-bottom-2 items-center gap-5 duration-300">
                    <button
                      aria-label={t.done ? "Mark as not done" : "Mark as done"}
                      onClick={() => toggle(d.name, t.id)}
                      className={`grid h-[60px] w-[60px] shrink-0 place-items-center rounded-full transition hover:scale-105 active:scale-90 ${tagBg[t.tag]}`}
                    >
                      {t.done && (
                        <span className="grid h-11 w-11 animate-pop place-items-center rounded-full bg-ink-soft text-card">
                          <Check className="h-6 w-6 animate-draw" strokeWidth={3} />
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => setEditing({ mode: "edit", day: d.name, id: t.id })}
                      className={`flex-1 rounded-3xl px-6 py-5 text-left transition duration-300 hover:-translate-y-0.5 hover:shadow-soft ${tagBg[t.tag]} ${t.done ? "opacity-70" : ""}`}
                    >
                      <div className="flex justify-between gap-3 text-xl font-medium">
                        <span className={t.done ? "line-through decoration-2" : ""}>{t.title}</span>
                        <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{t.deadline}</span>
                      </div>
                      <p className="mt-2 text-lg">{t.description}</p>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </main>
  );
}

function TimePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [h, m] = value.split(":");
  const sel = "appearance-none rounded-xl border border-line bg-card px-3 py-2 text-2xl font-medium outline-none transition focus:border-tag-pink hover:bg-muted cursor-pointer";
  return (
    <div className="flex items-center gap-1">
      <Clock className="mr-1 h-5 w-5" />
      <select aria-label="Hour" value={h} onChange={(e) => onChange(`${e.target.value}:${m}`)} className={sel}>
        {Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0")).map((x) => <option key={x}>{x}</option>)}
      </select>
      <span className="text-2xl font-medium">:</span>
      <select aria-label="Minute" value={m} onChange={(e) => onChange(`${h}:${e.target.value}`)} className={sel}>
        {Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0")).map((x) => <option key={x}>{x}</option>)}
      </select>
    </div>
  );
}

function TaskForm({ initial, isEdit, onSave, onCancel }: { initial: Draft; isEdit: boolean; onSave: (d: Draft) => void; onCancel: () => void }) {
  const [d, setD] = useState<Draft>(initial);
  const [status, setStatus] = useState("");
  const [sendOpen, setSendOpen] = useState(false);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }));
  const field = "rounded-xl border border-line bg-card px-4 py-3 outline-none transition focus:border-tag-pink placeholder:text-ink";

  return (
    <>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!d.title.trim()) return setStatus("Add a title first");
          onSave(d);
        }}
        className="mb-8 rounded-[2rem] border border-line bg-card p-6 shadow-soft sm:px-10"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <input value={d.title} onChange={(e) => set("title", e.target.value)} placeholder="Title" className={`${field} w-40 text-2xl font-medium`} />
          <TimePicker value={d.deadline} onChange={(v) => set("deadline", v)} />
        </div>
        <textarea
          value={d.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Description text that describes the task..."
          rows={2}
          className={`${field} mt-6 w-full resize-none text-xl font-light`}
        />
        <div className="mt-6 flex flex-wrap gap-2">
          {DAYS.map((x) => (
            <button
              type="button"
              key={x.name}
              onClick={() => set("day", x.name)}
              className={`rounded-full px-3 py-1.5 text-sm transition duration-200 hover:scale-105 ${d.day === x.name ? `${tagBg[d.tag]} font-medium shadow-soft` : "bg-muted"}`}
            >
              {x.name.slice(0, 3)}
            </button>
          ))}
        </div>
        <div className="mt-5 flex gap-3">
          {TAGS.map((c) => (
            <button
              type="button"
              key={c}
              aria-label={`${c} tag`}
              onClick={() => set("tag", c)}
              className={`h-10 w-10 rounded-full shadow-soft transition duration-200 hover:scale-110 ${tagBg[c]} ${d.tag === c ? "scale-110 ring-2 ring-ink-soft ring-offset-2" : ""}`}
            />
          ))}
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button type="submit" className="rounded-full bg-tag-green px-7 py-3 text-lg font-medium shadow-soft transition hover:scale-105 active:scale-95">
            {isEdit ? "Save changes" : "Add to list"}
          </button>
          <button
            type="button"
            onClick={() => (d.title.trim() ? setSendOpen(true) : setStatus("Add a title first"))}
            className="rounded-full border border-line bg-card px-7 py-3 text-lg shadow-soft transition hover:scale-105 hover:bg-muted active:scale-95"
          >
            Send task
          </button>
          <button type="button" onClick={onCancel} className="px-3 py-3 text-lg opacity-70 transition hover:opacity-100">
            Cancel
          </button>
          {status && <span className="animate-in fade-in text-sm">{status}</span>}
        </div>
      </form>
      {sendOpen && (
        <SendModal
          task={d}
          onClose={() => setSendOpen(false)}
          onSent={(who) => {
            setSendOpen(false);
            setStatus(`Sent to ${who}`);
          }}
        />
      )}
    </>
  );
}

function SendModal({ task, onClose, onSent }: { task: Draft; onClose: () => void; onSent: (who: string) => void }) {
  const [who, setWho] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const send = () => {
    const to = who.trim();
    if (!to) {
      setError("Add a username or e-mail first");
      inputRef.current?.focus();
      return;
    }
    const text = `📝 ${task.title}\n📅 ${task.day} at ${task.deadline}\n${task.description}`;
    navigator.clipboard?.writeText(text).catch(() => {});
    onSent(to.startsWith("@") || to.includes("@") ? to : `@${to}`);
  };

  return (
    <div
      className="fixed inset-0 z-50 grid animate-in fade-in place-items-center bg-ink/30 p-4 backdrop-blur-sm duration-200"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Send task"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md animate-in fade-in zoom-in-95 slide-in-from-bottom-4 rounded-[2rem] border border-line bg-card p-6 shadow-soft duration-300 sm:p-8"
      >
        <h3 className="text-2xl font-medium">Send this task</h3>
        <div className={`mt-5 rounded-3xl px-5 py-4 ${tagBg[task.tag]}`}>
          <div className="flex justify-between gap-3 text-xl font-medium">
            <span>{task.title}</span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {task.deadline}
            </span>
          </div>
          <p className="mt-2 text-lg font-light">{task.description || "No description yet"}</p>
          <p className="mt-2 text-sm opacity-70">{task.day}</p>
        </div>
        <label htmlFor="recipient" className="mt-6 block text-lg font-medium">
          Username or e-mail
        </label>
        <input
          id="recipient"
          ref={inputRef}
          value={who}
          onChange={(e) => {
            setWho(e.target.value);
            setError("");
          }}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), send())}
          placeholder="@username or name@mail.com"
          className="mt-2 w-full rounded-xl border border-line bg-card px-4 py-3 text-lg outline-none transition focus:border-tag-pink hover:bg-muted"
        />
        {error && <p className="mt-2 animate-in fade-in text-sm">{error}</p>}
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={send}
            className="rounded-full bg-tag-green px-7 py-3 text-lg font-medium shadow-soft transition hover:scale-105 active:scale-95"
          >
            Send
          </button>
          <button
            onClick={onClose}
            className="rounded-full border border-line bg-card px-7 py-3 text-lg shadow-soft transition hover:scale-105 hover:bg-muted active:scale-95"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
