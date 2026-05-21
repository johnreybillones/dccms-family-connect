import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "framer-motion";
import { PublicLayout } from "@/components/PublicLayout";
import { CloudDivider } from "@/components/CloudDivider";
import { FadeInWhenVisible, StaggerChildren, StaggerItem, MotionCard } from "@/components/motion";
import { GraduationCap, Apple, Users, ArrowRight } from "lucide-react";
import hero from "@/assets/hero-daycare.jpg";
import aboutImg from "@/assets/about-class.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Barangay San Antonio de Padua I Day Care Center" },
      {
        name: "description",
        content:
          "Welcome to the Day Care Center of Barangay San Antonio de Padua I, Dasmariñas City — nurturing early childhood education for our community's children.",
      },
    ],
  }),
  component: Index,
});

const programs = [
  {
    icon: GraduationCap,
    iconColor: "text-brand",
    iconBg: "bg-sky-50",
    title: "Early Childhood Education",
    desc: "Age-appropriate learning activities that prepare children for primary school through play, creativity, and exploration.",
  },
  {
    icon: Apple,
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-50",
    title: "Child Nutrition & Health",
    desc: "Regular weight monitoring and health tracking to support every child's well-being and healthy development.",
  },
  {
    icon: Users,
    iconColor: "text-amber-600",
    iconBg: "bg-amber-50",
    title: "Community Engagement",
    desc: "Bringing parents, guardians, and the barangay together for our children's holistic growth and development.",
  },
];

function Index() {
  const shouldReduce = useReducedMotion();

  return (
    <PublicLayout>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <img
          src={hero}
          alt="Children playing happily at the Day Care Center"
          className="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-multiply"
          width={1536}
          height={896}
        />
        <div className="relative mx-auto max-w-7xl px-6 pt-12 pb-24 sm:pt-16 sm:pb-28 flex items-center min-h-[75vh]">
          <div className="max-w-xl bg-white/95 backdrop-blur-md rounded-[40px] p-8 sm:p-12 shadow-clay-card border border-white/50">
            <motion.h1
              className="font-display text-3xl sm:text-4xl lg:text-5xl font-black leading-tight text-brand-dark"
              initial={{ opacity: 0, y: shouldReduce ? 0 : 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: "easeOut", delay: 0 }}
            >
              Welcome to Barangay San Antonio de Padua I Day Care Center
            </motion.h1>
            <motion.p
              className="mt-4 text-brand font-bold text-base sm:text-lg"
              initial={{ opacity: 0, y: shouldReduce ? 0 : 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.15 }}
            >
              Dasmariñas City, Cavite
            </motion.p>
            <motion.p
              className="mt-4 text-base sm:text-lg max-w-md text-slate-700 leading-relaxed font-medium"
              initial={{ opacity: 0, y: shouldReduce ? 0 : 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.25 }}
            >
              A safe, fun, and nurturing place dedicated to early childhood education and the
              holistic development of every child in our community.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: shouldReduce ? 0 : 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: "easeOut", delay: 0.37 }}
              className="mt-8 flex flex-wrap gap-3"
            >
              <motion.div
                whileHover={shouldReduce ? {} : { scale: 1.03 }}
                whileTap={shouldReduce ? {} : { scale: 0.96 }}
                transition={{ type: "spring", stiffness: 500, damping: 22 }}
              >
                <Link
                  to="/contact"
                  id="hero-contact-cta"
                  className="inline-block bg-brand text-white font-display text-lg px-10 py-4 rounded-full shadow-clay active:shadow-clay-active active:translate-y-[8px] transition-all"
                >
                  Reach Out to Us
                </Link>
              </motion.div>
              <motion.div
                whileHover={shouldReduce ? {} : { scale: 1.03 }}
                whileTap={shouldReduce ? {} : { scale: 0.96 }}
                transition={{ type: "spring", stiffness: 500, damping: 22 }}
              >
                <Link
                  to="/about"
                  id="hero-about-cta"
                  className="inline-block bg-white border-2 border-brand text-brand font-display text-lg px-8 py-4 rounded-full transition-all hover:bg-sky-50"
                >
                  Learn More
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 z-10 translate-y-px">
          <CloudDivider color="#f0f9ff" />
        </div>
      </section>

      {/* ── About Our Day Care Center ── */}
      <FadeInWhenVisible>
        <section className="py-16 sm:py-20 relative">
          <div className="mx-auto max-w-7xl px-6 grid md:grid-cols-2 gap-10 items-center">
            <div className="text-slate-800">
              {/* Eyebrow label */}
              <p className="text-xs font-bold uppercase tracking-widest text-brand mb-2">
                Who We Are
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-black mb-2 text-brand-dark">
                About Our Day Care Center
              </h2>
              {/* Accent underline */}
              <div className="w-12 h-1 rounded-full bg-brand mb-6" />
              <p className="text-base sm:text-lg leading-relaxed text-slate-700 font-medium">
                The Day Care Center of Barangay San Antonio de Padua I provides quality early
                childhood education and care for children in our community. Our dedicated team
                creates a nurturing environment where children learn, play, and grow — building
                strong foundations for their future.
              </p>
              <Link
                to="/about"
                className="inline-flex items-center gap-2 mt-6 text-brand font-display font-bold hover:underline"
              >
                Read more about us <ArrowRight size={16} />
              </Link>
            </div>
            <FadeInWhenVisible delay={0.1}>
              <div className="rounded-[10px_60px_10px_60px] overflow-hidden shadow-clay-card border-8 border-white">
                <img
                  src={aboutImg}
                  alt="Teacher with children doing arts and crafts at the Day Care Center"
                  className="w-full h-auto"
                  loading="lazy"
                  width={1024}
                  height={768}
                />
              </div>
            </FadeInWhenVisible>
          </div>
        </section>
      </FadeInWhenVisible>

      {/* ── Our Programs ── */}
      <FadeInWhenVisible>
        <section className="pb-20 relative">
          <div className="mx-auto max-w-7xl px-6">
            <div className="text-center mb-12">
              <p className="text-xs font-bold uppercase tracking-widest text-brand mb-2">
                What We Offer
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-black text-brand-dark">
                Our Programs
              </h2>
              <div className="w-12 h-1 rounded-full bg-brand mx-auto mt-3" />
            </div>
            <StaggerChildren className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {programs.map((p) => {
                const Icon = p.icon;
                return (
                  <StaggerItem key={p.title}>
                    <MotionCard className="bg-white rounded-[40px_10px_40px_10px] shadow-clay-card flex flex-col border border-sky-100 h-full">
                      <div className="p-8 flex-1 flex flex-col">
                        <div
                          className={`w-14 h-14 ${p.iconBg} ${p.iconColor} rounded-2xl flex items-center justify-center mb-5 shadow-sm`}
                        >
                          <Icon size={28} />
                        </div>
                        <h3 className="font-display text-2xl text-brand-dark font-black mb-3">
                          {p.title}
                        </h3>
                        <p className="text-base text-slate-600 font-medium leading-relaxed flex-1">
                          {p.desc}
                        </p>
                      </div>
                    </MotionCard>
                  </StaggerItem>
                );
              })}
            </StaggerChildren>
          </div>
        </section>
      </FadeInWhenVisible>

      {/* ── CTA Strip ── */}
      <FadeInWhenVisible>
        <section className="bg-brand-dark py-14">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <h2 className="font-display text-2xl sm:text-3xl font-black text-white mb-3">
              Have questions about enrollment?
            </h2>
            <p className="text-white/80 text-base sm:text-lg mb-8 max-w-xl mx-auto">
              Reach out to us directly or visit the center during office hours. We're here to help.
            </p>
            <motion.div
              whileHover={shouldReduce ? {} : { scale: 1.04 }}
              whileTap={shouldReduce ? {} : { scale: 0.96 }}
              transition={{ type: "spring", stiffness: 500, damping: 22 }}
              className="inline-block"
            >
              <Link
                to="/contact"
                id="cta-strip-contact"
                className="inline-flex items-center gap-2 bg-white text-brand-dark font-display text-lg px-10 py-4 rounded-full shadow-lg hover:bg-sky-50 transition-colors"
              >
                Contact Us <ArrowRight size={18} />
              </Link>
            </motion.div>
          </div>
        </section>
      </FadeInWhenVisible>
    </PublicLayout>
  );
}
