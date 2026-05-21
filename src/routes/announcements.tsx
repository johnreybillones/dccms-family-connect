import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/PublicLayout";
import { FadeInWhenVisible, StaggerChildren, StaggerItem } from "@/components/motion";
import kid from "@/assets/announcement-kid.jpg";
import attendanceImg from "@/assets/feature-attendance.jpg";
import aboutImg from "@/assets/about-class.jpg";
import rainbowImg from "@/assets/sky-rainbow.jpg";

export const Route = createFileRoute("/announcements")({
  head: () => ({
    meta: [
      { title: "Announcements — Barangay San Antonio de Padua I Day Care Center" },
      {
        name: "description",
        content:
          "Latest announcements, events, schedules, and health advisories from the Day Care Center of Barangay San Antonio de Padua I.",
      },
    ],
  }),
  component: AnnouncementsPage,
});

type Announcement = {
  id: number;
  tag: string;
  date: string;
  title: string;
  body: string;
  img: string;
};

const SAMPLE: Announcement[] = [
  {
    id: 4,
    tag: "Reminder",
    date: "April 20, 2026",
    title: "Enrollment Reminder for SY 2026–2027",
    body: "Enrollment for the upcoming school year is now open. Please visit the Day Care Center or contact us for requirements and schedules.",
    img: aboutImg,
  },
  {
    id: 3,
    tag: "Health Alert",
    date: "May 10, 2026",
    title: "Child Weight Monitoring Schedule",
    body: "Monthly weight check for all enrolled children will be conducted this week. Please ensure your child attends and bring their health booklet.",
    img: kid,
  },
  {
    id: 2,
    tag: "Event",
    date: "May 3, 2026",
    title: "Parent-Teacher Meeting",
    body: "You are invited to our quarterly parent-teacher meeting to discuss your child's progress and upcoming center activities. Light snacks will be provided.",
    img: attendanceImg,
  },
  {
    id: 1,
    tag: "Holiday",
    date: "April 28, 2026",
    title: "No Classes — Labor Day",
    body: "The Day Care Center will be closed on May 1 in observance of Labor Day. Regular classes resume the following day.",
    img: rainbowImg,
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
  const [activeCategory, setActiveCategory] = useState<string>("All");

  useEffect(() => {
    const t = setTimeout(() => {
      setItems(SAMPLE);
      setState("ready");
    }, 500);
    return () => clearTimeout(t);
  }, []);

  const filteredItems =
    activeCategory === "All" ? items : items.filter((a) => a.tag === activeCategory);

  return (
    <PublicLayout>
      <section className="relative bg-gradient-to-b from-sky-100 to-sky-50 py-12 sm:py-20 overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-brand-dark mb-6">
              Announcements
            </h1>
            <div className="bg-amber-50 border border-amber-200 rounded-[30px_10px_30px_10px] shadow-clay-card p-6 sm:p-8 text-amber-900 max-w-md">
              <h2 className="font-display text-2xl sm:text-3xl font-bold mb-3 text-amber-950">
                Stay updated!
              </h2>
              <p className="text-sm sm:text-base text-amber-800">
                Stay updated with the latest news, events, and health reminders from our Day Care
                Center.
              </p>
            </div>
          </div>
          <div className="rounded-[40%_60%_40%_60%/60%_40%_60%_40%] overflow-hidden aspect-square max-w-md mx-auto shadow-clay-card border-8 border-white">
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

      <section className="bg-gradient-to-b from-sky-50 to-sky-100/30 py-12">
        <div className="mx-auto max-w-7xl px-6">
          {/* Category Tabs */}
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-10">
            {["All", "Reminder", "Health Alert", "Event", "Holiday"].map((category) => {
              const active = activeCategory === category;
              return (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`px-5 py-2.5 rounded-full font-display text-sm font-semibold transition-all duration-300 cursor-pointer ${
                    active
                      ? "bg-brand-dark text-white shadow-lg shadow-brand-dark/25 scale-105"
                      : "bg-white hover:bg-sky-50 text-brand-dark/80 border border-sky-100/50 hover:border-sky-200"
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>

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

          {(state === "empty" || (state === "ready" && filteredItems.length === 0)) && (
            <div className="bg-white rounded-3xl p-12 text-center shadow-md max-w-md mx-auto border border-sky-100">
              <p className="text-slate-600 font-display text-lg font-medium">
                No announcements found in this category.
              </p>
              <button
                onClick={() => setActiveCategory("All")}
                className="mt-4 bg-brand-dark hover:bg-brand-dark/90 text-white font-display text-sm px-6 py-2 rounded-2xl shadow transition-colors"
              >
                Show all announcements
              </button>
            </div>
          )}

          {state === "ready" && filteredItems.length > 0 && (
            <StaggerChildren className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredItems.map((a) => (
                <StaggerItem key={`${a.id}-${activeCategory}`}>
                  <article className="bg-white rounded-[40px_10px_40px_10px] shadow-clay-card flex flex-col hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 border border-sky-100 h-full">
                    <img
                      src={a.img}
                      alt=""
                      className="w-full h-48 object-cover rounded-[40px_10px_0px_0px]"
                      loading="lazy"
                      width={768}
                      height={512}
                    />
                    <div className="p-5 flex-1 flex flex-col">
                      <div className="flex items-center gap-2 text-xs mb-2">
                        <span
                          className={`${TAG_COLORS[a.tag] ?? "bg-brand"} text-white px-2.5 py-1 rounded-full font-bold`}
                        >
                          {a.tag}
                        </span>
                        <span className="text-slate-600 font-semibold">{a.date}</span>
                      </div>
                      <h3 className="font-display text-xl text-brand-dark font-bold mb-2">
                        {a.title}
                      </h3>
                      <p className="text-sm text-slate-700 leading-relaxed flex-1">{a.body}</p>
                    </div>
                  </article>
                </StaggerItem>
              ))}
            </StaggerChildren>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
