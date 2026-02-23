import Image from "next/image";
import { ProfileStat } from "./ProfileStat";

interface ProfileHeaderProps {
  name: string;
  email: string;
  image?: string | null;
  totalOrders?: number;
  completedOrders?: number;
  pendingOrders?: number;
}

export function ProfileHeader({
  name,
  email,
  image,
  totalOrders = 0,
  completedOrders = 0,
  pendingOrders = 0,
}: ProfileHeaderProps) {
  return (
    <div className=" rounded-2xl p-6 sm:p-8 mb-6 border border-gray-200 dark:border-[#1a1a1a]">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <div className="relative">
          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-[#1a1a1a] flex items-center justify-center text-white text-3xl sm:text-4xl font-bold border-4 border-white dark:border-black shadow-lg overflow-hidden">
            {image ? (
              <Image
                src={image}
                alt=""
                width={128}
                height={128}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="font-bengali">
                {name.charAt(0) || "র"}
              </span>
            )}
          </div>

        </div>

        <div className="flex-1 text-center sm:text-left">
          <h2 className="text-2xl sm:text-3xl font-bold text-black dark:text-white mb-2 font-bengali">
            {name || "User"}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4 font-bengali">
            {email}
          </p>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 sm:gap-6">
            <ProfileStat value={totalOrders} label="মোট অর্ডার" accent="teal" />
            <div className="w-px h-8 bg-gray-200 dark:bg-[#333333]" />
            <ProfileStat value={completedOrders} label="সম্পন্ন" accent="green" />
            <div className="w-px h-8 bg-gray-200 dark:bg-[#333333]" />
            <ProfileStat value={pendingOrders} label="প্রক্রিয়াধীন" accent="blue" />
          </div>
        </div>
      </div>
    </div>
  );
}
