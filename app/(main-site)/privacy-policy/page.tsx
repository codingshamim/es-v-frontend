import Link from "next/link";

export const metadata = {
  title: "Privacy Policy",
  description:
    "ES FITT Privacy Policy - How we collect, use, and protect your personal information when you shop with us.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-[60vh] pb-24 lg:pb-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <header className="mb-8 lg:mb-10">
          <p className="inline-flex items-center gap-2 rounded-full border border-black/10 dark:border-white/15 px-4 py-1 text-xs font-medium uppercase tracking-widest text-black/60 dark:text-white/60">
            Legal
          </p>
          <h1 className="mt-4 text-3xl lg:text-4xl font-bold text-black dark:text-white font-bengali">
            গোপনীয়তা নীতি
          </h1>
          <p className="mt-2 text-sm lg:text-base text-black/60 dark:text-white/70 font-bengali max-w-2xl">
            ES FITT আপনার তথ্য কিভাবে সংগ্রহ, ব্যবহার এবং সুরক্ষিত করে তা জানুন।
          </p>
        </header>

        <article className="prose prose-black dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-lg font-semibold text-black dark:text-white mb-3 font-bengali">
              ১. তথ্য সংগ্রহ
            </h2>
            <p className="text-sm text-black/80 dark:text-white/80 leading-relaxed font-bengali">
              আমরা আপনার নাম, ইমেইল, ফোন নম্বর, ঠিকানা এবং অর্ডার সংক্রান্ত তথ্য সংগ্রহ করি। 
              অ্যাকাউন্ট তৈরির সময়, অর্ডার দেওয়ার সময় অথবা কনট্যাক্ট ফর্ম পূরণের সময় এই তথ্য 
              প্রদান করা হয়। ওয়েবসাইট ব্যবহারের সময় আমরা কুকিজ এবং অনুরূপ প্রযুক্তির মাধ্যমে 
              কিছু প্রযুক্তিগত তথ্য সংগ্রহ করতে পারি।
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-black dark:text-white mb-3 font-bengali">
              ২. তথ্য ব্যবহার
            </h2>
            <p className="text-sm text-black/80 dark:text-white/80 leading-relaxed font-bengali">
              আপনার তথ্য আমরা অর্ডার প্রসেসিং, ডেলিভারি, কাস্টমার সাপোর্ট এবং প্রয়োজনীয় 
              যোগাযোগের জন্য ব্যবহার করি। আমরা আপনার অনুমতি ছাড়া আপনার তথ্য তৃতীয় পক্ষের 
              সাথে শেয়ার করি না, শুধুমাত্র ডেলিভারি পার্টনার এবং পেমেন্ট প্রসেসরের মতো 
              সেবা প্রদানকারীদের সাথে যা অর্ডার পূরণের জন্য অপরিহার্য।
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-black dark:text-white mb-3 font-bengali">
              ৩. তথ্য সুরক্ষা
            </h2>
            <p className="text-sm text-black/80 dark:text-white/80 leading-relaxed font-bengali">
              আমরা আপনার ব্যক্তিগত তথ্য সুরক্ষিত রাখতে উপযুক্ত প্রযুক্তিগত এবং সাংগঠনিক 
              ব্যবস্থা গ্রহণ করি। পাসওয়ার্ড এনক্রিপ্ট করা থাকে এবং সংবেদনশীল ডেটা 
              সুরক্ষিত চ্যানেলের মাধ্যমে প্রেরণ করা হয়।
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-black dark:text-white mb-3 font-bengali">
              ৪. কুকিজ
            </h2>
            <p className="text-sm text-black/80 dark:text-white/80 leading-relaxed font-bengali">
              ওয়েবসাইট সঠিকভাবে কাজ করার জন্য আমরা প্রয়োজনীয় কুকিজ ব্যবহার করি। 
              লগইন সেশন, কার্ট এবং পছন্দের সেটিংস সংরক্ষণের জন্য এই কুকিজ ব্যবহৃত হয়।
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-black dark:text-white mb-3 font-bengali">
              ৫. আপনার অধিকার
            </h2>
            <p className="text-sm text-black/80 dark:text-white/80 leading-relaxed font-bengali">
              আপনি আপনার ব্যক্তিগত তথ্য দেখতে, সংশোধন করতে বা মুছে ফেলার জন্য আমাদের 
              সাথে যোগাযোগ করতে পারেন। <Link href="/contact" className="text-black dark:text-white underline hover:no-underline font-medium">কনট্যাক্ট পেজ</Link> থেকে 
              আপনার অনুরোধ পাঠাতে পারেন।
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-black dark:text-white mb-3 font-bengali">
              ৬. নীতি পরিবর্তন
            </h2>
            <p className="text-sm text-black/80 dark:text-white/80 leading-relaxed font-bengali">
              আমরা সময়ে সময়ে এই গোপনীয়তা নীতি আপডেট করতে পারি। পরিবর্তনগুলো এই পেজে 
              প্রকাশ করা হবে এবং প্রযোজ্য তারিখ উল্লেখ করা হবে।
            </p>
          </section>

          <p className="text-xs text-black/50 dark:text-white/50 pt-4 font-bengali">
            সর্বশেষ আপডেট: মার্চ ২০২৫
          </p>
        </article>

        <div className="mt-10 pt-6 border-t border-black/10 dark:border-white/10">
          <Link
            href="/contact"
            className="text-sm font-medium text-black dark:text-white hover:underline"
          >
            ← যোগাযোগ করুন
          </Link>
        </div>
      </div>
    </main>
  );
}
