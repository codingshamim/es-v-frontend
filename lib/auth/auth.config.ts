import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";
import { connectDB } from "@/lib/db/connectDB";
import User from "@/lib/models/User";
import { socialLoginOrRegister } from "@/app/actions/auth";
import { LoginSchema } from "@/lib/validation";

/** Normalize phone to 01XXXXXXXXX so DB lookup matches +88/01/880 formats */
function normalizePhoneForLookup(value: string): string | null {
  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("01")) return digits;
  if (digits.length === 13 && digits.startsWith("880")) return digits.slice(2);
  if (digits.length === 10 && digits.startsWith("1")) return "0" + digits;
  return null;
}

export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      id: "credentials",
      credentials: {
        emailOrPhone: {
          label: "ইমেইল বা ফোন নম্বর",
          type: "text",
          placeholder: "example@email.com বা 01XXXXXXXXX",
        },
        password: { label: "পাসওয়ার্ড", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.emailOrPhone || !credentials?.password) {
            throw new Error("ইমেইল/ফোন এবং পাসওয়ার্ড প্রয়োজন");
          }
          const validatedCredentials = LoginSchema.parse({
            emailOrPhone: String(credentials.emailOrPhone).trim(),
            password: String(credentials.password),
          });

          // Connect to database
          await connectDB();

          const emailOrPhone = validatedCredentials.emailOrPhone.trim();
          const emailPart = emailOrPhone.toLowerCase();
          const normalizedPhone = normalizePhoneForLookup(emailOrPhone);

          // Build query: match email (for email input) or both phone formats (01XXXXXXXXX and +8801XXXXXXXXX)
          const query = normalizedPhone
            ? {
                $or: [
                  { email: emailPart },
                  { phone: normalizedPhone },
                  { phone: "+88" + normalizedPhone },
                ],
              }
            : { email: emailPart };

          const user = await User.findOne(query).select("+password");

          if (!user) {
            throw new Error("ব্যবহারকারী খুঁজে পাওয়া যায়নি");
          }

          if (!user.isActive) {
            throw new Error(
              "আপনার অ্যাকাউন্ট নিষ্ক্রিয়। সহায়তার জন্য যোগাযোগ করুন।",
            );
          }

          if (!user.password) {
            throw new Error(
              "আপনার অ্যাকাউন্ট একটি সামাজিক প্রদানকারী ব্যবহার করে সেট আপ করা হয়েছে। দয়া করে সামাজিক লগইন ব্যবহার করুন।",
            );
          }

          // Compare password
          const passwordMatch = await user.comparePassword(
            validatedCredentials.password,
          );

          if (!passwordMatch) {
            throw new Error("ভুল পাসওয়ার্ড");
          }

          // Update last login
          user.lastLogin = new Date();
          await user.save();

          // Use plain arrays/values only so JWT encode (structuredClone) does not throw DataCloneError
          const permissions = user.permissions;
          const plainPermissions = Array.isArray(permissions)
            ? permissions.slice()
            : [];

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
            permissions: plainPermissions,
            image: user.profileImage ?? undefined,
            phone: user.phone ?? undefined,
          };
        } catch (error) {
          console.error("Credentials auth error:", error);
          if (error instanceof Error) {
            throw new Error(error.message);
          }
          throw new Error("লগইনে ত্রুটি হয়েছে");
        }
      },
    }),
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    Facebook({
      clientId: process.env.AUTH_FACEBOOK_ID,
      clientSecret: process.env.AUTH_FACEBOOK_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
  ],

  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.type === "oauth") {
        try {
          const p = profile as {
            email?: string;
            name?: string;
            given_name?: string;
            family_name?: string;
            picture?: string;
          };

          const rawEmail = (p?.email || user.email || "").trim().toLowerCase();
          if (!rawEmail) {
            console.warn("[auth] OAuth signIn: missing email from provider", {
              provider: account.provider,
              hasProfileEmail: !!p?.email,
              hasUserEmail: !!user.email,
            });
            return false;
          }

          const profileName =
            (
              user.name ||
              p?.name ||
              [p?.given_name, p?.family_name].filter(Boolean).join(" ")
            ).trim() || "User";

          const result = await socialLoginOrRegister(
            account.provider as "google" | "facebook",
            {
              id: account.providerAccountId,
              name: profileName,
              email: rawEmail,
              image: user.image ?? p?.picture ?? null,
            },
          );
          console.log(result);
          if (!result.success) {
            console.error("[auth] OAuth save failed:", {
              provider: account.provider,
              message: result.message,
            });
            return false;
          }

          // Update user object with the one from database so JWT gets MongoDB id
          if (result.user) {
            user.id = result.user.id;
            (user as any).role = result.user.role;
            if (result.user.phone !== undefined) {
              (user as any).phone = result.user.phone;
            }
          }
        } catch (err) {
          console.error("[auth] OAuth signIn callback error:", err);
          return false;
        }
      }

      return true;
    },

    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.role = ((user as any).role || "user") as
          | "user"
          | "admin"
          | "moderator";
        token.email = user.email ?? undefined;
        token.phone = (user as any).phone ?? undefined;
        // Plain array only - Mongoose arrays cause DataCloneError in JWT encode
        const perms = (user as any).permissions;
        token.permissions = Array.isArray(perms) ? perms.slice() : [];
      }

      if (account) {
        token.provider = account.provider;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role as string;
        (session.user as any).phone = token.phone ?? null;
        (session.user as any).permissions = token.permissions ?? [];
        try {
          await connectDB();
          const dbUser = await User.findById(token.id)
            .select("name email phone profileImage role permissions")
            .lean();
          if (dbUser) {
            session.user.name = dbUser.name ?? session.user.name;
            session.user.email = dbUser.email ?? session.user.email;
            (session.user as any).phone = dbUser.phone ?? null;
            session.user.image = dbUser.profileImage ?? session.user.image;
            (session.user as any).role = dbUser.role ?? token.role;
            (session.user as any).permissions = dbUser.permissions ?? [];
          }
        } catch (e) {
          console.error("[auth] session callback fetch user:", e);
        }
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  events: {
    async signOut() {
      // Handle sign out
    },
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },

  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  trustHost: true,
  debug: process.env.NODE_ENV === "development",
};
