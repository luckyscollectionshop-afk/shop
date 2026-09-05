import { createServiceRoleClient } from "@/lib/supabase/service-role";

type CreateNotificationInput = {
  userId: string;
  type: string;
  title: string;
  message: string;
  orderId?: string | null;
  productId?: string | null;
};

export async function createNotification({
  userId,
  type,
  title,
  message,
  orderId = null,
  productId = null,
}: CreateNotificationInput) {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("notifications")
    .insert({
      user_id: userId,
      type,
      title,
      message,
      order_id: orderId,
      product_id: productId,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Notification creation error:", error);
    throw new Error(error.message);
  }

  return data;
}