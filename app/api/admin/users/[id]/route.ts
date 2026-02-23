import { requireAdmin } from "@/lib/admin/auth-check";
import { connectDB } from "@/lib/db/connectDB";
import User from "@/lib/models/User";
import { NextRequest } from "next/server";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { authorized, error } = await requireAdmin("user_management");
    if (!authorized) return error;

    const { id } = await params;
    await connectDB();
    const body = await req.json();

    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.email !== undefined) updateData.email = body.email.toLowerCase().trim();
    if (body.phone !== undefined) updateData.phone = body.phone?.trim() || null;
    if (body.role !== undefined) updateData.role = body.role;
    if (body.permissions !== undefined) updateData.permissions = body.permissions;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    const user = await User.findByIdAndUpdate(id, updateData, {
      returnDocument: "after",
      runValidators: true,
    }).select("-password -emailVerificationToken -passwordResetToken");

    if (!user) {
      return Response.json(
        { success: false, message: "User not found" },
        { status: 404 },
      );
    }

    return Response.json({ success: true, data: user });
  } catch (err) {
    console.error("[admin/users PUT]", err);
    return Response.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { authorized, error, user: admin } = await requireAdmin("user_management");
    if (!authorized) return error;

    const { id } = await params;
    if (id === admin!.id) {
      return Response.json(
        { success: false, message: "Cannot delete yourself" },
        { status: 400 },
      );
    }

    await connectDB();
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return Response.json(
        { success: false, message: "User not found" },
        { status: 404 },
      );
    }

    return Response.json({ success: true, message: "User deleted" });
  } catch (err) {
    console.error("[admin/users DELETE]", err);
    return Response.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
