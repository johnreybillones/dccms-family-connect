import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/PublicLayout";
import aboutClass from "@/assets/about-class.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Us — DCCMS" },
      { name: "description", content: "Learn about DCCMS — our mission, vision, approach, and commitment to the Day Care Center of Barangay San Antonio de Padua I." },
    ],
  }),
  component: AboutPage,
});

function Card({ title, children, color = "bg-white" }: { title: string; children: React.ReactNode; color?: string }) {
  return (
    <div className={`${color} rounded-3xl shadow-xl p-6 sm:p-8`}>
      <h2 className="font-display text-2xl sm:text-3xl font-bold text-brand mb-3 text-center">{title}</h2>
      <div className="text-foreground text-base leading-relaxed">{children}</div>
    </div>
  );
}

function AboutPage() {
  return (
    <PublicLayout>
      <section className="bg-sky py-12 sm:py-16">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h1 className="font-display text-4xl sm:text-6xl font-bold text-white drop-shadow-md">ABOUT US!</h1>
          <button className="mt-6 bg-accent-red text-white font-display px-6 py-2 rounded-xl shadow-md">Read More</button>
        </div>
      </section>

      <section className="bg-sky pb-20">
        <div className="mx-auto max-w-5xl px-6 space-y-10">
          <Card title="Who We Are" color="bg-amber-300/90">
            <p className="mb-4">
              DCCMS is a service-learning project built by student developers from De La Salle University –
              Dasmariñas in partnership with Barangay San Antonio de Padua I, to support the local Day Care Center.
            </p>
            <img src={aboutClass} alt="Children at the daycare" className="rounded-2xl w-full" loading="lazy" width={1024} height={768} />
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card title="Our Mission">
              An online platform to provide ease of documentation, promoting simplicity and reliable records
              status of enrollment, attendance, and progress monitoring between the teachers and parents.
            </Card>
            <Card title="Our Vision">
              A reservoir of accurate and accessible records empowering daycare educators in Barangay
              San Antonio de Padua I to deliver quality, child-centered care through a community-wide
              administrative service.
            </Card>
          </div>

          <Card title="What We Do">
            <ul className="list-disc pl-6 space-y-2">
              <li>Digitizing student records for faster, accurate data access</li>
              <li>Simplifying attendance tracking and weekly monitoring</li>
              <li>Automating report generation for submission to CSWD and other offices</li>
              <li>Providing announcements and updates for parents and guardians</li>
              <li>Ensuring usability through offline-first design</li>
            </ul>
          </Card>

          <Card title="Our Approach">
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Simplicity</strong> — easy to learn and use</li>
              <li><strong>Accessibility</strong> — works even without internet</li>
              <li><strong>Efficiency</strong> — reduces manual workload</li>
              <li><strong>Security</strong> — protects sensitive information</li>
            </ul>
          </Card>

          <Card title="Our Commitment" color="bg-white">
            We are committed to developing a system that is not only functional but also meaningful to the users.
            By aligning the design with the actual needs of the daycare center, our team strives to deliver a
            solution that empowers, supports education, and ultimately benefits the children and families they serve.
          </Card>

          <Card title="Our Partners">
            <p className="mb-2">This project was made possible through collaboration with:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Day Care Center Personnel of Barangay San Antonio de Padua I</li>
              <li>Barangay Officials</li>
              <li>Parents and Guardians</li>
              <li>CSWD and Regional Offices</li>
            </ul>
          </Card>

          <Card title="Contact Us">
            Reach out to us directly at <em className="text-foreground/70">[email placeholder]</em><br />
            Phone: <em className="text-foreground/70">[phone placeholder]</em>
          </Card>
        </div>
      </section>
    </PublicLayout>
  );
}