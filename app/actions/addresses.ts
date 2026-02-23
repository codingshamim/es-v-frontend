"use server";

import mongoose from "mongoose";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/connectDB";
import User from "@/lib/models/User";
import type { IAddress } from "@/lib/models/User";

const PHONE_REGEX = /^(\+88)?01[0-9]{9}$/;

export type AddressPayload = {
  label: string;
  name: string;
  phone: string;
  address: string;
  district: string;
  city: string;
  isDefault?: boolean;
};

export type AddressRecord = AddressPayload & {
  id: string;
  isDefault: boolean;
};

function toAddressRecord(a: IAddress & { _id?: mongoose.Types.ObjectId }): AddressRecord {
  return {
    id: (a._id ?? (a as any)._id)?.toString() ?? "",
    label: a.label,
    name: a.name,
    phone: a.phone,
    address: a.address,
    district: (a as any).district ?? "",
    city: (a as any).city ?? "",
    isDefault: a.isDefault ?? false,
  };
}

export interface AddressesResult {
  success: boolean;
  data?: AddressRecord[];
  message?: string;
  errors?: Record<string, string>;
}

export async function getAddresses(): Promise<AddressesResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: "লগইন প্রয়োজন" };
    }
    await connectDB();
    const user = await User.findById(session.user.id).select("addresses").lean();
    if (!user) return { success: false, message: "ব্যবহারকারী খুঁজে পাওয়া যায়নি" };
    const list = (user.addresses ?? []).map(toAddressRecord);
    return { success: true, data: list };
  } catch (e) {
    console.error("[addresses] getAddresses:", e);
    return { success: false, message: "ঠিকানা লোড করতে ব্যর্থ। আবার চেষ্টা করুন।" };
  }
}

function validateAddress(p: AddressPayload): Record<string, string> | null {
  const errors: Record<string, string> = {};
  const label = (p.label ?? "").trim();
  const name = (p.name ?? "").trim();
  const phone = (p.phone ?? "").trim().replace(/\s/g, "");
  const address = (p.address ?? "").trim();
  const district = (p.district ?? "").trim();
  const city = (p.city ?? "").trim();
  if (!label) errors.label = "লেবেল প্রয়োজন";
  else if (label.length > 50) errors.label = "লেবেল ৫০ অক্ষরের বেশি হতে পারবে না";
  if (!name) errors.name = "নাম প্রয়োজন";
  else if (name.length > 50) errors.name = "নাম ৫০ অক্ষরের বেশি হতে পারবে না";
  if (!phone) errors.phone = "ফোন নম্বর প্রয়োজন";
  else if (!PHONE_REGEX.test(phone)) errors.phone = "বৈধ ফোন নম্বর লিখুন (01XXXXXXXXX বা +8801XXXXXXXXX)";
  if (!address) errors.address = "ঠিকানা প্রয়োজন";
  else if (address.length > 500) errors.address = "ঠিকানা ৫০০ অক্ষরের বেশি হতে পারবে না";
  if (!district) errors.district = "জেলা নির্বাচন করুন";
  else if (district.length > 80) errors.district = "জেলা ৮০ অক্ষরের বেশি হতে পারবে না";
  if (!city) errors.city = "শহর/উপজেলা নির্বাচন করুন";
  else if (city.length > 80) errors.city = "শহর/উপজেলা ৮০ অক্ষরের বেশি হতে পারবে না";
  return Object.keys(errors).length ? errors : null;
}

export async function addAddress(payload: AddressPayload): Promise<AddressesResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: "লগইন প্রয়োজন" };
    }
    const err = validateAddress(payload);
    if (err) return { success: false, message: "ফর্ম যাচাইকরণ ব্যর্থ", errors: err };

    await connectDB();
    const isDefault = payload.isDefault ?? false;
    const newAddr = {
      _id: new mongoose.Types.ObjectId(),
      label: payload.label.trim(),
      name: payload.name.trim(),
      phone: payload.phone.trim().replace(/\s/g, ""),
      address: payload.address.trim(),
      district: payload.district.trim(),
      city: payload.city.trim(),
      isDefault,
    };

    const user = await User.findById(session.user.id);
    if (!user) return { success: false, message: "ব্যবহারকারী খুঁজে পাওয়া যায়নি" };
    user.addresses = user.addresses ?? [];
    if (isDefault) user.addresses.forEach((a: any) => { a.isDefault = false; });
    user.addresses.push(newAddr as any);
    await user.save();

    const list = (user.addresses ?? []).map(toAddressRecord);
    return { success: true, data: list, message: "ঠিকানা যোগ করা হয়েছে।" };
  } catch (e) {
    console.error("[addresses] addAddress:", e);
    return { success: false, message: "ঠিকানা যোগ করতে ব্যর্থ। আবার চেষ্টা করুন।" };
  }
}

export async function updateAddress(
  addressId: string,
  payload: AddressPayload,
): Promise<AddressesResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: "লগইন প্রয়োজন" };
    }
    const err = validateAddress(payload);
    if (err) return { success: false, message: "ফর্ম যাচাইকরণ ব্যর্থ", errors: err };
    if (!addressId || !mongoose.Types.ObjectId.isValid(addressId)) {
      return { success: false, message: "অবৈধ ঠিকানা" };
    }

    await connectDB();
    const user = await User.findById(session.user.id);
    if (!user) return { success: false, message: "ব্যবহারকারী খুঁজে পাওয়া যায়নি" };
    const idx = (user.addresses ?? []).findIndex(
      (a: any) => a._id?.toString() === addressId,
    );
    if (idx === -1) return { success: false, message: "ঠিকানা খুঁজে পাওয়া যায়নি" };

    const isDefault = payload.isDefault ?? false;
    if (isDefault) {
      (user.addresses ?? []).forEach((a: any) => { a.isDefault = false; });
    }
    (user.addresses as any)[idx].label = payload.label.trim();
    (user.addresses as any)[idx].name = payload.name.trim();
    (user.addresses as any)[idx].phone = payload.phone.trim().replace(/\s/g, "");
    (user.addresses as any)[idx].address = payload.address.trim();
    (user.addresses as any)[idx].district = payload.district.trim();
    (user.addresses as any)[idx].city = payload.city.trim();
    (user.addresses as any)[idx].isDefault = isDefault;
    await user.save();

    const list = (user.addresses ?? []).map(toAddressRecord);
    return { success: true, data: list, message: "ঠিকানা আপডেট হয়েছে।" };
  } catch (e) {
    console.error("[addresses] updateAddress:", e);
    return { success: false, message: "ঠিকানা আপডেট করতে ব্যর্থ। আবার চেষ্টা করুন।" };
  }
}

export async function deleteAddress(addressId: string): Promise<AddressesResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: "লগইন প্রয়োজন" };
    }
    if (!addressId || !mongoose.Types.ObjectId.isValid(addressId)) {
      return { success: false, message: "অবৈধ ঠিকানা" };
    }

    await connectDB();
    const user = await User.findById(session.user.id);
    if (!user) return { success: false, message: "ব্যবহারকারী খুঁজে পাওয়া যায়নি" };
    user.addresses = (user.addresses ?? []).filter(
      (a: any) => a._id?.toString() !== addressId,
    );
    await user.save();
    const list = (user.addresses ?? []).map(toAddressRecord);
    return { success: true, data: list, message: "ঠিকানা মুছে ফেলা হয়েছে।" };
  } catch (e) {
    console.error("[addresses] deleteAddress:", e);
    return { success: false, message: "ঠিকানা মুছতে ব্যর্থ। আবার চেষ্টা করুন।" };
  }
}

export async function setDefaultAddress(addressId: string): Promise<AddressesResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: "লগইন প্রয়োজন" };
    }
    if (!addressId || !mongoose.Types.ObjectId.isValid(addressId)) {
      return { success: false, message: "অবৈধ ঠিকানা" };
    }

    await connectDB();
    const user = await User.findById(session.user.id);
    if (!user) return { success: false, message: "ব্যবহারকারী খুঁজে পাওয়া যায়নি" };
    const addrs = user.addresses ?? [];
    addrs.forEach((a: any) => { a.isDefault = a._id?.toString() === addressId; });
    await user.save();
    const list = addrs.map(toAddressRecord);
    return { success: true, data: list, message: "ডিফল্ট ঠিকানা সেট করা হয়েছে।" };
  } catch (e) {
    console.error("[addresses] setDefaultAddress:", e);
    return { success: false, message: "ডিফল্ট সেট করতে ব্যর্থ। আবার চেষ্টা করুন।" };
  }
}
