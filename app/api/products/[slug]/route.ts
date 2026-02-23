import Product from "@/lib/models/Product";
import { connectDB } from "@/lib/db/connectDB";
import { NextRequest } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    if (!slug?.trim()) {
      return Response.json(
        { success: false, message: "Product slug is required" },
        { status: 400 },
      );
    }

    await connectDB();

    const product = await Product.findOne({
      slug: slug.trim(),
      status: { $in: ["Active", "Out of Stock"] },
    }).lean();

    if (!product) {
      return Response.json(
        { success: false, message: "Product not found" },
        { status: 404 },
      );
    }

    return Response.json(
      { success: true, data: product },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600",
        },
      },
    );
  } catch (error) {
    console.error("Product detail API error:", error);
    return Response.json(
      { success: false, message: "Failed to fetch product" },
      { status: 500 },
    );
  }
}
