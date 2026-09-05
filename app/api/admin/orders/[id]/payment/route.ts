import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

type RouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(
  request: Request,
  { params }: RouteProps,
) {
  const { id } = await params;

  const { isAdmin } = await requireAdmin();

  if (!isAdmin) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  const body = await request.json();

  const paymentStatus = body.payment_status;

  if (
    paymentStatus !== "pending" &&
    paymentStatus !== "paid"
  ) {
    return NextResponse.json(
      { error: "Invalid payment status." },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, user_id, order_number, status, payment_status")
    .eq("id", id)
    .maybeSingle();

  if (orderError) {
    return NextResponse.json(
      { error: orderError.message },
      { status: 500 },
    );
  }

  if (!order) {
    return NextResponse.json(
      { error: "Order not found." },
      { status: 404 },
    );
  }

  const updateData: {
    payment_status: string;
    payment_verified_at: string | null;
    status?: string;
  } = {
    payment_status: paymentStatus,
    payment_verified_at:
      paymentStatus === "paid"
        ? new Date().toISOString()
        : null,
  };

  if (
    paymentStatus === "paid" &&
    order.status === "pending_payment"
  ) {
    updateData.status = "processing";
  }

  if (
    paymentStatus === "pending" &&
    order.status === "processing"
  ) {
    updateData.status = "pending_payment";
  }

 const { error } = await supabase
  .from("orders")
  .update(updateData)
  .eq("id", id);

if (error) {
  return NextResponse.json(
    { error: error.message },
    { status: 500 },
  );
}

/* =========================================================
   Create customer notification
   ========================================================= */

if (
  paymentStatus === "paid" &&
  order.payment_status !== "paid"
) {
  const serviceSupabase = createServiceRoleClient();

  const { error: notificationError } =
    await serviceSupabase
      .from("notifications")
      .insert({
        user_id: order.user_id,
        type: "payment_confirmed",
        title: "Payment confirmed",
        message: `Your payment for order ${order.order_number} has been confirmed.`,
        order_id: order.id,
      });

  if (notificationError) {
    console.error(
      "Failed to create payment notification:",
      notificationError,
    );
  }
}

  return NextResponse.json({
    success: true,
    payment_status: paymentStatus,
    order_status: updateData.status ?? order.status,
  });
}