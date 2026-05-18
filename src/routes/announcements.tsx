import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/PublicLayout";
import kid from "@/assets/announcement-kid.jpg";

export const Route = createFileRoute("/announcements")({
  head: () => ({
    meta: [
      { title: "Announcements — DCCMS" },
      { name: "description", content: "Latest announcements from the Day Care Center of Barangay San Antonio de Padua I." },
    ],
  }),
  component: AnnouncementsPage,
});

type Announcement = { id: number; tag: string; date: string; title: string; body: string };

const SAMPLE: Announcement[] = [
  { id: 3, tag: "Health Alert", date: "May 10, 2026", title: "Child Weight Monitoring Schedule", body: "Monthly weight check for all enrolled children. Please bring your child's health booklet." },
  { id: 2, tag: "Event", date: "May 3, 2026", title: "Parent-Teacher Meeting", body: "Quarterly meeting to discuss your child's progress and upcoming activities. Snacks will be provided." },
  { id: 1, tag: "Holiday", date: "April 28, 2026", title: "No Classes — Labor Day", body: "The daycare center will be closed in observance of Labor Day. Classes resume the next day." },
];

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
              Latest Announcements:
            </h1>
            <div className="bg-amber-400 rounded-3xl shadow-xl p-6 sm:p-8 text-white max-w-md">
              <h2 className="font-display text-2xl sm:text-3xl font-bold mb-3">Stay tuned for new news!</h2>
              <p className="text-sm sm:text-base">
                Any future announcements will show up here, giving everyone the latest information.
              </p>
            </div>
          </div>
          <div className="bg-white rounded-[40%_60%_40%_60%/60%_40%_60%_40%] aspect-square max-w-md mx-auto shadow-2xl" />
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
              <p className="text-accent-red font-bold">Couldn't load announcements.</p>
              <button onClick={() => setState("loading")} className="mt-4 bg-brand text-white px-6 py-2 rounded-xl">Retry</button>
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
                <article key={a.id} className="bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col">
                  <img src={kid} alt="" className="w-full h-64 object-cover" loading="lazy" width={768} height={896} />
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 text-xs mb-2">
                      <span className="bg-accent-red text-white px-2 py-1 rounded-full font-bold">{a.tag}</span>
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