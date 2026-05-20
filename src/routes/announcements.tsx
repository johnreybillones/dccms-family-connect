import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/PublicLayout";
import kid from "@/assets/announcement-kid.jpg";

export const Route = createFileRoute("/announcements")({
  head: () => ({
    meta: [
      { title: "Announcements — Barangay San Antonio de Padua I Day Care Center" },
      {
        name: "description",
        content:
          "Latest announcements from the Day Care Center of Barangay San Antonio de Padua I.",
      },
    ],
  }),
  component: AnnouncementsPage,
});

type Announcement = { id: number; tag: string; date: string; title: string; body: string };

// Phase 1: hardcoded sample data.
// Phase 2: replace this array with an API fetch — the component's loading/error/empty
// states already support a real data source without structural changes.
const SAMPLE: Announcement[] = [
  {
    id: 4,
    tag: "Reminder",
    date: "April 20, 2026",
    title: "Enrollment Reminder for SY 2026–2027",
    body: "Enrollment for the upcoming school year is now open. Please visit the Day Care Center or contact us for requirements and schedules.",
  },
  {
    id: 3,
    tag: "Health Alert",
    date: "May 10, 2026",
    title: "Child Weight Monitoring Schedule",
    body: "Monthly weight check for all enrolled children will be conducted this week. Please ensure your child attends and bring their health booklet.",
  },
  {
    id: 2,
    tag: "Event",
    date: "May 3, 2026",
    title: "Parent-Teacher Meeting",
    body: "You are invited to our quarterly parent-teacher meeting to discuss your child's progress and upcoming center activities. Light snacks will be provided.",
  },
  {
    id: 1,
    tag: "Holiday",
    date: "April 28, 2026",
    title: "No Classes — Labor Day",
    body: "The Day Care Center will be closed on May 1 in observance of Labor Day. Regular classes resume the following day.",
  },
];

const TAG_COLORS: Record<string, string> = {
  "Health Alert": "bg-accent-red",
  Event: "bg-brand",
  Holiday: "bg-amber-500",
  Reminder: "bg-emerald-600",
};

type State = "loading" | "error" | "empty" | "ready";

function AnnouncementsPage() {
  const [state, setState] = useState<State>("loading");
  const [items, setItems] = useState<Announcement[]>([]);

  useEffect(() => {
    const t = setTimeout(() => {
      setItems(SAMPLE);
      setState("ready");
    }, 500);
    return () => clearTimeout(t);
  }, []);

  return (
    <PublicLayout>
      <section className="relative bg-sky py-12 sm:py-20 overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-white drop-shadow mb-6">
              Announcements
            </h1>
            <div className="bg-amber-400 rounded-3xl shadow-xl p-6 sm:p-8 text-white max-w-md">
              <h2 className="font-display text-2xl sm:text-3xl font-bold mb-3">Stay updated!</h2>
              <p className="text-sm sm:text-base">
                Stay updated with the latest news, events, and health reminders from our Day Care
                Center.
              </p>
            </div>
          </div>
          <div className="rounded-[40%_60%_40%_60%/60%_40%_60%_40%] overflow-hidden aspect-square max-w-md mx-auto shadow-2xl">
            <img
              src={kid}
              alt="Happy child at the Day Care Center"
              className="w-full h-full object-cover"
              loading="lazy"
              width={768}
              height={768}
            />
          </div>
        </div>
      </section>

      <section className="bg-sky py-12">
        <div className="mx-auto max-w-7xl px-6">
          {state === "loading" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-3xl shadow-xl h-80 animate-pulse" />
              ))}
            </div>
          )}

          {state === "error" && (
            <div className="bg-white rounded-3xl p-8 text-center shadow-xl">
              <p className="text-accent-red font-bold">Couldn&apos;t load announcements.</p>
              <button
                onClick={() => setState("loading")}
                className="mt-4 bg-brand text-white px-6 py-2 rounded-xl"
              >
                Retry
              </button>
            </div>
          )}

          {state === "empty" && (
            <div className="bg-white rounded-3xl p-8 text-center shadow-xl">
              <p>No announcements yet. Check back soon!</p>
            </div>
          )}

          {state === "ready" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((a) => (
                <article
                  key={a.id}
                  className="bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col"
                >
                  <img
                    src={kid}
                    alt=""
                    className="w-full h-48 object-cover"
                    loading="lazy"
                    width={768}
                    height={512}
                  />
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 text-xs mb-2">
                      <span
                        className={`${TAG_COLORS[a.tag] ?? "bg-brand"} text-white px-2 py-1 rounded-full font-bold`}
                      >
                        {a.tag}
                      </span>
                      <span className="text-foreground/60">{a.date}</span>
                    </div>
                    <h3 className="font-display text-xl text-brand font-bold mb-2">{a.title}</h3>
                    <p className="text-sm text-foreground/80 flex-1">{a.body}</p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
