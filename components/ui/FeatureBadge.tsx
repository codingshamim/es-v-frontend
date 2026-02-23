interface FeatureBadgeProps {
  text: string;
  color?: 'green' | 'blue' | 'teal';
  className?: string;
}

export function FeatureBadge({ text, color = 'green', className = '' }: FeatureBadgeProps) {
  const colorStyles = {
    green: 'bg-accent-green',
    blue: 'bg-accent-blue',
    teal: 'bg-accent-teal',
  };

  return (
    <div className={`flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 ${className}`}>
      <span className={`w-2.5 h-2.5 rounded-full ${colorStyles[color]}`} aria-hidden="true" />
      <span className="font-bengali">{text}</span>
    </div>
  );
}
