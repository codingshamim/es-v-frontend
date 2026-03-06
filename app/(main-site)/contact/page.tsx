import { ContactFormSection } from "./ContactFormSection";
import { ContactInfoSection } from "./ContactInfoSection";

export const metadata = {
  title: "Contact",
  description:
    "Contact ES FITT support for order inquiries, sizing help, and general questions.",
};

export default function ContactPage() {
  return (
    <main className="min-h-[60vh] pb-24 lg:pb-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Heading */}
        <header className="mb-8 lg:mb-10">
          <p className="inline-flex items-center gap-2 rounded-full border border-black/10 dark:border-white/15 px-4 py-1 text-xs font-medium uppercase tracking-widest text-black/60 dark:text-white/60">
            Support &amp; contact
          </p>
          <h1 className="mt-4 text-3xl lg:text-4xl font-bold text-black dark:text-white font-bengali">
            আমাদের সাথে যোগাযোগ করুন
          </h1>
          <p className="mt-2 text-sm lg:text-base text-black/60 dark:text-white/70 font-bengali max-w-2xl">
            অর্ডার, সাইজ বা ডেলিভারি নিয়ে যেকোনো প্রশ্ন থাকলে আমাদের লিখুন। আমরা যত
            দ্রুত সম্ভব উত্তর দেওয়ার চেষ্টা করি।
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-8 lg:gap-10 items-start">
          {/* Contact form */}
          <ContactFormSection />

          {/* Contact info / quick links - dynamic from admin */}
          <ContactInfoSection />
        </div>
      </div>
    </main>
  );
}

