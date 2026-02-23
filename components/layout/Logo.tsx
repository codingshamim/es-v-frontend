import Link from "next/link";

export function Logo() {
    return (
        <Link href="/" className="flex items-center gap-2" aria-label="ES FITT Home">
            <div className="w-10 h-10 bg-gray-100 dark:bg-[#1a1a1a] rounded-sm flex items-center justify-center">
                <span className="text-black dark:text-white font-bold text-lg">ES</span>
            </div>
            <div>
                <h1 className="text-black dark:text-white font-bold text-lg mb-[-10px]">ES FITT</h1>
                <span className="text-accent-teal text-[10px] uppercase ">Next Level Tees</span>
            </div>
        </Link>
    );
}