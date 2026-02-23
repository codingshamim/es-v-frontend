import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe auth config for middleware only.
 * No Node.js or DB imports - session is built from JWT token only.
 */
export const edgeAuthConfig: NextAuthConfig = {
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  providers: [], // Required by NextAuth; not used in middleware (JWT only)
  callbacks: {
    jwt({ token }) {
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as { role?: string }).role = (token.role as string) ?? "user";
        (session.user as { phone?: string | null }).phone = (token.phone as string) ?? null;
        (session.user as { permissions?: string[] }).permissions = (token.permissions as string[]) ?? [];
        if (token.name) session.user.name = token.name as string;
        if (token.email) session.user.email = token.email as string;
      }
      return session;
    },
  },
};
