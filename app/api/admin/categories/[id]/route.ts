import { requireAdmin } from "@/lib/admin/auth-check";
import { connectDB } from "@/lib/db/connectDB";
import Category from "@/lib/models/Category";
import { NextRequest } from "next/server";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { authorized, error } = await requireAdmin("category_management");
    if (!authorized) return error;

    const { id } = await params;
    await connectDB();
    const body = await req.json();

    if (body.name) {
      body.slug = body.name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
    }

    const category = await Category.findByIdAndUpdate(id, body, {
      returnDocument: "after",
      runValidators: true,
    });

    if (!category) {
      return Response.json({ success: false, message: "Category not found" }, { status: 404 });
    }
    return Response.json({ success: true, data: category });
  } catch (err) {
    console.error("[admin/categories PUT]", err);
    return Response.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { authorized, error } = await requireAdmin("category_management");
    if (!authorized) return error;

    const { id } = await params;
    await connectDB();
    const category = await Category.findByIdAndDelete(id);
    if (!category) {
      return Response.json({ success: false, message: "Category not found" }, { status: 404 });
    }
    return Response.json({ success: true, message: "Category deleted" });
  } catch (err) {
    console.error("[admin/categories DELETE]", err);
    return Response.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
