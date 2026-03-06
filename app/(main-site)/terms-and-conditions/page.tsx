import Link from "next/link";

export const metadata = {
  title: "Terms and Conditions",
  description:
    "ES FITT Terms and Conditions - Rules and guidelines for using our website and purchasing products.",
};

export default function TermsAndConditionsPage() {
  return (
    <main className="min-h-[60vh] pb-24 lg:pb-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <header className="mb-8 lg:mb-10">
          <p className="inline-flex items-center gap-2 rounded-full border border-black/10 dark:border-white/15 px-4 py-1 text-xs font-medium uppercase tracking-widest text-black/60 dark:text-white/60">
            Legal
          </p>
          <h1 className="mt-4 text-3xl lg:text-4xl font-bold text-black dark:text-white font-bengali">
            সেবার শর্তাবলী
          </h1>
          <p className="mt-2 text-sm lg:text-base text-black/60 dark:text-white/70 font-bengali max-w-2xl">
            ES FITT ওয়েবসাইট এবং পণ্য ক্রয়ের নিয়ম ও শর্তাবলী।
          </p>
        </header>

        <article className="prose prose-black dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-lg font-semibold text-black dark:text-white mb-3 font-bengali">
              ১. সেবার গ্রহণ
            </h2>
            <p className="text-sm text-black/80 dark:text-white/80 leading-relaxed font-bengali">
              esfitt.com ওয়েবসাইট ব্যবহার এবং আমাদের থেকে পণ্য ক্রয়ের মাধ্যমে আপনি এই 
              শর্তাবলী মেনে চলতে সম্মত হন। আপনি যদি এই শর্তাবলীর সাথে একমত না হন, অনুগ্রহ করে 
              আমাদের সেবা ব্যবহার করবেন না।
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-black dark:text-white mb-3 font-bengali">
              ২. অর্ডার ও পেমেন্ট
            </h2>
            <p className="text-sm text-black/80 dark:text-white/80 leading-relaxed font-bengali">
              অর্ডার কনফার্ম করার পর পেমেন্ট সম্পন্ন করতে হবে। আমরা ক্যাশ অন ডেলিভারি (COD), 
              বিকাশ, নগদ, রকেট এবং কার্ড পেমেন্ট গ্রহণ করি। পেমেন্ট ভেরিফিকেশনের পর অর্ডার 
              প্রসেস করা হয়। মূল্য এবং ডেলিভারি চার্জ অর্ডার পেজে প্রদর্শিত হবে।
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-black dark:text-white mb-3 font-bengali">
              ৩. ডেলিভারি
            </h2>
            <p className="text-sm text-black/80 dark:text-white/80 leading-relaxed font-bengali">
              ঢাকার ভেতরে সাধারণত ২-৩ কার্যদিবস এবং ঢাকার বাইরে ৩-৫ কার্যদিবসের মধ্যে 
              ডেলিভারি দেওয়া হয়। ডেলিভারি সময় স্থান এবং পরিস্থিতির উপর নির্ভর করে পরিবর্তন 
              হতে পারে। অর্ডার স্ট্যাটাস জানতে <Link href="/track-order" className="text-black dark:text-white underline hover:no-underline font-medium">ট্র্যাক অর্ডার</Link> ব্যবহার করুন।
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-black dark:text-white mb-3 font-bengali">
              ৪. রিটার্ন ও এক্সচেঞ্জ
            </h2>
            <p className="text-sm text-black/80 dark:text-white/80 leading-relaxed font-bengali">
              ডেলিভারির ৭ দিনের মধ্যে সাইজ বা প্রোডাক্ট ডিফেক্ট সংক্রান্ত ইস্যু থাকলে 
              এক্সচেঞ্জ করা যায়। শর্ত প্রযোজ্য। রিটার্ন/এক্সচেঞ্জের জন্য প্রোডাক্ট অপ্রয়োজনীয় 
              ব্যবহার করা হয়নি এমন হতে হবে এবং ট্যাগ সহ থাকতে হবে।
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-black dark:text-white mb-3 font-bengali">
              ৫. পণ্যের বর্ণনা
            </h2>
            <p className="text-sm text-black/80 dark:text-white/80 leading-relaxed font-bengali">
              আমরা পণ্যের সঠিক বর্ণনা এবং ছবি প্রদান করার চেষ্টা করি। তবে স্ক্রিনের রঙ এবং 
              সাইজ সামান্য ভিন্ন হতে পারে। কোন প্রশ্ন থাকলে অর্ডার দেওয়ার আগে{" "}
              <Link href="/contact" className="text-black dark:text-white underline hover:no-underline font-medium">যোগাযোগ</Link> করুন।
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-black dark:text-white mb-3 font-bengali">
              ৬. অ্যাকাউন্ট দায়বদ্ধতা
            </h2>
            <p className="text-sm text-black/80 dark:text-white/80 leading-relaxed font-bengali">
              আপনার অ্যাকাউন্টের নিরাপত্তার দায়িত্ব আপনার। পাসওয়ার্ড গোপন রাখুন এবং 
              অননুমোদিত অ্যাক্সেসের ক্ষেত্রে আমাদের জানান।
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-black dark:text-white mb-3 font-bengali">
              ৭. যোগাযোগ
            </h2>
            <p className="text-sm text-black/80 dark:text-white/80 leading-relaxed font-bengali">
              যেকোনো প্রশ্ন বা অভিযোগের জন্য আমাদের{" "}
              <Link href="/contact" className="text-black dark:text-white underline hover:no-underline font-medium">কনট্যাক্ট পেজ</Link> থেকে 
              যোগাযোগ করতে পারেন। আমরা যত দ্রুত সম্ভব সাড়া দেওয়ার চেষ্টা করি।
            </p>
          </section>

          <p className="text-xs text-black/50 dark:text-white/50 pt-4 font-bengali">
            সর্বশেষ আপডেট: মার্চ ২০২৫
          </p>
        </article>

        <div className="mt-10 pt-6 border-t border-black/10 dark:border-white/10 flex gap-6">
          <Link
            href="/privacy-policy"
            className="text-sm font-medium text-black dark:text-white hover:underline"
          >
            গোপনীয়তা নীতি
          </Link>
          <Link
            href="/contact"
            className="text-sm font-medium text-black dark:text-white hover:underline"
          >
            যোগাযোগ করুন
          </Link>
        </div>
      </div>
    </main>
  );
}
