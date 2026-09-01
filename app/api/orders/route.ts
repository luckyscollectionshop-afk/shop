import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "You must be logged in to place an order." },
        { status: 401 },
      );
    }

    const body = await request.json();

    const {
      full_name,
      phone,
      address,
      city,
      postal_code,
      country,
      payment_method,
    } = body;

    if (
      !full_name?.trim() ||
      !phone?.trim() ||
      !address?.trim() ||
      !city?.trim() ||
      !postal_code?.trim() ||
      !country?.trim()
    ) {
      return NextResponse.json(
        { error: "Please complete your shipping address." },
        { status: 400 },
      );
    }

    if (!["twint", "bank_transfer"].includes(payment_method)) {
      return NextResponse.json(
        { error: "Please select a valid payment method." },
        { status: 400 },
      );
    }

    const { data: cart, error: cartError } = await supabase
      .from("carts")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (cartError) {
      throw cartError;
    }

    if (!cart) {
      return NextResponse.json(
        { error: "Your cart is empty." },
        { status: 400 },
      );
    }

    const { data: cartItems, error: itemsError } = await supabase
      .from("cart_items")
      .select(
        `
          id,
          quantity,
          product:products!cart_items_product_id_fkey(
            id,
            name,
            price,
            sale_price,
            stock,
            active,
            weight_grams,
            size,
            height,
            width,
            depth
          )
        `,
      )
      .eq("cart_id", cart.id)
      .order("created_at");

    if (itemsError) {
      throw itemsError;
    }

    const items = (cartItems ?? []).map((item) => ({
      ...item,
      product: Array.isArray(item.product)
        ? (item.product[0] ?? null)
        : item.product,
    }));

    if (items.length === 0) {
      return NextResponse.json(
        { error: "Your cart is empty." },
        { status: 400 },
      );
    }

    for (const item of items) {
      if (!item.product) {
        return NextResponse.json(
          { error: "One of the products in your cart is no longer available." },
          { status: 400 },
        );
      }

      if (!item.product.active) {
        return NextResponse.json(
          {
            error: `${item.product.name} is no longer available.`,
          },
          { status: 400 },
        );
      }

      if (item.quantity > item.product.stock) {
        return NextResponse.json(
          {
            error: `Not enough stock available for ${item.product.name}.`,
          },
          { status: 400 },
        );
      }
    }

    const subtotal = items.reduce((total, item) => {
      if (!item.product) return total;

      const price =
        item.product.sale_price ?? item.product.price;

      return total + Number(price) * item.quantity;
    }, 0);

    const { data: storefrontSettings, error: settingsError } =
      await supabase
        .from("storefront_settings")
        .select(
          "shipping_enabled, shipping_method, shipping_price, free_shipping, twint_enabled, bank_transfer_enabled",
        )
        .maybeSingle();

    if (settingsError) {
      throw settingsError;
    }

    if (
      payment_method === "twint" &&
      !storefrontSettings?.twint_enabled
    ) {
      return NextResponse.json(
        { error: "TWINT is currently unavailable." },
        { status: 400 },
      );
    }

    if (
      payment_method === "bank_transfer" &&
      !storefrontSettings?.bank_transfer_enabled
    ) {
      return NextResponse.json(
        { error: "Bank transfer is currently unavailable." },
        { status: 400 },
      );
    }

    const shippingCost =
      storefrontSettings?.shipping_enabled
        ? storefrontSettings.free_shipping
          ? 0
          : Number(storefrontSettings.shipping_price ?? 0)
        : 0;

    const total = subtotal + shippingCost;

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        status: "pending_payment",
        payment_method,
        payment_status: "pending",
        subtotal,
        shipping_cost: shippingCost,
        total,
        shipping_name: full_name.trim(),
        shipping_phone: phone.trim(),
        shipping_address: address.trim(),
        shipping_city: city.trim(),
        shipping_postal_code: postal_code.trim(),
        shipping_country: country.trim(),
      })
      .select("id, order_number")
      .single();

    if (orderError) {
      throw orderError;
    }

    const orderItems = items.map((item) => {
      const product = item.product!;

      const unitPrice =
        product.sale_price ?? product.price;

      return {
        order_id: order.id,
        product_id: product.id,
        product_name: product.name,
        quantity: item.quantity,
        unit_price: Number(unitPrice),
        total_price:
          Number(unitPrice) * item.quantity,
        weight_grams: product.weight_grams,
        size: product.size,
        height: product.height,
        width: product.width,
        depth: product.depth,
      };
    });

    const { error: orderItemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (orderItemsError) {
      throw orderItemsError;
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        full_name: full_name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim(),
        postal_code: postal_code.trim(),
        country: country.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (profileError) {
      throw profileError;
    }

    const { error: clearCartError } = await supabase
  .from("cart_items")
  .delete()
  .eq("cart_id", cart.id);

if (clearCartError) {
  throw clearCartError;
}

    return NextResponse.json({
      success: true,
      order_id: order.id,
      order_number: order.order_number,
    });
  } catch (error) {
    console.error("Create order error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create order.",
      },
      { status: 500 },
    );
  }
}