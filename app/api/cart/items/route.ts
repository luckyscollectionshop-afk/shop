import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/* =========================================================
   Helpers
   ========================================================= */

function getProductState(
  stock: number,
  availableForSale: boolean,
) {
  const isPreBooking =
    !availableForSale && stock <= 0;

  const isNormalSale =
    availableForSale && stock > 0;

  const canOrder =
    isNormalSale || isPreBooking;

  return {
    isPreBooking,
    isNormalSale,
    canOrder,
  };
}

/* =========================================================
   POST — Add product to cart
   ========================================================= */

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    /* -------------------------------------------------------
       Check logged-in user
       ------------------------------------------------------- */

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          error:
            "Please sign in to add products to your cart.",
        },
        { status: 401 },
      );
    }

    /* -------------------------------------------------------
       Read request
       ------------------------------------------------------- */

    const body = await request.json();

    const productId =
      typeof body.product_id === "string"
        ? body.product_id.trim()
        : "";

    const quantity =
      typeof body.quantity === "number"
        ? Math.floor(body.quantity)
        : 1;

    if (!productId) {
      return NextResponse.json(
        {
          error: "Product is required.",
        },
        { status: 400 },
      );
    }

    if (quantity < 1) {
      return NextResponse.json(
        {
          error: "Quantity must be at least 1.",
        },
        { status: 400 },
      );
    }

    /* -------------------------------------------------------
       Get product
       ------------------------------------------------------- */

    const {
      data: product,
      error: productError,
    } = await supabase
      .from("products")
      .select(
        "id, stock, active, available_for_sale",
      )
      .eq("id", productId)
      .eq("active", true)
      .maybeSingle();

    if (productError) {
      console.error(
        "Product lookup error:",
        productError,
      );

      return NextResponse.json(
        {
          error:
            "Unable to check product availability.",
        },
        { status: 500 },
      );
    }

    if (!product) {
      return NextResponse.json(
        {
          error:
            "Product is no longer available.",
        },
        { status: 404 },
      );
    }

    const stock = Number(product.stock ?? 0);

    const availableForSale =
      product.available_for_sale ?? false;

    const {
      isPreBooking,
      canOrder,
    } = getProductState(
      stock,
      availableForSale,
    );

    /* -------------------------------------------------------
       Check whether product can be ordered
       ------------------------------------------------------- */

    if (!canOrder) {
      return NextResponse.json(
        {
          error:
            "Product is currently out of stock.",
        },
        { status: 400 },
      );
    }

    /*
     * Normal products:
     * quantity must not exceed stock.
     *
     * Pre-booking products:
     * stock is intentionally 0,
     * therefore stock does NOT restrict quantity.
     */

    if (
      !isPreBooking &&
      quantity > stock
    ) {
      return NextResponse.json(
        {
          error:
            "Not enough stock available.",
        },
        { status: 400 },
      );
    }

    /* -------------------------------------------------------
       Find user's cart
       ------------------------------------------------------- */

    const {
      data: cart,
      error: cartError,
    } = await supabase
      .from("carts")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (cartError) {
      console.error(
        "Cart lookup error:",
        cartError,
      );

      return NextResponse.json(
        {
          error:
            "Unable to access your cart.",
        },
        { status: 500 },
      );
    }

    let cartId = cart?.id;

    /* -------------------------------------------------------
       Create cart if it doesn't exist
       ------------------------------------------------------- */

    if (!cartId) {
      const {
        data: newCart,
        error: createCartError,
      } = await supabase
        .from("carts")
        .insert({
          user_id: user.id,
        })
        .select("id")
        .single();

      if (createCartError) {
        console.error(
          "Create cart error:",
          createCartError,
        );

        return NextResponse.json(
          {
            error:
              "Unable to create your cart.",
          },
          { status: 500 },
        );
      }

      cartId = newCart.id;
    }

    /* -------------------------------------------------------
       Check whether product is already in cart
       ------------------------------------------------------- */

    const {
      data: existingItem,
      error: existingItemError,
    } = await supabase
      .from("cart_items")
      .select("id, quantity")
      .eq("cart_id", cartId)
      .eq("product_id", productId)
      .maybeSingle();

    if (existingItemError) {
      console.error(
        "Cart item lookup error:",
        existingItemError,
      );

      return NextResponse.json(
        {
          error:
            "Unable to check your cart.",
        },
        { status: 500 },
      );
    }

    const newQuantity = existingItem
      ? existingItem.quantity + quantity
      : quantity;

    /* -------------------------------------------------------
       Check final quantity against stock
       ------------------------------------------------------- */

    if (
      !isPreBooking &&
      newQuantity > stock
    ) {
      return NextResponse.json(
        {
          error:
            "The requested quantity exceeds available stock.",
        },
        { status: 400 },
      );
    }

    /* -------------------------------------------------------
       Update existing cart item
       ------------------------------------------------------- */

    if (existingItem) {
      const {
        data,
        error,
      } = await supabase
        .from("cart_items")
        .update({
          quantity: newQuantity,
          updated_at:
            new Date().toISOString(),
        })
        .eq("id", existingItem.id)
        .select(
          "id, cart_id, product_id, quantity",
        )
        .single();

      if (error) {
        console.error(
          "Update cart item error:",
          error,
        );

        return NextResponse.json(
          {
            error:
              "Unable to update your cart.",
          },
          { status: 500 },
        );
      }

      return NextResponse.json({
        ...data,
        is_pre_booking: isPreBooking,
      });
    }

    /* -------------------------------------------------------
       Insert new cart item
       ------------------------------------------------------- */

    const {
      data,
      error,
    } = await supabase
      .from("cart_items")
      .insert({
        cart_id: cartId,
        product_id: productId,
        quantity,
      })
      .select(
        "id, cart_id, product_id, quantity",
      )
      .single();

    if (error) {
      console.error(
        "Insert cart item error:",
        error,
      );

      return NextResponse.json(
        {
          error:
            "Unable to add product to your cart.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        ...data,
        is_pre_booking: isPreBooking,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(
      "Add to cart unexpected error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Failed to add product to cart.",
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

    /* -------------------------------------------------------
       Check logged-in user
       ------------------------------------------------------- */

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          error: "Please sign in.",
        },
        { status: 401 },
      );
    }

    /* -------------------------------------------------------
       Read request
       ------------------------------------------------------- */

    const body = await request.json();

    const cartItemId =
      typeof body.cart_item_id === "string"
        ? body.cart_item_id.trim()
        : "";

    const quantity =
      typeof body.quantity === "number"
        ? Math.floor(body.quantity)
        : 0;

    if (!cartItemId) {
      return NextResponse.json(
        {
          error: "Cart item is required.",
        },
        { status: 400 },
      );
    }

    if (quantity < 1) {
      return NextResponse.json(
        {
          error:
            "Quantity must be at least 1.",
        },
        { status: 400 },
      );
    }

    /* -------------------------------------------------------
       Find user's cart
       ------------------------------------------------------- */

    const {
      data: cart,
      error: cartError,
    } = await supabase
      .from("carts")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (cartError) {
      throw cartError;
    }

    if (!cart) {
      return NextResponse.json(
        {
          error: "Cart not found.",
        },
        { status: 404 },
      );
    }

    /* -------------------------------------------------------
       Find cart item + product
       ------------------------------------------------------- */

    const {
      data: cartItem,
      error: cartItemError,
    } = await supabase
      .from("cart_items")
      .select(
        `
          id,
          cart_id,
          product_id,
          product:products!cart_items_product_id_fkey(
            id,
            stock,
            active,
            available_for_sale
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
        {
          error: "Cart item not found.",
        },
        { status: 404 },
      );
    }

    const product =
      Array.isArray(cartItem.product)
        ? cartItem.product[0]
        : cartItem.product;

    if (!product || !product.active) {
      return NextResponse.json(
        {
          error:
            "Product is no longer available.",
        },
        { status: 400 },
      );
    }

    const stock = Number(
      product.stock ?? 0,
    );

    const availableForSale =
      product.available_for_sale ?? false;

    const {
      isPreBooking,
      canOrder,
    } = getProductState(
      stock,
      availableForSale,
    );

    if (!canOrder) {
      return NextResponse.json(
        {
          error:
            "Product is currently unavailable.",
        },
        { status: 400 },
      );
    }

    /*
     * Pre-booking products can have any quantity.
     */

    if (
      !isPreBooking &&
      quantity > stock
    ) {
      return NextResponse.json(
        {
          error:
            "Not enough stock available.",
        },
        { status: 400 },
      );
    }

    /* -------------------------------------------------------
       Update quantity
       ------------------------------------------------------- */

    const {
      data,
      error,
    } = await supabase
      .from("cart_items")
      .update({
        quantity,
        updated_at:
          new Date().toISOString(),
      })
      .eq("id", cartItemId)
      .eq("cart_id", cart.id)
      .select(
        "id, cart_id, product_id, quantity",
      )
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error(
      "Update cart item error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Failed to update cart item.",
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

    /* -------------------------------------------------------
       Check logged-in user
       ------------------------------------------------------- */

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          error: "Please sign in.",
        },
        { status: 401 },
      );
    }

    /* -------------------------------------------------------
       Read request
       ------------------------------------------------------- */

    const body = await request.json();

    const cartItemId =
      typeof body.cart_item_id === "string"
        ? body.cart_item_id.trim()
        : "";

    if (!cartItemId) {
      return NextResponse.json(
        {
          error: "Cart item is required.",
        },
        { status: 400 },
      );
    }

    /* -------------------------------------------------------
       Find user's cart
       ------------------------------------------------------- */

    const {
      data: cart,
      error: cartError,
    } = await supabase
      .from("carts")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (cartError) {
      throw cartError;
    }

    if (!cart) {
      return NextResponse.json(
        {
          error: "Cart not found.",
        },
        { status: 404 },
      );
    }

    /* -------------------------------------------------------
       Delete cart item
       ------------------------------------------------------- */

    const {
      data,
      error,
    } = await supabase
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
        {
          error: "Cart item not found.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "Remove cart item error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Failed to remove product from cart.",
      },
      { status: 500 },
    );
  }
}