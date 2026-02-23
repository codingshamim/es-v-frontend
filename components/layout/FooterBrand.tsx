import { Logo } from "./Logo";

export function FooterBrand({ storeName }: { storeName?: string | null }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Logo />
      </div>
      <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
        {storeName?.trim() ? `${storeName} — ` : ""}
        Bringing you good vibes, quality content, and meaningful experiences
        that matter.
      </p>
    </div>
  );
}
