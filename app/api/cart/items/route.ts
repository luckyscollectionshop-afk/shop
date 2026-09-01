import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/* =========================================================
   POST — Add product to cart
   ========================================================= */

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please sign in to add products to your cart." },
        { status: 401 },
      );
    }

    const body = await request.json();

    const productId =
      typeof body.product_id === "string"
        ? body.product_id
        : "";

    const quantity =
      typeof body.quantity === "number"
        ? Math.floor(body.quantity)
        : 1;

    if (!productId) {
      return NextResponse.json(
        { error: "Product is required." },
        { status: 400 },
      );
    }

    if (quantity < 1) {
      return NextResponse.json(
        { error: "Quantity must be at least 1." },
        { status: 400 },
      );
    }

    // Make sure the product exists and is active.
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, stock, active")
      .eq("id", productId)
      .eq("active", true)
      .maybeSingle();

    if (productError) {
      throw productError;
    }

    if (!product) {
      return NextResponse.json(
        { error: "Product is no longer available." },
        { status: 404 },
      );
    }

    if ((product.stock ?? 0) < quantity) {
      return NextResponse.json(
        { error: "Not enough stock available." },
        { status: 400 },
      );
    }

    // Find the user's cart.
    const { data: cart, error: cartError } = await supabase
      .from("carts")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (cartError) {
      throw cartError;
    }

    let cartId = cart?.id;

    // Create cart if the user doesn't have one yet.
    if (!cartId) {
      const { data: newCart, error: createCartError } = await supabase
        .from("carts")
        .insert({
          user_id: user.id,
        })
        .select("id")
        .single();

      if (createCartError) {
        throw createCartError;
      }

      cartId = newCart.id;
    }

    // Check whether this product is already in the cart.
    const { data: existingItem, error: existingItemError } = await supabase
      .from("cart_items")
      .select("id, quantity")
      .eq("cart_id", cartId)
      .eq("product_id", productId)
      .maybeSingle();

    if (existingItemError) {
      throw existingItemError;
    }

    const newQuantity = existingItem
      ? existingItem.quantity + quantity
      : quantity;

    if (newQuantity > (product.stock ?? 0)) {
      return NextResponse.json(
        { error: "The requested quantity exceeds available stock." },
        { status: 400 },
      );
    }

    // Update existing cart item.
    if (existingItem) {
      const { data, error } = await supabase
        .from("cart_items")
        .update({
          quantity: newQuantity,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingItem.id)
        .select("id, cart_id, product_id, quantity")
        .single();

      if (error) {
        throw error;
      }

      return NextResponse.json(data);
    }

    // Insert new cart item.
    const { data, error } = await supabase
      .from("cart_items")
      .insert({
        cart_id: cartId,
        product_id: productId,
        quantity,
      })
      .select("id, cart_id, product_id, quantity")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Add to cart error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to add product to cart.",
      },
      { status: 500 },
    );
  }
}


/* =========================================================
   PATCH — Update cart item quantity
   ========================================================= */

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please sign in." },
        { status: 401 },
      );
    }

    const body = await request.json();

    const cartItemId =
      typeof body.cart_item_id === "string"
        ? body.cart_item_id
        : "";

    const quantity =
      typeof body.quantity === "number"
        ? Math.floor(body.quantity)
        : 0;

    if (!cartItemId) {
      return NextResponse.json(
        { error: "Cart item is required." },
        { status: 400 },
      );
    }

    if (quantity < 1) {
      return NextResponse.json(
        { error: "Quantity must be at least 1." },
        { status: 400 },
      );
    }

    // Find the user's cart.
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
        { error: "Cart not found." },
        { status: 404 },
      );
    }

    // Find the cart item and its product stock.
    const { data: cartItem, error: cartItemError } = await supabase
      .from("cart_items")
      .select(
        `
          id,
          cart_id,
          product_id,
          product:products!cart_items_product_id_fkey(
            id,
            stock,
            active
          )
        `,
      )
      .eq("id", cartItemId)
      .eq("cart_id", cart.id)
      .maybeSingle();

    if (cartItemError) {
      throw cartItemError;
    }

    if (!cartItem) {
      return NextResponse.json(
        { error: "Cart item not found." },
        { status: 404 },
      );
    }

    const product = Array.isArray(cartItem.product)
      ? cartItem.product[0]
      : cartItem.product;

    if (!product || !product.active) {
      return NextResponse.json(
        { error: "Product is no longer available." },
        { status: 400 },
      );
    }

    if (quantity > (product.stock ?? 0)) {
      return NextResponse.json(
        { error: "Not enough stock available." },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("cart_items")
      .update({
        quantity,
        updated_at: new Date().toISOString(),
      })
      .eq("id", cartItemId)
      .eq("cart_id", cart.id)
      .select("id, cart_id, product_id, quantity")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Update cart item error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update cart item.",
      },
      { status: 500 },
    );
  }
}


/* =========================================================
   DELETE — Remove cart item
   ========================================================= */

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please sign in." },
        { status: 401 },
      );
    }

    const body = await request.json();

    const cartItemId =
      typeof body.cart_item_id === "string"
        ? body.cart_item_id
        : "";

    if (!cartItemId) {
      return NextResponse.json(
        { error: "Cart item is required." },
        { status: 400 },
      );
    }

    // Find the user's cart.
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
        { error: "Cart not found." },
        { status: 404 },
      );
    }

    // Delete only an item belonging to the user's cart.
    const { data, error } = await supabase
      .from("cart_items")
      .delete()
      .eq("id", cartItemId)
      .eq("cart_id", cart.id)
      .select("id")
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return NextResponse.json(
        { error: "Cart item not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Remove cart item error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to remove cart item.",
      },
      { status: 500 },
    );
  }
}