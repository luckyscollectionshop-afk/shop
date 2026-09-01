import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please sign in first." },
        { status: 401 },
      );
    }

    const body = await request.json();

    const fullName =
      typeof body.full_name === "string" ? body.full_name.trim() : "";

    const phone =
      typeof body.phone === "string" ? body.phone.trim() : "";

    const addressLine1 =
      typeof body.address_line1 === "string"
        ? body.address_line1.trim()
        : "";

    const addressLine2 =
      typeof body.address_line2 === "string"
        ? body.address_line2.trim()
        : "";

    const city =
      typeof body.city === "string" ? body.city.trim() : "";

    const postalCode =
      typeof body.postal_code === "string"
        ? body.postal_code.trim()
        : "";

    const country =
      typeof body.country === "string"
        ? body.country.trim()
        : "";

    if (
      !fullName ||
      !phone ||
      !addressLine1 ||
      !city ||
      !postalCode ||
      !country
    ) {
      return NextResponse.json(
        { error: "Please fill in all required fields." },
        { status: 400 },
      );
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        phone,
        address_line1: addressLine1,
        address_line2: addressLine2 || null,
        city,
        postal_code: postalCode,
        country,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Account update error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to save account details.",
      },
      { status: 500 },
    );
  }
}