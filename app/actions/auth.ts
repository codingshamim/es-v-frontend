"use server";

import { connectDB } from "@/lib/db/connectDB";
import User, { UserRole, type IUser } from "@/lib/models/User";

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
    await connectDB();

    const socialId = profile.id;
    const email = sanitizeEmail(profile.email);
    const name = sanitizeName(profile.name);
    const image = profile.image?.trim() || undefined;
    const socialField = provider === "google" ? "googleId" : "facebookId";

    if (!socialId || !email) {
      console.warn("[auth] Social login missing id or email", {
        provider,
        hasId: !!socialId,
        hasEmail: !!email,
      });
      return {
        success: false,
        message: "ইমেইল সরবরাহ করা হয়নি। দয়া করে ইমেইল শেয়ার করার অনুমতি দিন।",
      };
    }

    // Single upsert that:
    // - Finds by social id or email
    // - Links social id if email exists
    // - Creates new user if none
    const update: Partial<IUser> = {
      name,
      email,
      // IUser.profileImage is typed as string | undefined, so avoid null here
      profileImage: image ?? undefined,
      isEmailVerified: true,
      isActive: true,
      lastLogin: new Date(),
      ...(provider === "google"
        ? { googleId: socialId }
        : { facebookId: socialId }),
    };

    const user = await User.findOneAndUpdate(
      {
        $or: [{ [socialField]: socialId }, { email }],
      },
      {
        $set: update,
        $setOnInsert: {
          role: UserRole.USER,
          isPhoneVerified: false,
        },
      },
      {
        new: true,
        upsert: true,
      },
    );

    if (!user) {
      return {
        success: false,
        message: "সামাজিক লগইনে ত্রুটি হয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।",
      };
    }

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
