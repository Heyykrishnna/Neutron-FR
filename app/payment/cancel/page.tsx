"use client";

import React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AuthLayout from "@/components/auth-layout";
import { AuthButton } from "@/components/auth-components";
import { motion } from "framer-motion";

type SearchParamsLike = { get: (key: string) => string | null };

const getFirstParam = (searchParams: SearchParamsLike | null, keys: string[]) => {
  if (!searchParams) return null;
  for (const key of keys) {
    const value = searchParams.get(key);
    if (value) return value;
  }
  return null;
};

export default function PaymentFailurePage() {
  const searchParams = useSearchParams();

  const errorMessage = getFirstParam(
    searchParams,
    ["error", "reason", "message", "msg", "statusMessage", "failureMessage"]
  );
  const orderId = getFirstParam(searchParams, ["orderId", "order_id", "order", "reference", "ref"]);
  const paymentId = getFirstParam(searchParams, ["paymentId", "payment_id", "paymentIntent", "payment_intent", "id"]);
  const transactionId = getFirstParam(searchParams, ["transactionId", "transaction_id", "txnId", "txnid"]);
  const amount = getFirstParam(searchParams, ["amount", "total", "value"]);
  const currency = getFirstParam(searchParams, ["currency", "curr"]);

  const formattedAmount = amount
    ? `${currency ? currency.toUpperCase() + " " : ""}${amount}`
    : null;

  const details: Array<{ label: string; value: string }> = [
    orderId ? { label: "Order ID", value: orderId } : null,
    paymentId ? { label: "Payment ID", value: paymentId } : null,
    transactionId ? { label: "Transaction ID", value: transactionId } : null,
    formattedAmount ? { label: "Amount", value: formattedAmount } : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  return (
    <AuthLayout
      title="Payment Failed"
      subtitle="We couldn’t complete your payment."
    >
      <div className="space-y-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6 py-6"
        >
          <div className="w-20 h-20 bg-red-900/20 text-red-400/90 rounded-full flex items-center justify-center mx-auto mb-2 relative">
            <div className="absolute inset-0 bg-red-900/20 blur-xl rounded-full animate-pulse" />
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>

          <div>
            <h2 className="text-3xl font-bold mb-3">Payment Not Completed</h2>
            <p className="text-white/60 leading-relaxed font-light max-w-md mx-auto">
              {errorMessage || "Please check your details and try again."}
            </p>
            <p className="text-white/40 leading-relaxed font-light text-sm mt-3 max-w-md mx-auto">
              If you were charged, it may take a few minutes for the status to update.
            </p>
          </div>

          {details.length > 0 && (
            <div className="max-w-md mx-auto p-4 bg-white/5 border border-white/10 rounded-2xl text-left space-y-3">
              {details.map((d) => (
                <div key={d.label} className="flex items-center justify-between gap-4">
                  <span className="text-white/50 text-sm">{d.label}</span>
                  <span className="text-white/80 font-medium text-sm break-all">{d.value}</span>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 max-w-md mx-auto">
            <Link href="/profile">
              <AuthButton variant="primary">Try Again</AuthButton>
            </Link>
            <Link href="/contact">
              <AuthButton variant="outline">Contact Support</AuthButton>
            </Link>
          </div>
        </motion.div>
      </div>
    </AuthLayout>
  );
}
