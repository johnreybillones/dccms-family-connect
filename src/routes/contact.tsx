import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Toaster, toast } from "sonner";
import { PublicLayout } from "@/components/PublicLayout";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  MessageCircle,
  Send,
  CheckCircle,
  Loader2,
} from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us — Barangay San Antonio de Padua I Day Care Center" },
      {
        name: "description",
        content:
          "Get in touch with the Day Care Center of Barangay San Antonio de Padua I. Enquire about admissions, child care, programs, and updates.",
      },
    ],
  }),
  component: ContactPage,
});

const contactSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  childName: z.string().optional(),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(7, "Phone number must be at least 7 digits"),
  subject: z.string().min(3, "Subject must be at least 3 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type ContactFormValues = z.infer<typeof contactSchema>;

const Placeholder = ({ children }: { children: React.ReactNode }) => (
  <span className="text-slate-600 font-medium italic">{children}</span>
);

function ContactPage() {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      fullName: "",
      childName: "",
      email: "",
      phone: "",
      subject: "",
      message: "",
    },
  });

  const onSubmit = (data: ContactFormValues) => {
    setSubmitting(true);
    // Simulate API fetch delay
    setTimeout(() => {
      setSubmitting(false);
      setSuccess(true);
      toast.success("Message sent successfully!", {
        description: `Thank you, ${data.fullName}! We will get back to you soon.`,
      });
      reset();
    }, 1200);
  };

  return (
    <PublicLayout>
      <Toaster richColors position="top-center" />

      {/* Page Header */}
      <section className="bg-gradient-to-b from-sky-100 to-sky-50 py-12 sm:py-16 text-center">
        <div className="mx-auto max-w-3xl px-6">
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-brand-dark">
            Contact Us
          </h1>
          <p className="mt-3 text-slate-600 text-base sm:text-lg max-w-xl mx-auto">
            We'd love to hear from parents, guardians, and the community. Reach out to us for
            enrollments, questions, or updates.
          </p>
        </div>
      </section>

      {/* Main Content Section */}
      <section className="bg-gradient-to-b from-sky-50 to-sky-100/30 pb-20">
        <div className="mx-auto max-w-6xl px-6 grid lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Contact Details */}
          <div className="lg:col-span-5 space-y-6">
            {[
              {
                icon: MapPin,
                title: "Address",
                body: "Day Care Center, Barangay San Antonio de Padua I, Dasmariñas City, Cavite, Philippines",
              },
              {
                icon: Phone,
                title: "Phone",
                body: <Placeholder>0912-345-6789 (Placeholder)</Placeholder>,
              },
              {
                icon: Mail,
                title: "Email",
                body: <Placeholder>daycare.padua1@example.com (Placeholder)</Placeholder>,
              },
              {
                icon: Clock,
                title: "Office Hours",
                body: <Placeholder>Monday to Friday, 8:00 AM – 3:00 PM (Placeholder)</Placeholder>,
              },
            ].map((c) => (
              <div
                key={c.title}
                className="bg-white rounded-3xl shadow-md border border-sky-100/50 p-6 flex gap-4 items-start hover:-translate-y-1 hover:shadow-xl transition-all duration-300"
              >
                <div className="bg-brand-dark/10 text-brand-dark p-3 rounded-2xl shrink-0">
                  <c.icon size={24} />
                </div>
                <div>
                  <h2 className="font-display text-lg text-brand-dark font-bold">{c.title}</h2>
                  <p className="text-slate-700 mt-1 text-sm sm:text-base leading-relaxed">
                    {c.body}
                  </p>
                </div>
              </div>
            ))}

            {/* Messenger Quick Link */}
            <div className="bg-white rounded-3xl shadow-md border border-sky-100/50 p-6 flex flex-col sm:flex-row gap-4 items-center justify-between hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center gap-4">
                <div className="bg-brand-dark/10 text-brand-dark p-3 rounded-2xl shrink-0">
                  <MessageCircle size={24} />
                </div>
                <div>
                  <h2 className="font-display text-lg text-brand-dark font-bold">Messenger</h2>
                  <p className="text-slate-600 text-sm">Chat with us directly.</p>
                </div>
              </div>
              <a
                href="https://m.me/placeholder-page"
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  e.preventDefault();
                  toast.info("Messenger Chat is a placeholder link.");
                }}
                className="bg-accent-red hover:bg-accent-red/90 text-white font-display text-sm px-5 py-2.5 rounded-2xl shadow transition-colors inline-flex items-center gap-2"
              >
                Open Messenger
              </a>
            </div>
          </div>

          {/* Right Column: Interactive Parent Contact Form */}
          <div className="lg:col-span-7 bg-white rounded-3xl shadow-xl p-6 sm:p-8 border border-sky-100/50">
            {success ? (
              <div className="text-center py-8 space-y-4">
                <div className="inline-flex items-center justify-center bg-emerald-50 text-emerald-600 h-16 w-16 rounded-full border-2 border-white shadow-md animate-bounce">
                  <CheckCircle size={32} />
                </div>
                <h2 className="font-display text-2xl font-bold text-slate-800">Message Sent!</h2>
                <p className="text-slate-600 max-w-md mx-auto">
                  Thank you for reaching out to us. We have received your inquiry and our team will
                  get back to you at the email provided shortly.
                </p>
                <button
                  onClick={() => setSuccess(false)}
                  className="mt-4 bg-brand-dark hover:bg-brand-dark/90 text-white font-display px-6 py-2.5 rounded-2xl transition-colors shadow-md"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <>
                <h2 className="font-display text-2xl font-bold text-brand-dark mb-4 text-center">
                  Send us a Message
                </h2>
                <p className="text-sm text-slate-500 mb-6 text-center">
                  Fill out this form to connect with Barangay Padua I daycare coordinators.
                </p>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Full Name <span className="text-accent-red">*</span>
                      </label>
                      <input
                        {...register("fullName")}
                        className="w-full border border-sky-200 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-dark transition-shadow text-sm"
                        placeholder="e.g. Maria Santos"
                      />
                      {errors.fullName && (
                        <span className="text-xs text-accent-red font-bold mt-1 block">
                          {errors.fullName.message}
                        </span>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Child's Name <span className="text-slate-400 font-normal">(Optional)</span>
                      </label>
                      <input
                        {...register("childName")}
                        className="w-full border border-sky-200 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-dark transition-shadow text-sm"
                        placeholder="e.g. Juan Santos"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Email Address <span className="text-accent-red">*</span>
                      </label>
                      <input
                        type="email"
                        {...register("email")}
                        className="w-full border border-sky-200 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-dark transition-shadow text-sm"
                        placeholder="e.g. maria@example.com"
                      />
                      {errors.email && (
                        <span className="text-xs text-accent-red font-bold mt-1 block">
                          {errors.email.message}
                        </span>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Phone Number <span className="text-accent-red">*</span>
                      </label>
                      <input
                        type="tel"
                        {...register("phone")}
                        className="w-full border border-sky-200 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-dark transition-shadow text-sm"
                        placeholder="e.g. 09123456789"
                      />
                      {errors.phone && (
                        <span className="text-xs text-accent-red font-bold mt-1 block">
                          {errors.phone.message}
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Subject <span className="text-accent-red">*</span>
                    </label>
                    <input
                      {...register("subject")}
                      className="w-full border border-sky-200 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-dark transition-shadow text-sm"
                      placeholder="e.g. Enrollment Requirements for SY 2026-2027"
                    />
                    {errors.subject && (
                      <span className="text-xs text-accent-red font-bold mt-1 block">
                        {errors.subject.message}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Your Inquiry/Message <span className="text-accent-red">*</span>
                    </label>
                    <textarea
                      rows={4}
                      {...register("message")}
                      className="w-full border border-sky-200 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-dark transition-shadow text-sm resize-none"
                      placeholder="Type your message in detail here..."
                    />
                    {errors.message && (
                      <span className="text-xs text-accent-red font-bold mt-1 block">
                        {errors.message.message}
                      </span>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-accent-red hover:bg-accent-red/90 text-white font-display text-lg px-6 py-3 rounded-2xl shadow-lg transition-all duration-200 disabled:opacity-75 inline-flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        Sending inquiry...
                      </>
                    ) : (
                      <>
                        <Send size={18} />
                        Submit Inquiry
                      </>
                    )}
                  </button>
                </form>
              </>
            )}
          </div>

          {/* Interactive Google Map Embed (Full Width) */}
          <div className="lg:col-span-12 bg-white rounded-3xl shadow-xl overflow-hidden border border-sky-100/50 p-2">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3866.5772392683935!2d120.97034177579768!3d14.27788418552697!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397d91d6b07c805%3A0xe21f574d754b5df!2sBarangay%20San%20Antonio%20de%20Padua%20I%20Hall!5e0!3m2!1sen!2sph!4v1716300000000!5m2!1sen!2sph"
              width="100%"
              height="400"
              style={{ border: 0, borderRadius: "1.25rem" }}
              allowFullScreen={true}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Barangay San Antonio de Padua I Location Map"
              className="w-full shadow-inner"
            />
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
