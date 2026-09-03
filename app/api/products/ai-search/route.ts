import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const MODEL = "gemini-3.5-flash-lite";

type ProductForSearch = {
  id: string;
  name: string;
  description: string | null;
  keywords: string[] | null;
};

export async function POST(request: Request) {
  try {
    const { query, products } = (await request.json()) as {
      query?: string;
      products?: ProductForSearch[];
    };

    if (!query?.trim()) {
      return NextResponse.json({ productIds: [] });
    }

    if (!Array.isArray(products)) {
      return NextResponse.json(
        { error: "Invalid products data." },
        { status: 400 },
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "AI search is currently unavailable." },
        { status: 503 },
      );
    }

    const ai = new GoogleGenAI({
      apiKey,
    });

    const productList = products.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description ?? "",
      keywords: product.keywords ?? [],
    }));

    const prompt = `
You are a product search assistant for an Indian online shop.

The customer searched for:
"${query.trim()}"

Here is the available product catalogue:

${JSON.stringify(productList)}

Find the products that are relevant to the customer's search.

Understand natural language and intent.
Examples:
- "something for a wedding" can match jewellery, sarees, dresses, etc.
- "gold earrings" can match products described as gold or earrings.
- "something spicy" can match spicy food products.
- "gift for my mother" should return products that could reasonably be gifts.
- "puja" should return relevant religious/puja products.

Return ONLY valid JSON in exactly this format:

{
  "productIds": ["id1", "id2"]
}

Only use IDs that exist in the catalogue.
Do not invent product IDs.
If nothing is relevant, return an empty array.
`;

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text?.trim();

    if (!text) {
      return NextResponse.json({ productIds: [] });
    }

    const parsed = JSON.parse(text);

    const validIds = new Set(products.map((product) => product.id));

    const productIds = Array.isArray(parsed.productIds)
      ? parsed.productIds.filter(
          (id: unknown): id is string =>
            typeof id === "string" && validIds.has(id),
        )
      : [];

    return NextResponse.json({ productIds });
  } catch (error) {
    console.error("AI search error:", error);

    return NextResponse.json(
      { error: "AI search is currently unavailable." },
      { status: 503 },
    );
  }
}