import { connectDB } from "@/lib/db/connectDB";
import Category from "@/lib/models/Category";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const includeInactive = url.searchParams.get("includeInactive") === "true";

    await connectDB();

    const categories = await Category.find(
      includeInactive ? {} : { isActive: true },
    )
      .select("name slug description image productCount isActive sortOrder")
      .sort({ sortOrder: 1, name: 1 })
      .lean();

    return Response.json(
      { success: true, data: categories },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      },
    );
  } catch (error) {
    console.error("Categories API error:", error);
    return Response.json(
      { success: false, message: "Failed to fetch categories" },
      { status: 500 },
    );
  }
}
