"use server";

import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/connectDB";
import User from "@/lib/models/User";

export interface ProfileData {
  name: string;
  email: string;
  phone: string;
}

export interface GetProfileResult {
  success: boolean;
  data?: ProfileData;
  message?: string;
}

export interface UpdateProfileResult {
  success: boolean;
  data?: ProfileData;
  message?: string;
  errors?: { name?: string; email?: string; phone?: string };
}

const PHONE_REGEX = /^(\+88)?01[0-9]{9}$/;
const EMAIL_REGEX = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;

export async function getProfile(): Promise<GetProfileResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: "লগইন প্রয়োজন" };
    }

    await connectDB();
    const user = await User.findById(session.user.id)
      .select("name email phone")
      .lean();

    if (!user) {
      return { success: false, message: "ব্যবহারকারী খুঁজে পাওয়া যায়নি" };
    }

    return {
      success: true,
      data: {
        name: user.name ?? "",
        email: user.email ?? "",
        phone: user.phone ?? "",
      },
    };
  } catch (error) {
    console.error("[profile] getProfile error:", error);
    return {
      success: false,
      message: "প্রোফাইল লোড করতে ব্যর্থ। আবার চেষ্টা করুন।",
    };
  }
}

export async function updateProfile(
  formData: ProfileData,
): Promise<UpdateProfileResult> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, message: "লগইন প্রয়োজন" };
    }

    const errors: UpdateProfileResult["errors"] = {};

    const name = formData.name?.trim() ?? "";
    if (!name) {
      errors.name = "নাম প্রয়োজন";
    } else if (name.length < 2) {
      errors.name = "নাম কমপক্ষে ২ অক্ষর হতে হবে";
    } else if (name.length > 50) {
      errors.name = "নাম ৫০ অক্ষরের বেশি হতে পারবে না";
    }

    const email = formData.email?.trim().toLowerCase() ?? "";
    if (!email) {
      errors.email = "ইমেইল প্রয়োজন";
    } else if (!EMAIL_REGEX.test(email)) {
      errors.email = "বৈধ ইমেইল ঠিকানা লিখুন";
    }

    const phone = formData.phone?.trim().replace(/\s/g, "") ?? "";
    if (phone && !PHONE_REGEX.test(phone)) {
      errors.phone =
        "বৈধ ফোন নম্বর লিখুন (যেমন: 01XXXXXXXXX বা +8801XXXXXXXXX)";
    }

    if (Object.keys(errors).length > 0) {
      return {
        success: false,
        message: "ফর্ম যাচাইকরণ ব্যর্থ",
        errors,
      };
    }

    await connectDB();

    const updatePayload: Record<string, unknown> = { name, email };
    if (phone !== "") {
      updatePayload.phone = phone;
    } else {
      updatePayload.phone = null;
    }

    const user = await User.findByIdAndUpdate(
      session.user.id,
      { $set: updatePayload },
      { returnDocument: "after", runValidators: true },
    )
      .select("name email phone")
      .lean();

    if (!user) {
      return { success: false, message: "আপডেট ব্যর্থ। আবার চেষ্টা করুন।" };
    }

    return {
      success: true,
      data: {
        name: user.name ?? "",
        email: user.email ?? "",
        phone: user.phone ?? "",
      },
      message: "প্রোফাইল সংরক্ষণ হয়েছে।",
    };
  } catch (error) {
    console.error("[profile] updateProfile error:", error);
    if (error instanceof Error && error.message.includes("duplicate key")) {
      return {
        success: false,
        message: "এই ইমেইল বা ফোন ইতিমধ্যে অন্য অ্যাকাউন্টে ব্যবহার হচ্ছে।",
      };
    }
    return {
      success: false,
      message: "প্রোফাইল আপডেট করতে ব্যর্থ। আবার চেষ্টা করুন।",
    };
  }
}
