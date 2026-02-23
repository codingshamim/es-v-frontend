import { connectDB } from "@/lib/db/connectDB";
import Settings from "@/lib/models/Settings";

/**
 * Public API: returns store, shipping, and payment settings for the main site.
 * No authentication required.
 */
export async function GET() {
  try {
    await connectDB();
    const doc = await Settings.findOne().lean();
    if (!doc) {
      return Response.json({
        success: true,
        data: {
          store: {
            storeName: "",
            storeEmail: "",
            storePhone: "",
            storeAddress: "",
          },
          shipping: {
            dhakaCharge: 60,
            outsideDhakaCharge: 120,
            freeShippingMin: 0,
          },
          payment: {
            codEnabled: true,
            bkashEnabled: false,
            bkashNumber: "",
            nagadEnabled: false,
            nagadNumber: "",
            rocketEnabled: false,
            rocketNumber: "",
          },
        },
      });
    }
    const data = {
      store: doc.store ?? {},
      shipping: doc.shipping ?? {},
      payment: doc.payment ?? {},
    };
    return Response.json({ success: true, data });
  } catch (err) {
    console.error("[api/settings GET]", err);
    return Response.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
