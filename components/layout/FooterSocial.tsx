interface SocialLink {
  name: string;
  href: string;
  ariaLabel: string;
}

const socialLinks: SocialLink[] = [
  { name: 'Facebook', href: '#', ariaLabel: 'Facebook' },
  { name: 'Instagram', href: '#', ariaLabel: 'Instagram' },
  { name: 'LinkedIn', href: '#', ariaLabel: 'LinkedIn' },
];

export function FooterSocial() {
  return (
    <div>
      <h3 className="text-black dark:text-white font-semibold mb-4">Follow Us</h3>
      <nav className="flex items-center gap-4" aria-label="Social media links">
        {socialLinks.map((link) => (
          <a
            key={link.name}
            href={link.href}
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
