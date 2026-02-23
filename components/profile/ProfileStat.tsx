interface ProfileStatProps {
  value: string | number;
  label: string;
  accent?: "teal" | "green" | "blue";
}

const accentClasses = {
  teal: "text-accent-teal",
  green: "text-accent-green",
  blue: "text-accent-blue",
};

export function ProfileStat({
  value,
  label,
  accent = "teal",
}: ProfileStatProps) {
  return (
    <div className="text-center">
      <p className={`text-2xl font-bold ${accentClasses[accent]}`}>{value}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 font-bengali">
        {label}
      </p>
    </div>
  );
}
