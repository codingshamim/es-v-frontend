type Social = {
  facebook?: string;
  instagram?: string;
  linkedin?: string;
};

function normalizeUrl(raw: string) {
  const v = raw.trim();
  if (!v) return "";
  if (v.startsWith("http://") || v.startsWith("https://")) return v;
  return `https://${v}`;
}

export function FooterSocial({ social }: { social?: Social }) {
  const links = [
    { name: "Facebook", href: normalizeUrl(social?.facebook ?? ""), ariaLabel: "Facebook" },
    { name: "Instagram", href: normalizeUrl(social?.instagram ?? ""), ariaLabel: "Instagram" },
    { name: "LinkedIn", href: normalizeUrl(social?.linkedin ?? ""), ariaLabel: "LinkedIn" },
  ].filter((l) => l.href);

  return (
    <div>
      <h3 className="text-black dark:text-white font-semibold mb-4">Follow Us</h3>
      <nav className="flex items-center gap-4" aria-label="Social media links">
        {links.map((link) => (
          <a
            key={link.name}
            href={link.href}
            target="_blank"
            rel="noreferrer"
            className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors text-sm"
            aria-label={link.ariaLabel}
          >
            {link.name}
          </a>
        ))}
      </nav>
    </div>
  );
}
