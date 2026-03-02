"use client";

import { useEffect, useMemo } from "react";
import { printInvoice } from "@/lib/utils/printInvoice";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface InvoiceOrderItem {
  name: string;
  size: string;
  colorName?: string;
  quantity: number;
  unitPrice: number;
}

export interface InvoiceOrder {
  orderId: string;
  items: InvoiceOrderItem[];
  shipping: {
    name: string;
    phone: string;
    district: string;
    city: string;
    address: string;
  };
  payment: {
    method: "cod" | "bkash" | "nagad" | "rocket";
    transactionId?: string;
  };
  pricing: {
    subtotal: number;
    discount: number;
    deliveryCharge: number;
    total: number;
  };
  createdAt: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatPrice(amount: number): string {
  return `৳${amount.toLocaleString("bn-BD")}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

const PAYMENT_LABELS: Record<string, string> = {
  cod: "Cash On Delivery",
  bkash: "bKash",
  nagad: "Nagad",
  rocket: "Rocket",
};

// ─── Component ───────────────────────────────────────────────────────────────

interface InvoicePrintButtonProps {
  order: InvoiceOrder;
  customClass?: string;
  children?: React.ReactNode;
}

export function InvoicePrintButton({
  order,
  customClass = "",
  children,
}: InvoicePrintButtonProps) {
  const {
    orderId,
    items,
    shipping,
    payment,
    pricing,
    createdAt,
  } = order;

  const invoiceNo = payment.transactionId ?? orderId;
  const paymentLabel = PAYMENT_LABELS[payment.method] ?? payment.method;

  const grandTotal = pricing.total;
  const advancedPayment =
    payment.method === "cod" ? pricing.deliveryCharge : pricing.total;
  const dueAmount =
    payment.method === "cod" ? pricing.subtotal : 0;

  const renderItems = useMemo(() => items
    .map((item, index) => {
      const total = item.unitPrice * item.quantity;
      const details = [item.size, item.colorName].filter(Boolean).join(", ");
      return `
        <tr class="border border-gray-200">
          <td class="border border-gray-200 p-2 text-center">${index + 1}</td>
          <td class="border border-gray-200 p-2 text-black" style="font-weight: 600">
            ${item.name}
            ${details ? `<br /><span class="text-gray-500" style="font-weight: 400; font-size: 12px">${details}</span>` : ""}
          </td>
          <td class="border border-gray-200 p-2 text-center">${formatPrice(item.unitPrice)}</td>
          <td class="border border-gray-200 p-2 text-center">${item.quantity}</td>
          <td class="border border-gray-200 p-2 text-center">${formatPrice(total)}</td>
        </tr>`;
    })
    .join(""), [items]);

  const invoiceContent = useMemo(() => `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Invoice - ${invoiceNo}</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap');
      @media print {
        body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      }
      @page { margin: 0; }
      * { font-family: "Montserrat", sans-serif; }
      .bg-white { background-color: white !important; }
      .bg-black { background-color: black !important; }
      .text-black { color: black; }
      .text-white { color: white; }
      .shadow-md { box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
      .p-6 { padding: 1.5rem; }
      .flex { display: flex; }
      .justify-between { justify-content: space-between; }
      .items-center { align-items: center; }
      .mb-6 { margin-bottom: 1.5rem; }
      .grid { display: grid; }
      .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
      .gap-4 { gap: 1rem; }
      .p-3 { padding: 0.75rem; }
      .rounded-sm { border-radius: 0.125rem; }
      .border { border: 1px solid #e5e7eb; }
      .border-t-transparent { border-top-color: transparent; }
      .border-gray-200 { border-color: #e5e7eb; }
      .border-black { border-color: black; }
      .p-2 { padding: 0.5rem; }
      .text-sm { font-size: 0.875rem; }
      .text-center { text-align: center; }
      .font-bold { font-weight: 700; }
      .font-medium { font-weight: 500; }
      .text-gray-700 { color: #374151; }
      .w-full { width: 100%; }
      .border-collapse { border-collapse: collapse; }
      .signature-section { margin-top: 40px; display: flex; justify-content: space-between; align-items: flex-end; }
      .signature-box { text-align: center; }
      .signature-line { width: 200px; height: 60px; border-bottom: 2px solid #333; margin-bottom: 8px; }
      .signature-label { font-weight: 600; font-size: 14px; color: #555; margin-top: 5px; }
    </style>
  </head>
  <body>
    <div class="p-6">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 20px;">
        <div style="width: 38px; height: 38px; background-color: black; color: white; border-radius: 4px; display: flex; justify-content: center; align-items: center; font-weight: bold; font-size: 20px;">ES</div>
        <div>
          <div style="color: black; font-weight: bold; font-size: 20px;">ES FITT</div>
          <p style="color: black; font-size: 12px; font-weight: 500; margin: 0; text-transform: uppercase;">next level tees</p>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4 mb-6">
        <div class="shadow-md p-3 rounded-sm border">
          <span style="font-weight:700">From,</span>
          <div style="margin-left:10px">
            <p style="font-weight:700">Company : <span style="font-weight:500; color:#2b2b2b">ESSEVEN</span></p>
            <p style="font-weight:700">District : <span style="font-weight:500; color:#2b2b2b">Gazipur</span></p>
            <p style="font-weight:700">City : <span style="font-weight:500; color:#2b2b2b">Tongi</span></p>
            <p style="font-weight:700">Address : <span style="font-weight:500; color:#2b2b2b">Tongi Bazar, Gazipur - 1710</span></p>
          </div>
        </div>
        <div class="border shadow-md p-3 rounded-sm">
          <span style="font-weight:700">To,</span>
          <div style="margin-left:10px">
            <p style="font-weight:700">Name : <span style="font-weight:500; color:#2b2b2b">${shipping.name}</span></p>
            <p style="font-weight:700">District : <span style="font-weight:500; color:#2b2b2b">${shipping.district}</span></p>
            <p style="font-weight:700">City : <span style="font-weight:500; color:#2b2b2b">${shipping.city}</span></p>
            <p style="font-weight:700">Address : <span style="font-weight:500; color:#2b2b2b">${shipping.address}</span></p>
          </div>
        </div>
      </div>

      <div class="mb-6">
        <div class="grid grid-cols-4 text-sm">
          <div class="border p-2 font-bold text-center">Invoice Date</div>
          <div class="border p-2 font-bold text-center">Payment Method</div>
          <div class="border p-2 font-bold text-center">Phone Number</div>
          <div class="border p-2 font-bold text-center">Invoice No.</div>
        </div>
        <div class="grid grid-cols-4 text-sm">
          <div class="border border-t-transparent p-2 text-center text-gray-700">${formatDate(createdAt)}</div>
          <div class="border border-t-transparent p-2 text-center text-gray-700">${paymentLabel}</div>
          <div class="border border-t-transparent p-2 text-center text-gray-700">${shipping.phone}</div>
          <div class="border border-t-transparent p-2 text-center text-gray-700">${invoiceNo}</div>
        </div>
      </div>

      <table class="w-full border-collapse border border-black text-sm">
        <thead>
          <tr class="bg-black text-white">
            <th class="border p-2">No.</th>
            <th class="border p-2">Item Detail</th>
            <th class="border p-2">Price</th>
            <th class="border p-2">Qty</th>
            <th class="border p-2">Total</th>
          </tr>
        </thead>
        <tbody>${renderItems}</tbody>
      </table>

      <table style="width: 100%; border-collapse: collapse; margin-top: 30px;">
        <thead>
          <tr>
            <th style="text-align: left; padding: 8px; border: 1px solid #ddd; font-weight: 700;">Description</th>
            <th style="text-align: right; padding: 8px; border: 1px solid #ddd; font-weight: 700;">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; font-weight:600">Grand Total</td>
            <td style="text-align: right; padding: 8px; border: 1px solid #ddd;">${formatPrice(grandTotal)}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; font-weight:600">Advanced Payment</td>
            <td style="text-align: right; padding: 8px; border: 1px solid #ddd;">${formatPrice(advancedPayment)}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; font-weight:600">Due Amount</td>
            <td style="text-align: right; padding: 8px; border: 1px solid #ddd;">${formatPrice(dueAmount)}</td>
          </tr>
        </tbody>
      </table>

      <div class="signature-section" style="position:absolute; bottom:50px; width:90%">
        <div class="signature-box">
          <div class="signature-line"></div>
          <div class="signature-label">Authorised Sign</div>
        </div>
        <div style="flex: 1;"></div>
        <div class="signature-box">
          <div class="signature-line"></div>
          <div class="signature-label">Customer Sign</div>
        </div>
      </div>
    </div>
  </body>
</html>`, [orderId, items, shipping, payment, pricing, createdAt]);

  const handlePrint = () => {
    printInvoice(invoiceContent);
  };

  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "p") {
        e.preventDefault();
        printInvoice(invoiceContent);
      }
    };
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [invoiceContent]);

  const defaultContent = (
    <>
      <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5Zm-3 0h.008v.008H15V10.5Z" />
      </svg>
      রসিদ প্রিন্ট করুন
    </>
  );

  return (
    <button
      type="button"
      onClick={handlePrint}
      className={`flex items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-[#1a1a1a] px-6 py-3.5 text-sm font-semibold text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-[#111] font-bengali ${customClass}`.trim()}
    >
      {children ?? defaultContent}
    </button>
  );
}

export default InvoicePrintButton;
