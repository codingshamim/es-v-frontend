import { handlers } from "@/lib/auth/auth";

// Delegate to your existing NextAuth handlers (already wired to Mongo/user model)
export const { GET, POST } = handlers;
