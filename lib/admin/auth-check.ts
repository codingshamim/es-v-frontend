import { auth } from "@/lib/auth/auth";
import { AdminPermission, hasPermission } from "./permissions";
import { connectDB } from "@/lib/db/connectDB";
import User from "@/lib/models/User";

interface AdminUser {
  id: string;
  role: string;
  permissions: string[];
  name: string;
  email: string;
}

interface AuthResult {
  authorized: boolean;
  user?: AdminUser;
  error?: Response;
}

export async function requireAdmin(
  requiredPermission?: AdminPermission,
): Promise<AuthResult> {
  const session = await auth();
  if (!session?.user) {
    return {
      authorized: false,
      error: Response.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      ),
    };
  }

  const role = (session.user as { role?: string }).role;
  if (role !== "admin" && role !== "moderator") {
    return {
      authorized: false,
      error: Response.json(
        { success: false, message: "Forbidden" },
        { status: 403 },
      ),
    };
  }

  await connectDB();
  const dbUser = await User.findById(session.user.id)
    .select("role permissions name email")
    .lean();

  if (!dbUser) {
    return {
      authorized: false,
      error: Response.json(
        { success: false, message: "User not found" },
        { status: 404 },
      ),
    };
  }

  if (dbUser.role !== "admin" && dbUser.role !== "moderator") {
    return {
      authorized: false,
      error: Response.json(
        { success: false, message: "Forbidden" },
        { status: 403 },
      ),
    };
  }

  if (
    requiredPermission &&
    !hasPermission(dbUser.role, dbUser.permissions, requiredPermission)
  ) {
    return {
      authorized: false,
      error: Response.json(
        { success: false, message: "Insufficient permissions" },
        { status: 403 },
      ),
    };
  }

  return {
    authorized: true,
    user: {
      id: dbUser._id.toString(),
      role: dbUser.role,
      permissions: dbUser.permissions ?? [],
      name: dbUser.name,
      email: dbUser.email,
    },
  };
}
