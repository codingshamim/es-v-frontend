import NextAuth from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      phone?: string | null;
      role?: "user" | "admin" | "moderator";
    };
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    phone?: string | null;
    role?: "user" | "admin" | "moderator";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role?: "user" | "admin" | "moderator";
    provider?: string;
    phone?: string | null;
  }
}
