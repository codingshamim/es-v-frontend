"use server";

import { connectDB } from "@/lib/db/connectDB";
import User, { UserRole } from "@/lib/models/User";

export interface SocialLoginResult {
  success: boolean;
  message?: string;
  user?: { id: string; email?: string; name?: string; role: string; phone?: string };
}

function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function sanitizeName(name: string): string {
  return name.trim().slice(0, 50) || "User";
}

/**
 * Find or create/link user for Google or Facebook OAuth. Production-safe:
 * - Validates profile (id, email required)
 * - Finds by social id first, then by email (account linking)
 * - Creates new user only when no existing account
 */
export async function socialLoginOrRegister(
  provider: "google" | "facebook",
  profile: { id: string; name: string; email: string; image?: string | null },
): Promise<SocialLoginResult> {
  try {
    if (!profile?.id || !profile?.email?.trim()) {
      console.warn("[auth] Social login missing id or email", {
        provider,
        hasId: !!profile?.id,
        hasEmail: !!profile?.email,
      });
      return {
        success: false,
        message: "ইমেইল সরবরাহ করা হয়নি। দয়া করে ইমেইল শেয়ার করার অনুমতি দিন।",
      };
    }

    await connectDB();

    const socialId = profile.id;
    const email = sanitizeEmail(profile.email);
    const name = sanitizeName(profile.name);
    const image = profile.image?.trim() || undefined;
    const queryBySocialId =
      provider === "google"
        ? { googleId: socialId }
        : { facebookId: socialId };

    // 1. Find by social id (existing social-linked user)
    let user = await User.findOne(queryBySocialId);

    if (user) {
      user.lastLogin = new Date();
      await user.save();
      return {
        success: true,
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          phone: user.phone ?? undefined,
        },
      };
    }

    // 2. Find by email (link social id to existing account)
    user = await User.findOne({ email });

    if (user) {
      if (provider === "google") user.googleId = socialId;
      else user.facebookId = socialId;
      if (image) user.profileImage = image;
      user.lastLogin = new Date();
      await user.save();
      return {
        success: true,
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          phone: user.phone ?? undefined,
        },
      };
    }

    // 3. Create new user
    const newUser = new User({
      name,
      email,
      ...(provider === "google"
        ? { googleId: socialId }
        : { facebookId: socialId }),
      profileImage: image ?? null,
      role: UserRole.USER,
      isEmailVerified: true,
      isPhoneVerified: false,
      isActive: true,
      lastLogin: new Date(),
    });

    await newUser.save();

    return {
      success: true,
      user: {
        id: newUser._id.toString(),
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        phone: newUser.phone ?? undefined,
      },
    };
  } catch (error) {
    console.error("[auth] socialLoginOrRegister error:", error);

    if (error instanceof Error) {
      if (error.message.includes("duplicate key") || error.message.includes("E11000")) {
        return {
          success: false,
          message: "এই অ্যাকাউন্টটি ইতিমধ্যে অন্য পদ্ধতিতে সংযুক্ত।",
        };
      }
    }

    return {
      success: false,
      message: "সামাজিক লগইনে ত্রুটি হয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।",
    };
  }
}
