import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/PublicLayout";
import { MapPin, Phone, Mail, Clock, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us — Barangay San Antonio de Padua I Day Care Center" },
      {
        name: "description",
        content: "Get in touch with the Day Care Center of Barangay San Antonio de Padua I.",
      },
    ],
  }),
  component: ContactPage,
});

const Placeholder = ({ children }: { children: React.ReactNode }) => (
  <span className="italic text-foreground/60">{children}</span>
);

function ContactPage() {
  return (
    <PublicLayout>
      <section className="bg-sky py-12 sm:py-16 text-center">
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-white drop-shadow">
          Contact Us
        </h1>
        <p className="mt-3 text-white/90 max-w-xl mx-auto px-6">
          We'd love to hear from parents, guardians, and the community.
        </p>
      </section>

      <section className="bg-sky pb-20">
        <div className="mx-auto max-w-5xl px-6 grid md:grid-cols-2 gap-6">
          {[
            {
              icon: MapPin,
              title: "Address",
              body: "Day Care Center, Barangay San Antonio de Padua I, Dasmariñas City, Cavite, Philippines",
            },
            {
              icon: Phone,
              title: "Phone",
              body: <Placeholder>[contact number placeholder]</Placeholder>,
            },
            { icon: Mail, title: "Email", body: <Placeholder>[email placeholder]</Placeholder> },
            {
              icon: Clock,
              title: "Office Hours",
              body: <Placeholder>[office hours placeholder]</Placeholder>,
            },
          ].map((c) => (
            <div
              key={c.title}
              className="bg-white rounded-3xl shadow-xl p-6 flex gap-4 items-start"
            >
              <div className="bg-brand/10 text-brand p-3 rounded-2xl">
                <c.icon size={24} />
              </div>
              <div>
                <h2 className="font-display text-xl text-brand font-bold">{c.title}</h2>
                <p className="text-foreground mt-1">{c.body}</p>
              </div>
            </div>
          ))}

          <div className="bg-white rounded-3xl shadow-xl p-6 md:col-span-2 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-brand/10 text-brand p-3 rounded-2xl">
                <MessageCircle size={24} />
              </div>
              <div>
                <h2 className="font-display text-xl text-brand font-bold">Messenger</h2>
                <p className="text-foreground/70 text-sm">Chat with us directly.</p>
              </div>
            </div>
            <button className="bg-accent-red text-white font-display px-6 py-3 rounded-2xl shadow">
              Open Messenger (placeholder)
            </button>
          </div>

          <div className="md:col-span-2 bg-white rounded-3xl shadow-xl overflow-hidden">
            <div className="aspect-[16/8] bg-sky-100 flex items-center justify-center text-foreground/60 italic">
              [Google Maps embed placeholder]
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
