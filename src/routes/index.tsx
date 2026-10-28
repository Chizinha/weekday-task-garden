import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Plus } from "lucide-react";
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
];

let nextId = 100;
const sample = (tag: Tag, done: boolean): Task => ({
  id: nextId++,
  title: "Title",
  deadline: "*Deadline*",
  description: "Description text that describes the task",
  tag,
  done,
});

function Index() {
  const [tasks, setTasks] = useState<Record<string, Task[]>>({
    Monday: [sample("pink", true), sample("yellow", false)],
    Tuesday: [sample("blue", true), sample("pink", true), sample("yellow", false)],
  });
  const [openDay, setOpenDay] = useState<string | null>("Monday");

  const toggle = (day: string, id: number) =>
    setTasks((t) => ({ ...t, [day]: (t[day] ?? []).map((x) => (x.id === id ? { ...x, done: !x.done } : x)) }));

  const add = (day: string, task: Omit<Task, "id" | "done">) => {
    setTasks((t) => ({ ...t, [day]: [...(t[day] ?? []), { ...task, id: nextId++, done: false }] }));
    setOpenDay(null);
  };

  return (
    <main
      className="min-h-screen bg-cover bg-center bg-fixed px-4 py-10 font-sans text-ink"
      style={{ backgroundImage: `url(${bg})` }}
    >
      <h1 className="mb-8 text-center text-5xl font-medium tracking-tight">Todo - Week</h1>
      <div className="mx-auto max-w-[720px] rounded-[3.5rem] bg-card px-6 py-12 shadow-soft sm:px-[90px]">
        {DAYS.map((d, i) => (
          <section key={d.name} className={i > 0 ? "mt-12" : ""}>
            <div className="mb-8 flex items-center justify-between">
              <h2 className="flex items-center gap-4 text-4xl font-medium">
                <span className="text-3xl">{d.icon}</span>
                {d.name}
              </h2>
              <button
                aria-label={`Add task to ${d.name}`}
                onClick={() => setOpenDay(openDay === d.name ? null : d.name)}
                className="grid h-14 w-14 place-items-center rounded-full bg-tag-green text-ink shadow-soft transition hover:scale-105"
              >
                <Plus className="h-9 w-9" strokeWidth={3} />
              </button>
            </div>
            {openDay === d.name && <TaskForm onSend={(t) => add(d.name, t)} />}
            <ul className="space-y-4">
              {(tasks[d.name] ?? []).map((t) => (
                <li key={t.id} className="flex items-center gap-5">
                  <button
                    aria-label={t.done ? "Mark as not done" : "Mark as done"}
                    onClick={() => toggle(d.name, t.id)}
                    className={`grid h-[60px] w-[60px] shrink-0 place-items-center rounded-full ${tagBg[t.tag]}`}
                  >
                    {t.done && (
                      <span className="grid h-11 w-11 place-items-center rounded-full bg-ink-soft text-card">
                        <Check className="h-6 w-6" strokeWidth={3} />
                      </span>
                    )}
                  </button>
                  <div className={`flex-1 rounded-3xl px-6 py-5 ${tagBg[t.tag]} ${t.done ? "opacity-90" : ""}`}>
                    <div className="flex justify-between gap-3 text-xl font-medium">
                      <span>{t.title}</span>
                      <span>{t.deadline}</span>
                    </div>
                    <p className="mt-2 text-lg">{t.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}

function TaskForm({ onSend }: { onSend: (t: Omit<Task, "id" | "done">) => void }) {
  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState("");
  const [description, setDescription] = useState("");
  const [tag, setTag] = useState<Tag>("pink");
  const field = "rounded-xl border border-line bg-card px-4 py-3 outline-none focus:border-tag-pink placeholder:text-ink";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!title.trim()) return;
        onSend({ title, deadline: deadline || "*Deadline*", description, tag });
      }}
      className="mb-10 rounded-[2rem] border border-line bg-card p-6 shadow-soft sm:px-14"
    >
      <div className="flex justify-between gap-4">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className={`${field} w-32 text-2xl font-medium`} />
        <input value={deadline} onChange={(e) => setDeadline(e.target.value)} placeholder="*Deadline*" className={`${field} w-48 text-right text-2xl font-medium`} />
      </div>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description text that describes the task..."
        rows={2}
        className={`${field} mt-6 w-full resize-none text-xl font-light`}
      />
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button type="submit" className="rounded-full border border-line bg-card px-8 py-3 text-lg shadow-soft transition hover:bg-muted">
          Send task
        </button>
        {TAGS.map((c) => (
          <button
            type="button"
            key={c}
            aria-label={`${c} tag`}
            onClick={() => setTag(c)}
            className={`h-12 w-12 rounded-full shadow-soft transition ${tagBg[c]} ${tag === c ? "ring-2 ring-ink-soft ring-offset-2" : ""}`}
          />
        ))}
      </div>
    </form>
  );
}
