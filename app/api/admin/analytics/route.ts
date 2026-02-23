import { requireAdmin } from "@/lib/admin/auth-check";
import { connectDB } from "@/lib/db/connectDB";
import Order from "@/lib/models/Order";
import User from "@/lib/models/User";
import Product from "@/lib/models/Product";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { authorized, error } = await requireAdmin("analytics_access");
    if (!authorized) return error;

    await connectDB();
    const url = new URL(req.url);
    const period = url.searchParams.get("period") || "30";
    const days = parseInt(period);
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [
      revenueByDay,
      ordersByStatus,
      topProducts,
      newCustomers,
      paymentMethods,
      totalRevenue,
      totalOrders,
      totalCustomers,
    ] = await Promise.all([
      Order.aggregate([
        { $match: { createdAt: { $gte: startDate }, status: { $nin: ["cancelled"] } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            revenue: { $sum: "$pricing.total" },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Product.find({ status: "Active" })
        .sort({ soldCount: -1 })
        .limit(10)
        .select("name images.main soldCount pricing")
        .lean(),
      User.countDocuments({ role: "user", createdAt: { $gte: startDate } }),
      Order.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: "$payment.method", count: { $sum: 1 }, total: { $sum: "$pricing.total" } } },
      ]),
      Order.aggregate([
        { $match: { status: { $nin: ["cancelled"] } } },
        { $group: { _id: null, total: { $sum: "$pricing.total" } } },
      ]),
      Order.countDocuments({ createdAt: { $gte: startDate } }),
      User.countDocuments({ role: "user" }),
    ]);

    return Response.json({
      success: true,
      data: {
        overview: {
          totalRevenue: totalRevenue[0]?.total ?? 0,
          totalOrders,
          totalCustomers,
          newCustomers,
          conversionRate: totalCustomers > 0 ? ((totalOrders / totalCustomers) * 100).toFixed(1) : "0",
        },
        revenueByDay,
        ordersByStatus,
        topProducts,
        paymentMethods,
      },
    });
  } catch (err) {
    console.error("[admin/analytics]", err);
    return Response.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
