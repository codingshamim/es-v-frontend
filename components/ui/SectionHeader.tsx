import { ReactNode } from 'react';

interface SectionHeaderProps {
  badge?: string;
  title?: string;
  description?: string;
  titleId?: string;
  children?: ReactNode;
  className?: string;
}

export function SectionHeader({
  badge,
  title,
  description,
  titleId,
  children,
  className = '',
}: SectionHeaderProps) {
  return (
    <header className={`text-center mb-12 ${className}`}>
      {badge && (
        <span className="inline-block px-6 py-2 border border-gray-300 dark:border-gray-700 rounded-full text-sm text-gray-700 dark:text-gray-300 mb-4 font-bengali">
          {badge}
        </span>
      )}
      {title && (
        <h2 id={titleId} className="text-2xl lg:text-3xl font-bold text-black dark:text-white mb-4">
          {title}
        </h2>
      )}
      {description && (
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto font-bengali">
          {description}
        </p>
      )}
      {children}
    </header>
  );
}
