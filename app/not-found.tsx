import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function AppNotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-black text-black dark:text-white px-4">
      <p className="text-xs uppercase tracking-widest text-accent-teal mb-2">
        404
      </p>
      <h1 className="text-2xl md:text-3xl font-bold mb-3 font-bengali">
        পেজটি খুঁজে পাওয়া যায়নি
      </h1>
      <p className="text-sm md:text-base text-black/60 dark:text-white/70 mb-6 text-center font-bengali max-w-md">
        আপনি যে লিংকটি খুলতে চেয়েছেন তা পাওয়া যাচ্ছে না। হয়তো লিংকটি পরিবর্তন
        হয়েছে অথবা পেজটি মুছে ফেলা হয়েছে।
      </p>
      <Link href="/" passHref>
        <Button variant="secondary">
          <span className="font-bengali">হোম পেজে ফিরে যান</span>
        </Button>
      </Link>
    </div>
  );
}

