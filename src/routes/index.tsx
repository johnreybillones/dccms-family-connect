import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicLayout } from "@/components/PublicLayout";
import { CloudDivider } from "@/components/CloudDivider";
import hero from "@/assets/hero-daycare.jpg";
import aboutImg from "@/assets/about-class.jpg";
import featRecords from "@/assets/feature-records.jpg";
import featAttendance from "@/assets/feature-attendance.jpg";
import featReports from "@/assets/feature-reports.jpg";

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
    img: featRecords,
    title: "Early Childhood Education",
    desc: "Age-appropriate learning activities that prepare children for primary school.",
  },
  {
    img: featAttendance,
    title: "Child Nutrition & Health",
    desc: "Regular weight monitoring and health tracking to support every child's well-being.",
  },
  {
    img: featReports,
    title: "Community Engagement",
    desc: "Bringing parents, guardians, and the barangay together for our children's growth.",
  },
];

function Index() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative bg-sky overflow-hidden">
        <img
          src={hero}
          alt="Children playing happily at the Day Care Center"
          className="absolute inset-0 w-full h-full object-cover"
          width={1536}
          height={896}
        />
        <div className="absolute inset-0 bg-slate-950/40" />
        <div className="relative mx-auto max-w-7xl px-6 pt-16 pb-32 sm:pt-24 sm:pb-44">
          <div className="max-w-xl text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.3)]">
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
              Welcome to Barangay San Antonio de Padua I Day Care Center
            </h1>
            <p className="mt-4 text-brand font-bold text-base sm:text-lg">
              Dasmariñas City, Cavite
            </p>
            <p className="mt-2 text-base sm:text-lg max-w-md text-white/95">
              A safe, fun, and nurturing place dedicated to early childhood education and the
              holistic development of every child in our community.
            </p>
            <Link
              to="/login"
              className="inline-block mt-6 bg-accent-red hover:bg-accent-red/90 text-white font-display text-lg px-10 py-3 rounded-2xl shadow-lg transition-colors"
            >
              Staff Login
            </Link>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 z-10 translate-y-px">
          <CloudDivider color="#f0f9ff" />
        </div>
      </section>

      {/* About Our Day Care Center */}
      <section className="bg-gradient-to-b from-sky-50 to-sky-100 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-6 grid md:grid-cols-2 gap-10 items-center">
          <div className="text-slate-800">
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4 text-brand-dark">
              About Our Day Care Center
            </h2>
            <p className="text-base sm:text-lg leading-relaxed text-slate-700">
              The Day Care Center of Barangay San Antonio de Padua I provides quality early
              childhood education and care for children in our community. Our dedicated team creates
              a nurturing environment where children learn, play, and grow — building strong
              foundations for their future.
            </p>
          </div>
          <div className="rounded-3xl overflow-hidden shadow-2xl">
            <img
              src={aboutImg}
              alt="Teacher with children doing arts and crafts at the Day Care Center"
              className="w-full h-auto"
              loading="lazy"
              width={1024}
              height={768}
            />
          </div>
        </div>
      </section>

      {/* Our Programs */}
      <section className="bg-gradient-to-b from-sky-100 to-sky-50 pb-20">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-brand-dark text-center mb-10">
            Our Programs
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {programs.map((p) => (
              <div
                key={p.title}
                className="bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col hover:-translate-y-1 hover:shadow-2xl transition-all duration-300"
              >
                <img
                  src={p.img}
                  alt={p.title}
                  className="w-full h-56 object-cover"
                  loading="lazy"
                  width={768}
                  height={768}
                />
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="font-display text-2xl text-brand-dark font-bold mb-2">
                    {p.title}
                  </h3>
                  <p className="text-sm text-foreground/80">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
