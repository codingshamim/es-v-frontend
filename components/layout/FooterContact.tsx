export interface StoreContact {
  storeEmail?: string;
  storePhone?: string;
  storeAddress?: string;
}

export function FooterContact({ store }: { store?: StoreContact | null }) {
  const email = store?.storeEmail?.trim() || "contact@esfitt.com";
  const phone = store?.storePhone?.trim() || "+880 1816628413";
  const telHref = phone.replace(/\D/g, "").replace(/^88/, "");
  return (
    <div>
      <h3 className="text-black dark:text-white font-semibold mb-4">Contact</h3>
      <ul className="space-y-3" role="list">
        <li className="flex items-center gap-3 text-gray-600 dark:text-gray-400 text-sm">
          <svg className="w-5 h-5 text-gray-400 dark:text-gray-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <a href={`mailto:${email}`} className="hover:text-black dark:hover:text-white transition-colors">
            {email}
          </a>
        </li>
        <li className="flex items-center gap-3 text-gray-600 dark:text-gray-400 text-sm">
          <svg className="w-5 h-5 text-gray-400 dark:text-gray-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          <a href={telHref ? `tel:${telHref}` : "#"} className="hover:text-black dark:hover:text-white transition-colors">
            {phone}
          </a>
        </li>
      </ul>
    </div>
  );
}
