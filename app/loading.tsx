import { Spinner } from "@/components/ui/Spinner";
import { Logo } from "@/components/layout/Logo";

export default function AppLoading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-black text-black dark:text-white">
      <div className="mb-6">
        <Logo />
      </div>
      <div className="flex flex-col items-center gap-3">
        <Spinner size="lg" />
        <p className="text-sm text-black/60 dark:text-white/70 font-bengali">
          অ্যাপ লোড হচ্ছে...
        </p>
      </div>
    </div>
  );
}

