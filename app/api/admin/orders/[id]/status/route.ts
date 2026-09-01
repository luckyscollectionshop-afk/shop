import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type RouteProps = {
  params: Promise<{
    id: string;
  }>;
};

const allowedStatuses = [
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;

type AllowedStatus = (typeof allowedStatuses)[number];

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
  const newStatus = body.status as string;

  if (
    !allowedStatuses.includes(
      newStatus as AllowedStatus,
    )
  ) {
    return NextResponse.json(
      { error: "Invalid order status." },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, status, payment_status")
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

  if (
    newStatus !== "cancelled" &&
    order.payment_status !== "paid"
  ) {
    return NextResponse.json(
      {
        error:
          "Payment must be verified before the order can be processed.",
      },
      { status: 400 },
    );
  }

  const now = new Date().toISOString();

  const updateData: {
    status: AllowedStatus;
    shipped_at: string | null;
    delivered_at: string | null;
  } = {
    status: newStatus as AllowedStatus,
    shipped_at: null,
    delivered_at: null,
  };

  if (newStatus === "shipped") {
    updateData.shipped_at = now;
  }

  if (newStatus === "delivered") {
    updateData.shipped_at = now;
    updateData.delivered_at = now;
  }

  if (newStatus === "cancelled") {
    updateData.shipped_at = null;
    updateData.delivered_at = null;
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

  return NextResponse.json({
    success: true,
    status: newStatus,
  });
}