import { connectDB } from "@/lib/db/connectDB";
import Settings from "@/lib/models/Settings";

function pickStore(doc: Record<string, unknown>) {
  const s = doc.store as Record<string, unknown> | undefined;
  return {
    storeName: String(s?.storeName ?? doc.storeName ?? ""),
    storeEmail: String(s?.storeEmail ?? doc.storeEmail ?? ""),
    storePhone: String(s?.storePhone ?? doc.storePhone ?? ""),
    storeAddress: String(s?.storeAddress ?? doc.storeAddress ?? ""),
  };
}

function pickShipping(doc: Record<string, unknown>) {
  const s = doc.shipping as Record<string, unknown> | undefined;
  const num = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);
  return {
    dhakaCharge: num(s?.dhakaCharge ?? doc.shippingDhakaCharge ?? 60),
    outsideDhakaCharge: num(s?.outsideDhakaCharge ?? doc.shippingOutsideCharge ?? 120),
    freeShippingMin: num(s?.freeShippingMin ?? doc.freeShippingMinimum ?? 0),
  };
}

function pickPayment(doc: Record<string, unknown>) {
  const p = doc.payment as Record<string, unknown> | undefined;
  return {
    codEnabled: Boolean(p?.codEnabled ?? doc.codEnabled ?? true),
    bkashEnabled: Boolean(p?.bkashEnabled ?? doc.bkashEnabled ?? false),
    bkashNumber: String(p?.bkashNumber ?? doc.bkashNumber ?? ""),
    nagadEnabled: Boolean(p?.nagadEnabled ?? doc.nagadEnabled ?? false),
    nagadNumber: String(p?.nagadNumber ?? doc.nagadNumber ?? ""),
    rocketEnabled: Boolean(p?.rocketEnabled ?? doc.rocketEnabled ?? false),
    rocketNumber: String(p?.rocketNumber ?? doc.rocketNumber ?? ""),
  };
}

/**
 * Public API: returns store, shipping, and payment settings for the main site.
 * Prefers nested structure (store, shipping, payment) over legacy flat keys.
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
          store: { storeName: "", storeEmail: "", storePhone: "", storeAddress: "" },
          shipping: { dhakaCharge: 60, outsideDhakaCharge: 120, freeShippingMin: 0 },
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
    const d = doc as unknown as Record<string, unknown>;
    const data = {
      store: pickStore(d),
      shipping: pickShipping(d),
      payment: pickPayment(d),
    };
    return Response.json({ success: true, data });
  } catch (err) {
    console.error("[api/settings GET]", err);
    return Response.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
