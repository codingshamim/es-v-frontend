"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { CloseIcon } from "@/components/icons";
import type { AddressRecord, AddressPayload } from "@/app/actions/addresses";
import { getDistricts, getCitiesForDistrict } from "@/lib/data/bangladesh-locations";

const inputClass =
  "w-full px-4 py-3 bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#222222] rounded-xl text-sm text-black dark:text-white focus:outline-none focus:border-accent-teal transition-colors";
const selectClass =
  "w-full px-4 py-3 bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#222222] rounded-xl text-sm text-black dark:text-white focus:outline-none focus:border-accent-teal transition-colors font-bengali";

type AddressFormModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: AddressPayload) => Promise<{ success: boolean; message?: string; errors?: Record<string, string> }>;
  title: string;
  submitLabel: string;
  initial?: AddressRecord | null;
};

export function AddressFormModal({
  open,
  onClose,
  onSubmit,
  title,
  submitLabel,
  initial = null,
}: AddressFormModalProps) {
  const [label, setLabel] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [district, setDistrict] = useState("");
  const [city, setCity] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const districts = useMemo(() => getDistricts(), []);
  const cities = useMemo(() => getCitiesForDistrict(district), [district]);

  useEffect(() => {
    if (open) {
      setError("");
      setFieldErrors({});
      if (initial) {
        setLabel(initial.label);
        setName(initial.name);
        setPhone(initial.phone);
        setAddress(initial.address);
        setDistrict(initial.district ?? "");
        setCity(initial.city ?? "");
        setIsDefault(initial.isDefault);
      } else {
        setLabel("");
        setName("");
        setPhone("");
        setAddress("");
        setDistrict("");
        setCity("");
        setIsDefault(false);
      }
    }
  }, [open, initial]);

  useEffect(() => {
    if (district && city && !getCitiesForDistrict(district).includes(city)) {
      setCity("");
    }
  }, [district, city]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setSubmitting(true);
    try {
      const result = await onSubmit({
        label: label.trim(),
        name: name.trim(),
        phone: phone.trim().replace(/\s/g, ""),
        address: address.trim(),
        district: district.trim(),
        city: city.trim(),
        isDefault,
      });
      if (result.success) {
        onClose();
        return;
      }
      setError(result.message ?? "ত্রুটি হয়েছে");
      if (result.errors) setFieldErrors(result.errors);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="address-form-title"
    >
      <div className="bg-white dark:bg-[#111111] rounded-2xl border border-gray-200 dark:border-[#222222] w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-[#222222]">
          <h2 id="address-form-title" className="text-lg font-bold text-black dark:text-white font-bengali">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors"
            aria-label="Close"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <p className="text-sm text-red-400 font-bengali" role="alert">
              {error}
            </p>
          )}
          <div>
            <label className="block text-sm font-medium text-black dark:text-white mb-1 font-bengali">
              লেবেল (যেমন: বাড়ি, অফিস)
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className={inputClass}
              placeholder="বাড়ি"
              disabled={submitting}
              aria-invalid={!!fieldErrors.label}
            />
            {fieldErrors.label && (
              <p className="mt-1 text-sm text-red-400 font-bengali">{fieldErrors.label}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-black dark:text-white mb-1 font-bengali">
              নাম
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
              disabled={submitting}
              aria-invalid={!!fieldErrors.name}
            />
            {fieldErrors.name && (
              <p className="mt-1 text-sm text-red-400 font-bengali">{fieldErrors.name}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-black dark:text-white mb-1 font-bengali">
              ফোন নম্বর
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={inputClass}
              placeholder="01XXXXXXXXX বা +8801XXXXXXXXX"
              disabled={submitting}
              aria-invalid={!!fieldErrors.phone}
            />
            {fieldErrors.phone && (
              <p className="mt-1 text-sm text-red-400 font-bengali">{fieldErrors.phone}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-black dark:text-white mb-1 font-bengali">
              জেলা
            </label>
            <select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className={selectClass}
              disabled={submitting}
              aria-invalid={!!fieldErrors.district}
            >
              <option value="">জেলা নির্বাচন করুন</option>
              {districts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            {fieldErrors.district && (
              <p className="mt-1 text-sm text-red-400 font-bengali">{fieldErrors.district}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-black dark:text-white mb-1 font-bengali">
              শহর / উপজেলা
            </label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className={selectClass}
              disabled={submitting || !district}
              aria-invalid={!!fieldErrors.city}
            >
              <option value="">শহর/উপজেলা নির্বাচন করুন</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {fieldErrors.city && (
              <p className="mt-1 text-sm text-red-400 font-bengali">{fieldErrors.city}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-black dark:text-white mb-1 font-bengali">
              ঠিকানা
            </label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className={`${inputClass} min-h-[80px] resize-y`}
              rows={3}
              disabled={submitting}
              aria-invalid={!!fieldErrors.address}
            />
            {fieldErrors.address && (
              <p className="mt-1 text-sm text-red-400 font-bengali">{fieldErrors.address}</p>
            )}
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              disabled={submitting}
              className="rounded border-gray-300 dark:border-[#333333] text-accent-teal focus:ring-accent-teal"
            />
            <span className="text-sm text-black dark:text-white font-bengali">
              ডিফল্ট ঠিকানা হিসাবে সেট করুন
            </span>
          </label>
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={onClose}
              className="flex-1 font-bengali"
            >
              বাতিল
            </Button>
            <Button
              type="submit"
              variant="secondary"
              size="md"
              disabled={submitting}
              icon={submitting ? <Spinner size="md" className="text-white dark:text-black" /> : undefined}
              className="flex-1 font-bengali"
            >
              {submitting ? "সংরক্ষণ হচ্ছে..." : submitLabel}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
