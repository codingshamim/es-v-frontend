import { requireAdmin } from "@/lib/admin/auth-check";
import { connectDB } from "@/lib/db/connectDB";
import Category from "@/lib/models/Category";
import { NextRequest } from "next/server";

export async function GET() {
  try {
    const { authorized, error } = await requireAdmin("category_management");
    if (!authorized) return error;

    await connectDB();
    const categories = await Category.find().sort({ sortOrder: 1, name: 1 }).lean();
    return Response.json({ success: true, data: categories });
  } catch (err) {
    console.error("[admin/categories GET]", err);
    return Response.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { authorized, error } = await requireAdmin("category_management");
    if (!authorized) return error;

    await connectDB();
    const body = await req.json();

    const slug = body.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

    const category = await Category.create({ ...body, slug });
    return Response.json({ success: true, data: category }, { status: 201 });
  } catch (err) {
    console.error("[admin/categories POST]", err);
    const message = err instanceof Error ? err.message : "Server error";
    return Response.json({ success: false, message }, { status: 500 });
  }
}
