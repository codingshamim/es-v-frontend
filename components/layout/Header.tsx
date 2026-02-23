import { Logo } from "./Logo";
import { AuthNav } from "./AuthNav";

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-black/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Logo />
          <AuthNav />
        </div>
      </div>
    </header>
  );
}
