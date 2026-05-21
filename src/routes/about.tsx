import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/PublicLayout";
import { FadeInWhenVisible, StaggerChildren, StaggerItem, MotionCard } from "@/components/motion";
import {
  Shield,
  Heart,
  Sparkles,
  Users,
  GraduationCap,
  Apple,
  MessageSquare,
  Book,
} from "lucide-react";
import aboutClass from "@/assets/about-class.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Us — Barangay San Antonio de Padua I Day Care Center" },
      {
        name: "description",
        content:
          "Learn about the Day Care Center of Barangay San Antonio de Padua I — our mission, vision, programs, and the people dedicated to nurturing our community's children.",
      },
    ],
  }),
  component: AboutPage,
});

const values = [
  {
    icon: Shield,
    label: "Safety",
    desc: "A secure and caring environment for every child",
    color: "bg-sky-50 text-brand",
  },
  {
    icon: Heart,
    label: "Inclusivity",
    desc: "Open to all children in our barangay",
    color: "bg-rose-50 text-rose-500",
  },
  {
    icon: Sparkles,
    label: "Holistic Development",
    desc: "Nurturing the mind, body, and heart",
    color: "bg-violet-50 text-violet-600",
  },
  {
    icon: Users,
    label: "Community Partnership",
    desc: "Working hand-in-hand with parents and the barangay",
    color: "bg-amber-50 text-amber-600",
  },
];

const programs = [
  {
    icon: GraduationCap,
    label: "Early childhood education through age-appropriate learning activities",
    color: "text-brand",
  },
  {
    icon: Apple,
    label: "Child nutrition monitoring and regular weight tracking",
    color: "text-emerald-600",
  },
  {
    icon: MessageSquare,
    label: "Parent-teacher engagement through meetings and open communication",
    color: "text-amber-600",
  },
  {
    icon: Heart,
    label: "Health and wellness awareness for children and families",
    color: "text-rose-500",
  },
  {
    icon: Book,
    label: "Preparation of children for entry into primary school",
    color: "text-violet-600",
  },
];

const community = [
  { icon: Users, label: "Barangay San Antonio de Padua I Officials", color: "text-brand" },
  { icon: Heart, label: "Parents and Guardians", color: "text-rose-500" },
  {
    icon: Shield,
    label: "City Social Welfare and Development (CSWD) Office",
    color: "text-emerald-600",
  },
  {
    icon: GraduationCap,
    label: "Department of Social Welfare and Development (DSWD)",
    color: "text-amber-600",
  },
];

function SectionLabel({ children }: { children: string }) {
  return <p className="text-xs font-bold uppercase tracking-widest text-brand mb-2">{children}</p>;
}

function SectionHeading({ children }: { children: string }) {
  return (
    <>
      <h2 className="font-display text-2xl sm:text-3xl font-black text-brand-dark">{children}</h2>
      <div className="w-10 h-1 rounded-full bg-brand mt-3 mb-6" />
    </>
  );
}

function AboutPage() {
  return (
    <PublicLayout>
      {/* ── Hero banner ── */}
      <section className="bg-gradient-to-b from-sky-100 to-sky-50 py-16 sm:py-20 text-center">
        <div className="mx-auto max-w-3xl px-6">
          <p className="text-xs font-bold uppercase tracking-widest text-brand mb-3">
            Get to Know Us
          </p>
          <h1 className="font-display text-4xl sm:text-6xl font-black text-brand-dark animate-float">
            About Our Day Care Center
          </h1>
          <div className="w-14 h-1.5 rounded-full bg-brand mx-auto mt-5" />
        </div>
      </section>

      {/* ── Who We Are — image + text side by side ── */}
      <FadeInWhenVisible>
        <section className="bg-sky-50 py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-6 grid md:grid-cols-2 gap-12 items-center">
            <div className="rounded-[10px_60px_10px_60px] overflow-hidden shadow-clay-card border-8 border-white">
              <img
                src={aboutClass}
                alt="Children at the Day Care Center"
                className="w-full h-auto"
                loading="lazy"
                width={1024}
                height={768}
              />
            </div>
            <div>
              <SectionLabel>Who We Are</SectionLabel>
              <SectionHeading>A Community-Supported Center</SectionHeading>
              <p className="text-slate-700 text-base sm:text-lg leading-relaxed font-medium">
                The Day Care Center of Barangay San Antonio de Padua I is a community-supported
                early childhood education center serving the children and families of our barangay.
                We are committed to providing a safe, engaging, and developmentally appropriate
                environment where young learners can thrive.
              </p>
            </div>
          </div>
        </section>
      </FadeInWhenVisible>

      {/* ── Mission & Vision — two cards side by side ── */}
      <FadeInWhenVisible>
        <section className="bg-gradient-to-b from-sky-50 to-white py-16">
          <div className="mx-auto max-w-6xl px-6">
            <div className="text-center mb-10">
              <SectionLabel>Our Purpose</SectionLabel>
              <SectionHeading>Mission &amp; Vision</SectionHeading>
            </div>
            <StaggerChildren className="grid md:grid-cols-2 gap-6">
              <StaggerItem>
                <MotionCard className="bg-brand-dark rounded-[40px_10px_40px_10px] shadow-clay-card p-8 sm:p-10 h-full">
                  <h3 className="font-display text-2xl font-black text-white mb-4">Our Mission</h3>
                  <p className="text-white/85 text-base sm:text-lg leading-relaxed font-medium">
                    To provide a safe, nurturing, and stimulating educational environment that
                    fosters the holistic development, well-being, and foundational learning of the
                    children in our community.
                  </p>
                </MotionCard>
              </StaggerItem>
              <StaggerItem>
                <MotionCard className="bg-amber-50 border border-amber-200 rounded-[10px_40px_10px_40px] shadow-clay-card p-8 sm:p-10 h-full">
                  <h3 className="font-display text-2xl font-black text-amber-950 mb-4">
                    Our Vision
                  </h3>
                  <p className="text-amber-900 text-base sm:text-lg leading-relaxed font-medium">
                    To be a leading community partner in early childhood education, ensuring that
                    every child in Barangay San Antonio de Padua I is empowered, cared for, and
                    prepared for lifelong learning.
                  </p>
                </MotionCard>
              </StaggerItem>
            </StaggerChildren>
          </div>
        </section>
      </FadeInWhenVisible>

      {/* ── Our Values — icon grid ── */}
      <FadeInWhenVisible>
        <section className="bg-white py-16">
          <div className="mx-auto max-w-6xl px-6">
            <div className="text-center mb-10">
              <SectionLabel>What We Stand For</SectionLabel>
              <SectionHeading>Our Values</SectionHeading>
            </div>
            <StaggerChildren className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((v) => {
                const Icon = v.icon;
                return (
                  <StaggerItem key={v.label}>
                    <MotionCard className="bg-white border border-sky-100 rounded-[30px_10px_30px_10px] shadow-clay-card p-6 text-center h-full flex flex-col items-center">
                      <div
                        className={`w-14 h-14 ${v.color} rounded-2xl flex items-center justify-center mb-4 shadow-sm`}
                        style={{ background: v.color.includes("bg-") ? undefined : undefined }}
                      >
                        <Icon size={26} />
                      </div>
                      <h3 className="font-display text-lg font-black text-brand-dark mb-2">
                        {v.label}
                      </h3>
                      <p className="text-sm text-slate-600 font-medium leading-relaxed">{v.desc}</p>
                    </MotionCard>
                  </StaggerItem>
                );
              })}
            </StaggerChildren>
          </div>
        </section>
      </FadeInWhenVisible>

      {/* ── Our Programs — icon list ── */}
      <FadeInWhenVisible>
        <section className="bg-sky-50 py-16">
          <div className="mx-auto max-w-5xl px-6">
            <div className="text-center mb-10">
              <SectionLabel>What We Offer</SectionLabel>
              <SectionHeading>Our Programs</SectionHeading>
            </div>
            <div className="bg-white rounded-[40px_10px_40px_10px] shadow-clay-card p-8 sm:p-10 border border-sky-100">
              <ul className="space-y-5">
                {programs.map((p) => {
                  const Icon = p.icon;
                  return (
                    <li key={p.label} className="flex items-start gap-4">
                      <span className={`mt-0.5 shrink-0 ${p.color}`}>
                        <Icon size={20} />
                      </span>
                      <span className="text-slate-700 text-base sm:text-lg font-medium leading-relaxed">
                        {p.label}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </section>
      </FadeInWhenVisible>

      {/* ── Our Commitment — full-width colored band ── */}
      <FadeInWhenVisible>
        <section className="bg-brand-dark py-16">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-white/60 mb-3">
              Our Promise
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-black text-white mb-2">
              Our Commitment
            </h2>
            <div className="w-10 h-1 rounded-full bg-white/50 mx-auto mb-8" />
            <p className="text-white/85 text-base sm:text-xl leading-relaxed font-medium max-w-2xl mx-auto">
              We are dedicated to the well-being and development of every child entrusted to our
              care. Through quality education, consistent health monitoring, and strong partnerships
              with parents and the community, we strive to give every child the best possible start
              in life.
            </p>
          </div>
        </section>
      </FadeInWhenVisible>

      {/* ── Our Community — icon list ── */}
      <FadeInWhenVisible>
        <section className="bg-sky-50 py-16">
          <div className="mx-auto max-w-5xl px-6">
            <div className="text-center mb-10">
              <SectionLabel>Together We Grow</SectionLabel>
              <SectionHeading>Our Community</SectionHeading>
            </div>
            <div className="bg-white rounded-[10px_40px_10px_40px] shadow-clay-card p-8 sm:p-10 border border-sky-100">
              <p className="text-slate-600 font-medium mb-6">
                The Day Care Center is supported by:
              </p>
              <ul className="space-y-4">
                {community.map((c) => {
                  const Icon = c.icon;
                  return (
                    <li key={c.label} className="flex items-center gap-4">
                      <span className={`shrink-0 ${c.color}`}>
                        <Icon size={20} />
                      </span>
                      <span className="text-slate-700 text-base sm:text-lg font-medium">
                        {c.label}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </section>
      </FadeInWhenVisible>

      {/* ── Meet Our Team ── */}
      <FadeInWhenVisible>
        <section className="bg-white py-16 pb-20">
          <div className="mx-auto max-w-5xl px-6">
            <div className="text-center mb-10">
              <SectionLabel>The People Behind the Center</SectionLabel>
              <SectionHeading>Meet Our Team</SectionHeading>
            </div>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <MotionCard className="bg-sky-50 border border-sky-100/50 rounded-[30px_10px_30px_10px] p-8 flex flex-col items-center text-center w-full sm:max-w-xs shadow-clay-card">
                <div className="h-24 w-24 rounded-[20px_10px] bg-white flex items-center justify-center mb-5 text-brand-dark font-display text-3xl font-black border-4 border-white shadow-clay">
                  MC
                </div>
                <p className="font-display text-xl font-black text-brand-dark">Ms. Cherry</p>
                <p className="text-xs bg-brand text-white shadow-clay px-3 py-1.5 rounded-full font-bold mt-2 uppercase tracking-wider">
                  Lead Teacher
                </p>
                <p className="text-sm sm:text-base text-slate-600 mt-5 leading-relaxed font-medium">
                  Dedicated to early childhood growth, parent coordination, and creating a
                  supportive learning space for every young mind.
                </p>
              </MotionCard>
            </div>
          </div>
        </section>
      </FadeInWhenVisible>
    </PublicLayout>
  );
}
