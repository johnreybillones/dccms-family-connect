import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
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
      { title: "DCCMS — Day Care Center Management System" },
      { name: "description", content: "A simple and reliable system for managing student records, attendance, and reports — Barangay San Antonio de Padua I." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative bg-sky overflow-hidden">
        <img
          src={hero}
          alt="Children playing happily under a rainbow at the Day Care Center"
          className="absolute inset-0 w-full h-full object-cover"
          width={1536}
          height={896}
        />
        <div className="relative mx-auto max-w-7xl px-6 pt-16 pb-32 sm:pt-24 sm:pb-44">
          <div className="max-w-xl text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
              Day Care Center<br />Management System<br />(DCCMS)
            </h1>
            <p className="mt-4 text-brand font-bold text-base sm:text-lg">
              Barangay San Antonio de Padua I
            </p>
            <p className="mt-2 text-base sm:text-lg max-w-md">
              A simple and reliable system for managing student records, attendance, and reports.
            </p>
            <Link
              to="/login"
              className="inline-block mt-6 bg-accent-red hover:bg-accent-red/90 text-white font-display text-lg px-10 py-3 rounded-2xl shadow-lg transition-colors"
            >
              Login
            </Link>
          </div>
        </div>
      </section>

      {/* About the System */}
      <section className="bg-sky py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-6 grid md:grid-cols-2 gap-10 items-center">
          <div className="text-white">
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4 drop-shadow">About the System</h2>
            <p className="text-base sm:text-lg leading-relaxed">
              The Day Care Center Management System (DCCMS) replaces manual record-keeping with a digital
              solution. It improves efficiency, reduces paperwork, and ensures accurate tracking of
              children's development — giving teachers more time to focus on what matters most: the children.
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

      {/* Features */}
      <section className="bg-sky pb-20">
        <div className="mx-auto max-w-7xl px-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { img: featRecords, title: "Student Records" },
            { img: featAttendance, title: "Attendance Tracking" },
            { img: featReports, title: "Reports" },
          ].map((f) => (
            <div key={f.title} className="bg-white rounded-3xl shadow-xl overflow-hidden">
              <img src={f.img} alt={f.title} className="w-full h-56 object-cover" loading="lazy" width={768} height={768} />
              <div className="p-5">
                <h3 className="font-display text-2xl text-brand font-bold">{f.title}</h3>
              </div>
            </div>
          ))}
        </div>
      </section>
    </PublicLayout>
  );
}
