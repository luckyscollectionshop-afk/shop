"use client";

import { useState } from "react";

type CheckoutPaymentProps = {
  twintEnabled: boolean;
  twintPhone: string | null;
  bankTransferEnabled: boolean;
  bankAccountName: string | null;
  bankIban: string | null;
};

export default function CheckoutPayment({
  twintEnabled,
  twintPhone,
  bankTransferEnabled,
  bankAccountName,
  bankIban,
}: CheckoutPaymentProps) {
  const [paymentMethod, setPaymentMethod] = useState<
    "twint" | "bank_transfer" | ""
  >("");

  const hasPaymentMethod =
    twintEnabled || bankTransferEnabled;

  return (
    <section className="rounded-xl border p-5">
      <h2 className="text-lg font-semibold">
        Payment method
      </h2>

      {hasPaymentMethod ? (
        <div className="mt-4 space-y-3">
          {twintEnabled && (
            <label
              className={`block cursor-pointer rounded-lg border p-4 ${
                paymentMethod === "twint"
                  ? "border-primary bg-muted/50"
                  : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="payment-method"
                  value="twint"
                  checked={paymentMethod === "twint"}
                  onChange={() =>
                    setPaymentMethod("twint")
                  }
                />

                <span className="font-medium">
                  TWINT
                </span>
              </div>

              {twintPhone && (
                <p className="mt-2 pl-7 text-sm text-muted-foreground">
                  Send your payment to:{" "}
                  <span className="font-medium text-foreground">
                    {twintPhone}
                  </span>
                </p>
              )}
            </label>
          )}

          {bankTransferEnabled && (
            <label
              className={`block cursor-pointer rounded-lg border p-4 ${
                paymentMethod === "bank_transfer"
                  ? "border-primary bg-muted/50"
                  : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="payment-method"
                  value="bank_transfer"
                  checked={paymentMethod === "bank_transfer"}
                  onChange={() =>
                    setPaymentMethod("bank_transfer")
                  }
                />

                <span className="font-medium">
                  Bank Transfer
                </span>
              </div>

              <div className="mt-2 space-y-1 pl-7 text-sm text-muted-foreground">
                {bankAccountName && (
                  <p>
                    Account name:{" "}
                    <span className="font-medium text-foreground">
                      {bankAccountName}
                    </span>
                  </p>
                )}

                {bankIban && (
                  <p>
                    IBAN:{" "}
                    <span className="font-medium text-foreground">
                      {bankIban}
                    </span>
                  </p>
                )}
              </div>
            </label>
          )}
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          No payment methods are currently available.
        </p>
      )}

      <input
        type="hidden"
        name="payment_method"
        value={paymentMethod}
      />
    </section>
  );
}