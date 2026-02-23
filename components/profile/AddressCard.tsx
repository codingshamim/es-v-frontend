interface AddressCardProps {
  label: string;
  isDefault?: boolean;
  name: string;
  phone: string;
  address: string;
  district?: string;
  city?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  onSetDefault?: () => void;
  settingDefault?: boolean;
}

export function AddressCard({
  label,
  isDefault = false,
  name,
  phone,
  address,
  district,
  city,
  onEdit,
  onDelete,
  onSetDefault,
  settingDefault = false,
}: AddressCardProps) {
  return (
    <div className="bg-gray-50 dark:bg-[#0a0a0a] rounded-2xl p-5 sm:p-6 border border-gray-200 dark:border-[#1a1a1a] transition-all duration-300 hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <h4 className="font-semibold text-black dark:text-white font-bengali">
              {label}
            </h4>
            {isDefault && (
              <span className="px-2 py-0.5 bg-accent-teal/10 text-accent-teal text-xs rounded-full font-bengali">
                ডিফল্ট
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 font-bengali">
            {name}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 font-bengali">
            {phone}
          </p>
          {(district || city) && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 font-bengali">
              {[district, city].filter(Boolean).join(", ")}
            </p>
          )}
          <p className="text-sm text-gray-600 dark:text-gray-400 font-bengali">
            {address}
          </p>
          {!isDefault && onSetDefault && (
            <button
              type="button"
              onClick={onSetDefault}
              disabled={settingDefault}
              className="mt-2 text-sm text-accent-teal hover:underline font-bengali disabled:opacity-60 disabled:pointer-events-none"
            >
              {settingDefault ? "সেট করা হচ্ছে..." : "ডিফল্ট হিসাবে সেট করুন"}
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="w-10 h-10 rounded-lg border border-gray-200 dark:border-[#222222] flex items-center justify-center text-gray-400 hover:text-accent-teal hover:border-accent-teal transition-colors"
            aria-label="Edit address"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="w-10 h-10 rounded-lg border border-gray-200 dark:border-[#222222] flex items-center justify-center text-red-400 hover:text-red-500 hover:border-red-500 transition-colors"
            aria-label="Delete address"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
