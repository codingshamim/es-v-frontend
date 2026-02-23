import Link from 'next/link';

interface FooterLink {
  text: string;
  href: string;
}

const footerLinks: FooterLink[] = [
  { text: 'Privacy Policy', href: '#' },
  { text: 'Terms of Service', href: '#' },
];

export function FooterBottom() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="flex flex-col md:flex-row items-center justify-between mt-12 pt-6 border-t border-gray-200 dark:border-gray-800">
      <div className="flex items-center gap-2 mb-4 md:mb-0">
        <span className="text-black dark:text-white font-bold">ES FITT</span>
        <span className="text-gray-500 text-sm">© {currentYear} All rights reserved.</span>
      </div>
      <nav className="flex items-center gap-6" aria-label="Footer links">
        {footerLinks.map((link) => (
          <Link
            key={link.text}
            href={link.href}
            className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white text-sm transition-colors"
          >
            {link.text}
          </Link>
        ))}
      </nav>
    </div>
  );
}
