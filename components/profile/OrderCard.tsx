import Image from "next/image";
import Link from "next/link";

interface OrderItem {
  title: string;
  variant: string;
  quantity: number;
  price: string;
  image: string;
}

interface OrderCardProps {
  orderId: string;
  date: string;
  status: "completed" | "pending";
  items: OrderItem[];
  total: string;
}

const statusConfig = {
  completed: {
    label: "সম্পন্ন",
    className: "bg-accent-green/10 text-accent-green",
  },
  pending: {
    label: "প্রক্রিয়াধীন",
    className: "bg-accent-blue/10 text-accent-blue",
  },
};

export function OrderCard({
  orderId,
  date,
  status,
  items,
  total,
}: OrderCardProps) {
  const config = statusConfig[status];

  return (
    <div className="bg-gray-50 dark:bg-[#0a0a0a] rounded-2xl p-5 sm:p-6 border border-gray-200 dark:border-[#1a1a1a] transition-all duration-300 hover:-translate-y-0.5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-black dark:text-white font-bengali">
              অর্ডার #{orderId}
            </h4>
            <span
              className={`px-2 py-0.5 text-xs rounded-full font-bengali ${config.className}`}
            >
              {config.label}
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-bengali">
            {date}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/tracking?order=${orderId}`}
            className="px-4 py-2 border border-gray-200 dark:border-[#222222] rounded-xl text-sm text-black dark:text-white hover:bg-gray-100 dark:hover:bg-[#111111] transition-colors font-bengali"
          >
            ট্র্যাক করুন
          </Link>
          <Link
            href={`/orders/${orderId}`}
            className="px-4 py-2 bg-white dark:bg-white border border-gray-200 dark:border-white text-black rounded-xl text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-100 transition-colors font-bengali"
          >
            বিস্তারিত
          </Link>
        </div>
      </div>

      {items.map((item, i) => (
        <div
          key={i}
          className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-[#1a1a1a] mb-4 last:mb-0 last:pb-0 last:border-b-0"
        >
          <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-200 dark:bg-[#111111] shrink-0 relative">
            <Image
              src={item.image}
              alt=""
              fill
              className="object-cover"
              sizes="64px"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-black dark:text-white">
              {item.title}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {item.variant} | × {item.quantity}
            </p>
          </div>
          <span className="text-sm font-semibold text-black dark:text-white shrink-0">
            {item.price}
          </span>
        </div>
      ))}

      <div className="flex items-center justify-between pt-4">
        <span className="text-sm text-gray-500 dark:text-gray-400 font-bengali">
          মোট:{" "}
          <span className="font-semibold text-black dark:text-white">{total}</span>
        </span>
        <button
          type="button"
          className="text-sm text-accent-teal hover:underline font-bengali"
        >
          পুনরায় অর্ডার করুন
        </button>
      </div>
    </div>
  );
}
