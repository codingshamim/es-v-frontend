"use server";

import { connectDB } from "@/lib/db/connectDB";
import User from "@/lib/models/User";
import bcryptjs from "bcryptjs";

export interface RegisterResponse {
  success: boolean;
  message: string;
  userId?: string;
  errors?: {
    name?: string;
    email?: string;
    phone?: string;
    password?: string;
  };
}

export async function registerUser(formData: {
  name: string;
  email: string;
  phone: string;
  password: string;
}): Promise<RegisterResponse> {
  try {
    // ─── Validation ────────────────────────────────────────────────────────────

    const errors: RegisterResponse["errors"] = {};

    // Validate Name
    if (!formData.name || formData.name.trim().length === 0) {
      errors.name = "নাম প্রয়োজন";
    } else if (formData.name.trim().length < 2) {
      errors.name = "নাম কমপক্ষে ২ অক্ষর হতে হবে";
    } else if (formData.name.trim().length > 50) {
      errors.name = "নাম ৫০ অক্ষরের বেশি হতে পারবে না";
    }

    // Validate Email
    if (!formData.email || formData.email.trim().length === 0) {
      errors.email = "ইমেইল প্রয়োজন";
    } else {
      const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(formData.email.trim())) {
        errors.email = "অনুগ্রহ করে একটি বৈধ ইমেইল ঠিকানা প্রদান করুন";
      }
    }

    // Validate Phone
    if (!formData.phone || formData.phone.trim().length === 0) {
      errors.phone = "ফোন নম্বর প্রয়োজন";
    } else {
      const phoneRegex = /^(\+88)?01[0-9]{9}$/;
      if (!phoneRegex.test(formData.phone.trim())) {
        errors.phone =
          "অনুগ্রহ করে একটি বৈধ বাংলাদেশের ফোন নম্বর প্রদান করুন (যেমন: +8801XXXXXXXXX বা 01XXXXXXXXX)";
      }
    }

    // Validate Password
    if (!formData.password || formData.password.length === 0) {
      errors.password = "পাসওয়ার্ড প্রয়োজন";
    } else if (formData.password.length < 8) {
      errors.password = "পাসওয়ার্ড কমপক্ষে ৮ অক্ষর হতে হবে";
    }

    // Return errors if any
    if (Object.keys(errors).length > 0) {
      return {
        success: false,
        message: "ফর্ম যাচাইকরণ ব্যর্থ",
        errors,
      };
    }

    // ─── Database Operations ────────────────────────────────────────────────────

    await connectDB();

    // Check if email already exists
    const existingEmailUser = await User.findOne({
      email: formData.email.trim().toLowerCase(),
    });

    if (existingEmailUser) {
      return {
        success: false,
        message: "এই ইমেইলটি ইতিমধ্যে ব্যবহৃত হয়েছে",
        errors: {
          email: "এই ইমেইলটি ইতিমধ্যে ব্যবহৃত হয়েছে",
        },
      };
    }

    // Check if phone already exists
    const existingPhoneUser = await User.findOne({
      phone: formData.phone.trim(),
    });

    if (existingPhoneUser) {
      return {
        success: false,
        message: "এই ফোন নম্বরটি ইতিমধ্যে ব্যবহৃত হয়েছে",
        errors: {
          phone: "এই ফোন নম্বরটি ইতিমধ্যে ব্যবহৃত হয়েছে",
        },
      };
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(formData.password, 12);

    // Create new user
    const newUser = new User({
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone.trim(),
      password: hashedPassword,
      role: "user", // Default role
      isEmailVerified: false,
      isPhoneVerified: false,
      isActive: true,
    });

    // Save to database
    await newUser.save();

    return {
      success: true,
      message: "রেজিস্ট্রেশন সফল! আপনি এখন লগিন করতে পারেন।",
      userId: newUser._id.toString(),
    };
  } catch (error) {
    console.error("Registration error:", error);

    // Handle MongoDB duplicate key error
    if (error instanceof Error && error.message.includes("duplicate key")) {
      return {
        success: false,
        message: "এই ইমেইল বা ফোন নম্বর ইতিমধ্যে ব্যবহৃত হয়েছে",
      };
    }

    return {
      success: false,
      message: "রেজিস্ট্রেশনে ত্রুটি হয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।",
    };
  }
}
