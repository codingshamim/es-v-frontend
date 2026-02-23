import { requireAdmin } from "@/lib/admin/auth-check";
import { connectDB } from "@/lib/db/connectDB";
import Product from "@/lib/models/Product";
import { NextRequest } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { authorized, error } = await requireAdmin("product_management");
    if (!authorized) return error;

    const { id } = await params;
    await connectDB();
    const product = await Product.findById(id).lean();
    if (!product) {
      return Response.json({ success: false, message: "Product not found" }, { status: 404 });
    }
    return Response.json({ success: true, data: product });
  } catch (err) {
    console.error("[admin/products GET id]", err);
    return Response.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { authorized, error } = await requireAdmin("product_management");
    if (!authorized) return error;

    const { id } = await params;
    await connectDB();
    const body = await req.json();

    if (body.pricing) {
      body.pricing.discount = Product.calculateDiscount(
        body.pricing.regularPrice,
        body.pricing.salePrice,
      );
    }
    if (body.sizes) {
      body.totalStock = Product.calculateTotalStock(body.sizes);
    }

    const product = await Product.findByIdAndUpdate(id, body, {
      returnDocument: "after",
      runValidators: true,
    });

    if (!product) {
      return Response.json({ success: false, message: "Product not found" }, { status: 404 });
    }
    return Response.json({ success: true, data: product });
  } catch (err) {
    console.error("[admin/products PUT]", err);
    return Response.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { authorized, error } = await requireAdmin("product_management");
    if (!authorized) return error;

    const { id } = await params;
    await connectDB();
    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      return Response.json({ success: false, message: "Product not found" }, { status: 404 });
    }
    return Response.json({ success: true, message: "Product deleted" });
  } catch (err) {
    console.error("[admin/products DELETE]", err);
    return Response.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
