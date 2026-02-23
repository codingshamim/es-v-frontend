"use client";

import { Button } from "@/components/ui/Button";

type DeleteAddressModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  addressLabel?: string;
  loading?: boolean;
};

export function DeleteAddressModal({
  open,
  onClose,
  onConfirm,
  addressLabel = "এই ঠিকানা",
  loading = false,
}: DeleteAddressModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-address-title"
    >
      <div className="bg-white dark:bg-[#111111] rounded-2xl border border-gray-200 dark:border-[#222222] w-full max-w-sm p-6 shadow-xl">
        <h2 id="delete-address-title" className="text-lg font-bold text-black dark:text-white mb-2 font-bengali">
          ঠিকানা মুছুন
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm font-bengali mb-6">
          {addressLabel} মুছে ফেলতে চান? এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না।
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={onClose}
            disabled={loading}
            className="flex-1 font-bengali"
          >
            বাতিল
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 font-bengali bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 text-white"
          >
            {loading ? "মুছে ফেলছি..." : "মুছে ফেলুন"}
          </Button>
        </div>
      </div>
    </div>
  );
}
