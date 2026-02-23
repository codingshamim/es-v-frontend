import Link from "next/link";

interface AuthFooterLinkProps {
  text: string;
  linkText: string;
  href: string;
}

export function AuthFooterLink({ text, linkText, href }: AuthFooterLinkProps) {
  return (
    <p className="text-sm text-gray-400 dark:text-gray-400 font-bengali text-center">
      {text}{" "}
      <Link
        href={href}
        className="text-black dark:text-white hover:underline font-semibold font-bengali"
      >
        {linkText}
      </Link>
    </p>
  );
}
