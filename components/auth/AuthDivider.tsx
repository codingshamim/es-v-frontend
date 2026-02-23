export function AuthDivider() {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-gray-800 dark:border-gray-800" />
      </div>
      <div className="relative flex justify-center text-sm">
        <span className="px-4 bg-black dark:bg-black text-gray-400 dark:text-gray-400 font-bengali">
          অথবা
        </span>
      </div>
    </div>
  );
}
