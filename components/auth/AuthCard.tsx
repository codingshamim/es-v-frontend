import { ReactNode } from "react";

interface AuthCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function AuthCard({ title, subtitle, children }: AuthCardProps) {
  return (
    <div className="bg-black dark:bg-black border border-gray-800 dark:border-gray-800 rounded-2xl p-8">
      <h2 className="text-2xl font-bold text-white dark:text-white mb-2 text-center font-bengali">
        {title}
      </h2>
      {subtitle && (
        <p className="text-sm text-gray-400 dark:text-gray-400 text-center mb-8 font-bengali">
          {subtitle}
        </p>
      )}
      {children}
    </div>
  );
}
