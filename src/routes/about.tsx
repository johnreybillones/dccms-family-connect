import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/PublicLayout";
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

function Card({
  title,
  children,
  color = "bg-white",
}: {
  title: string;
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <div className={`${color} rounded-3xl shadow-xl p-6 sm:p-8`}>
      <h2 className="font-display text-2xl sm:text-3xl font-bold text-brand mb-3 text-center">
        {title}
      </h2>
      <div className="text-foreground text-base leading-relaxed">{children}</div>
    </div>
  );
}

function AboutPage() {
  return (
    <PublicLayout>
      <section className="bg-sky py-12 sm:py-16">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h1 className="font-display text-4xl sm:text-6xl font-bold text-white drop-shadow-md">
            About Our Day Care Center
          </h1>
        </div>
      </section>

      <section className="bg-sky pb-20">
        <div className="mx-auto max-w-5xl px-6 space-y-10">
          {/* Who We Are */}
          <Card title="Who We Are" color="bg-amber-300/90">
            <p className="mb-4">
              The Day Care Center of Barangay San Antonio de Padua I is a community-supported early
              childhood education center serving the children and families of our barangay. We are
              committed to providing a safe, engaging, and developmentally appropriate environment
              where young learners can thrive.
            </p>
            <img
              src={aboutClass}
              alt="Children at the Day Care Center"
              className="rounded-2xl w-full"
              loading="lazy"
              width={1024}
              height={768}
            />
          </Card>

          {/* Mission & Vision */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card title="Our Mission">
              To provide a safe, nurturing, and stimulating educational environment that fosters the
              holistic development, well-being, and foundational learning of the children in our
              community.
            </Card>
            <Card title="Our Vision">
              To be a leading community partner in early childhood education, ensuring that every
              child in Barangay San Antonio de Padua I is empowered, cared for, and prepared for
              lifelong learning.
            </Card>
          </div>

          {/* Our Programs */}
          <Card title="Our Programs">
            <ul className="list-disc pl-6 space-y-2">
              <li>Early childhood education through age-appropriate learning activities</li>
              <li>Child nutrition monitoring and regular weight tracking</li>
              <li>Parent-teacher engagement through meetings and open communication</li>
              <li>Health and wellness awareness for children and families</li>
              <li>Preparation of children for entry into primary school</li>
            </ul>
          </Card>

          {/* Our Values */}
          <Card title="Our Values">
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Safety</strong> — A secure and caring environment for every child
              </li>
              <li>
                <strong>Inclusivity</strong> — Open to all children in our barangay
              </li>
              <li>
                <strong>Holistic Development</strong> — Nurturing the mind, body, and heart
              </li>
              <li>
                <strong>Community Partnership</strong> — Working hand-in-hand with parents and the
                barangay
              </li>
            </ul>
          </Card>

          {/* Our Commitment */}
          <Card title="Our Commitment">
            We are dedicated to the well-being and development of every child entrusted to our care.
            Through quality education, consistent health monitoring, and strong partnerships with
            parents and the community, we strive to give every child the best possible start in
            life.
          </Card>

          {/* Our Community */}
          <Card title="Our Community">
            <p className="mb-2">The Day Care Center is supported by:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Barangay San Antonio de Padua I Officials</li>
              <li>Parents and Guardians</li>
              <li>City Social Welfare and Development (CSWD) Office</li>
              <li>Department of Social Welfare and Development (DSWD)</li>
            </ul>
          </Card>

          {/* Meet Our Team */}
          <Card title="Meet Our Team">
            <p className="mb-6">Our dedicated daycare personnel are the heart of the center.</p>
            <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
              {/* Personnel Card — Ms. Cherry */}
              <div className="bg-sky/10 rounded-2xl p-5 flex flex-col items-center text-center w-full sm:max-w-xs">
                <div className="h-24 w-24 rounded-full bg-brand/20 flex items-center justify-center mb-3 text-brand font-display text-3xl font-bold">
                  MC
                </div>
                <p className="font-display text-xl font-bold text-brand">Ms. Cherry</p>
                <p className="text-sm text-foreground/60 italic mt-1">[role placeholder]</p>
                <p className="text-sm text-foreground/70 mt-2">[description placeholder]</p>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </PublicLayout>
  );
}
