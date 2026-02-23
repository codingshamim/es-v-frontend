"use client";

import { useState, useEffect, useCallback } from "react";
import { AddressCard } from "./AddressCard";
import { AddressFormModal } from "./AddressFormModal";
import { DeleteAddressModal } from "./DeleteAddressModal";
import { Spinner } from "@/components/ui/Spinner";
import {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  type AddressRecord,
  type AddressPayload,
} from "@/app/actions/addresses";

export function AddressesTab() {
  const [addresses, setAddresses] = useState<AddressRecord[]>([]);
  const [loadStatus, setLoadStatus] = useState<"idle" | "loading" | "success" | "error">("loading");
  const [loadError, setLoadError] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<AddressRecord | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteLabel, setDeleteLabel] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);

  const fetchAddresses = useCallback(async () => {
    const res = await getAddresses();
    if (res.success && res.data) {
      setAddresses(res.data);
      setLoadStatus("success");
    } else {
      setLoadError(res.message ?? "ঠিকানা লোড করতে ব্যর্থ");
      setLoadStatus("error");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    getAddresses().then((res) => {
      if (cancelled) return;
      if (res.success && res.data) {
        setAddresses(res.data);
        setLoadStatus("success");
      } else {
        setLoadError(res.message ?? "ঠিকানা লোড করতে ব্যর্থ");
        setLoadStatus("error");
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAdd = () => {
    setEditingAddress(null);
    setFormOpen(true);
  };

  const handleEdit = (addr: AddressRecord) => {
    setEditingAddress(addr);
    setFormOpen(true);
  };

  const handleFormSubmit = async (payload: AddressPayload) => {
    if (editingAddress) {
      const res = await updateAddress(editingAddress.id, payload);
      if (res.success && res.data) {
        setAddresses(res.data);
        setFormOpen(false);
        setEditingAddress(null);
        showToast("success", res.message ?? "আপডেট হয়েছে।");
      } else {
        return { success: false, message: res.message, errors: res.errors };
      }
    } else {
      const res = await addAddress(payload);
      if (res.success && res.data) {
        setAddresses(res.data);
        setFormOpen(false);
        showToast("success", res.message ?? "যোগ করা হয়েছে।");
      } else {
        return { success: false, message: res.message, errors: res.errors };
      }
    }
    return { success: true };
  };

  const openDelete = (addr: AddressRecord) => {
    setDeletingId(addr.id);
    setDeleteLabel(addr.label);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    const res = await deleteAddress(deletingId);
    setIsDeleting(false);
    setDeleteOpen(false);
    setDeletingId(null);
    if (res.success && res.data) {
      setAddresses(res.data);
      showToast("success", res.message ?? "মুছে ফেলা হয়েছে।");
    } else {
      showToast("error", res.message ?? "মুছতে ব্যর্থ।");
    }
  };

  const handleSetDefault = async (id: string) => {
    setSettingDefaultId(id);
    const res = await setDefaultAddress(id);
    setSettingDefaultId(null);
    if (res.success && res.data) {
      setAddresses(res.data);
      showToast("success", res.message ?? "ডিফল্ট সেট করা হয়েছে।");
    } else {
      showToast("error", res.message ?? "সেট করতে ব্যর্থ।");
    }
  };

  const isLoading = loadStatus === "loading";
  const isError = loadStatus === "error";

  return (
    <div className="space-y-4">
      {toast && (
        <div
          className={`rounded-xl px-4 py-2 text-sm font-bengali ${
            toast.type === "success"
              ? "bg-accent-green/20 text-accent-green border border-accent-green/40"
              : "bg-red-500/20 text-red-400 border border-red-500/40"
          }`}
          role="status"
        >
          {toast.message}
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner size="lg" className="text-accent-teal" />
        </div>
      )}

      {isError && (
        <div
          className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 font-bengali space-y-2"
          role="alert"
        >
          <p>{loadError}</p>
          <button
            type="button"
            onClick={() => {
              setLoadStatus("loading");
              fetchAddresses();
            }}
            className="text-sm text-accent-teal hover:underline font-bengali"
          >
            আবার চেষ্টা করুন
          </button>
        </div>
      )}

      {loadStatus === "success" && addresses.length === 0 && (
        <div className="p-8 rounded-2xl border-2 border-dashed border-gray-300 dark:border-[#333333] text-center text-gray-500 dark:text-gray-400 font-bengali">
          <p className="mb-4">আপনার কোনো সংরক্ষিত ঠিকানা নেই।</p>
          <button
            type="button"
            onClick={handleAdd}
            className="text-accent-teal hover:underline font-medium"
          >
            প্রথম ঠিকানা যোগ করুন
          </button>
        </div>
      )}

      {loadStatus === "success" && addresses.length > 0 && (
        <>
          {addresses.map((addr) => (
            <AddressCard
              key={addr.id}
              label={addr.label}
              isDefault={addr.isDefault}
              name={addr.name}
              phone={addr.phone}
              address={addr.address}
              district={addr.district}
              city={addr.city}
              onEdit={() => handleEdit(addr)}
              onDelete={() => openDelete(addr)}
              onSetDefault={
                !addr.isDefault
                  ? () => handleSetDefault(addr.id)
                  : undefined
              }
              settingDefault={settingDefaultId === addr.id}
            />
          ))}

          <button
            type="button"
            onClick={handleAdd}
            className="w-full py-4 border-2 border-dashed border-gray-300 dark:border-[#333333] rounded-2xl text-gray-500 dark:text-gray-400 hover:border-accent-teal hover:text-accent-teal transition-colors font-bengali flex items-center justify-center gap-2"
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            নতুন ঠিকানা যোগ করুন
          </button>
        </>
      )}

      <AddressFormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingAddress(null);
        }}
        onSubmit={handleFormSubmit}
        title={editingAddress ? "ঠিকানা সম্পাদনা" : "নতুন ঠিকানা যোগ করুন"}
        submitLabel={editingAddress ? "আপডেট করুন" : "যোগ করুন"}
        initial={editingAddress}
      />

      <DeleteAddressModal
        open={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setDeletingId(null);
        }}
        onConfirm={handleDeleteConfirm}
        addressLabel={deleteLabel ? `"${deleteLabel}"` : "এই ঠিকানা"}
        loading={isDeleting}
      />
    </div>
  );
}
