"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import type { HeroMedia } from "@/components/storefront/hero-carousel";

export type SiteSettings = {
  theme: "golden" | "light" | "dark";
  hero_title: string;
  hero_description: string;
  hero_media: HeroMedia[] | null;
  homepage_category_ids: string[] | null;
};

export type StorefrontSettings = {
  id: string;

  twint_enabled: boolean;
  twint_phone: string | null;

  bank_transfer_enabled: boolean;
  bank_account_name: string | null;
  bank_iban: string | null;

  shipping_enabled: boolean;
  shipping_method: string | null;
  shipping_price: number;
  free_shipping: boolean;

  store_name: string | null;
  store_address: string | null;
  store_city: string | null;
  store_postal_code: string | null;
  store_country: string | null;
};

const defaults: SiteSettings = {
  theme: "golden",
  hero_title: "Something beautiful, just for you.",
  hero_description:
    "Discover jewellery, traditional treasures and delicious favourites, thoughtfully brought together for you.",
  hero_media: [],
  homepage_category_ids: [],
};

export type HomepageCategory = {
  id: string;
  name: string;
};

const ALL_PRODUCTS_ID = "__all__";
const PREBOOKING_ID = "__prebooking__";

export function SiteSettingsForm({
  settings,
  categories = [],
  storefrontSettings,
}: {
  settings: SiteSettings | null;
  categories?: HomepageCategory[];
  storefrontSettings: StorefrontSettings | null;
}) {
  const router = useRouter();

  const initial = { ...defaults, ...settings };

  const [theme, setTheme] = useState<SiteSettings["theme"]>(initial.theme);
  const [title, setTitle] = useState(initial.hero_title);
  const [description, setDescription] = useState(initial.hero_description);
  const [media, setMedia] = useState<HeroMedia[]>(
    initial.hero_media ?? [],
  );

  const [homepageCategoryIds, setHomepageCategoryIds] = useState<string[]>(
    settings?.homepage_category_ids ?? [],
  );

  const [twintEnabled, setTwintEnabled] = useState(
    storefrontSettings?.twint_enabled ?? false,
  );
  const [twintPhone, setTwintPhone] = useState(
    storefrontSettings?.twint_phone ?? "",
  );

  const [bankTransferEnabled, setBankTransferEnabled] = useState(
    storefrontSettings?.bank_transfer_enabled ?? false,
  );
  const [bankAccountName, setBankAccountName] = useState(
    storefrontSettings?.bank_account_name ?? "",
  );
  const [bankIban, setBankIban] = useState(
    storefrontSettings?.bank_iban ?? "",
  );

  const [shippingEnabled, setShippingEnabled] = useState(
    storefrontSettings?.shipping_enabled ?? true,
  );
  const [shippingMethod, setShippingMethod] = useState(
    storefrontSettings?.shipping_method ?? "",
  );
  const [shippingPrice, setShippingPrice] = useState(
    storefrontSettings?.shipping_price?.toString() ?? "0",
  );
  const [freeShipping, setFreeShipping] = useState(
    storefrontSettings?.free_shipping ?? false,
  );

  const [storeName, setStoreName] = useState(
    storefrontSettings?.store_name ?? "",
  );
  const [storeAddress, setStoreAddress] = useState(
    storefrontSettings?.store_address ?? "",
  );
  const [storeCity, setStoreCity] = useState(
    storefrontSettings?.store_city ?? "",
  );
  const [storePostalCode, setStorePostalCode] = useState(
    storefrontSettings?.store_postal_code ?? "",
  );
  const [storeCountry, setStoreCountry] = useState(
    storefrontSettings?.store_country ?? "Switzerland",
  );

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function uploadHeroMedia(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const files = Array.from(event.target.files ?? []);

    event.target.value = "";

    if (!files.length) return;

    setUploading(true);

    try {
      const uploaded = await Promise.all(
        files.map(async (file) => {
          const body = new FormData();

          body.append("file", file);
          body.append("folder", "hero");

          const response = await fetch("/api/upload", {
            method: "POST",
            body,
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || "Media upload failed.");
          }

          return {
            url: data.url as string,
            type: file.type.startsWith("video/")
              ? ("video" as const)
              : ("image" as const),
          };
        }),
      );

      setMedia((current) => [...current, ...uploaded]);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Media upload failed.",
      );
    } finally {
      setUploading(false);
    }
  }

  async function saveSettings() {
    if (!title.trim() || !description.trim()) {
      return alert("Please provide a hero title and description.");
    }

    setSaving(true);

    try {
      const supabase = createClient();

      const { error: siteSettingsError } = await supabase
        .from("site_settings")
        .upsert({
          id: true,
          theme,
          hero_title: title.trim(),
          hero_description: description.trim(),
          hero_media: media,
          homepage_category_ids: homepageCategoryIds,
        });

      if (siteSettingsError) {
        throw siteSettingsError;
      }

      const { error: storefrontError } = await supabase
        .from("storefront_settings")
        .upsert({
          id: storefrontSettings?.id ?? undefined,

          twint_enabled: twintEnabled,
          twint_phone: twintPhone.trim() || null,

          bank_transfer_enabled: bankTransferEnabled,
          bank_account_name: bankAccountName.trim() || null,
          bank_iban: bankIban.trim() || null,

          shipping_enabled: shippingEnabled,
          shipping_method: shippingMethod.trim() || null,
          shipping_price: freeShipping
            ? 0
            : Number(shippingPrice) || 0,
          free_shipping: freeShipping,

          store_name: storeName.trim() || null,
          store_address: storeAddress.trim() || null,
          store_city: storeCity.trim() || null,
          store_postal_code: storePostalCode.trim() || null,
          store_country: storeCountry.trim() || "Switzerland",
        });

      if (storefrontError) {
        throw storefrontError;
      }

      router.push("/admin");
      router.refresh();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Failed to save storefront settings.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Storefront settings</h1>

        <p className="mt-2 text-muted-foreground">
          Choose your site palette and edit the homepage hero.
        </p>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Colour palette</CardTitle>
          </CardHeader>

          <CardContent>
            <Label htmlFor="theme">Site mode</Label>

            <select
              id="theme"
              value={theme}
              onChange={(event) =>
                setTheme(
                  event.target.value as SiteSettings["theme"],
                )
              }
              className="mt-2 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"
            >
              <option value="golden">
                Golden — warm and elegant
              </option>

              <option value="light">
                Light — clean and airy
              </option>

              <option value="dark">
                Dark — rich and modern
              </option>
            </select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Homepage hero carousel</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="hero-title">Title</Label>

              <Input
                id="hero-title"
                value={title}
                onChange={(event) =>
                  setTitle(event.target.value)
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hero-description">
                Description
              </Label>

              <Textarea
                id="hero-description"
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hero-upload">
                Upload images or videos
              </Label>

              <Input
                id="hero-upload"
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={uploadHeroMedia}
                disabled={uploading}
              />

              <p className="text-sm text-muted-foreground">
                {uploading
                  ? "Uploading to Cloudinary..."
                  : "Files are uploaded to Cloudinary; only their URLs and media type are saved in Supabase."}
              </p>
            </div>

            {media.length > 0 && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {media.map((item, index) => (
                  <div
                    key={`${item.url}-${index}`}
                    className="relative overflow-hidden rounded-lg border"
                  >
                    {item.type === "video" ? (
                      <video
                        src={item.url}
                        controls
                        className="aspect-square w-full object-cover"
                      />
                    ) : (
                      <Image
                        src={item.url}
                        alt={`Hero media ${index + 1}`}
                        width={300}
                        height={300}
                        unoptimized
                        className="aspect-square w-full object-cover"
                      />
                    )}

                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() =>
                        setMedia((current) =>
                          current.filter(
                            (_, itemIndex) =>
                              itemIndex !== index,
                          ),
                        )
                      }
                      className="absolute right-2 top-2"
                    >
                      Remove
                    </Button>

                    <p className="px-2 py-1 text-xs text-muted-foreground">
                      {item.type}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

       <Card>
  <CardHeader>
    <CardTitle>Homepage Product Strips</CardTitle>

    <p className="text-sm text-muted-foreground">
      Choose which product strips appear on the homepage and arrange
      them in the order you want.
    </p>
  </CardHeader>

  <CardContent className="space-y-4">
    {/* Selected strips */}
    {homepageCategoryIds.length > 0 && (
      <div className="space-y-2">
        <Label>Homepage order</Label>

        <div className="space-y-2">
          {homepageCategoryIds.map((id, index) => {
            const isAll = id === ALL_PRODUCTS_ID;
            const isPrebooking = id === PREBOOKING_ID;

            const category = categories.find(
              (item) => item.id === id,
            );

            const label = isAll
              ? "ALL PRODUCTS"
              : isPrebooking
                ? "PREBOOKING"
                : category?.name ?? "Unknown category";

            return (
              <div
                key={id}
                className="flex items-center justify-between gap-3 rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-sm font-medium">
                    {index + 1}
                  </span>

                  <span className="font-medium">
                    {label}
                  </span>
                </div>

                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={index === 0}
                    onClick={() => {
                      setHomepageCategoryIds((current) => {
                        const next = [...current];

                        [next[index - 1], next[index]] = [
                          next[index],
                          next[index - 1],
                        ];

                        return next;
                      });
                    }}
                  >
                    ↑
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={
                      index === homepageCategoryIds.length - 1
                    }
                    onClick={() => {
                      setHomepageCategoryIds((current) => {
                        const next = [...current];

                        [next[index], next[index + 1]] = [
                          next[index + 1],
                          next[index],
                        ];

                        return next;
                      });
                    }}
                  >
                    ↓
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setHomepageCategoryIds((current) =>
                        current.filter((item) => item !== id),
                      );
                    }}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    )}

    {/* Available strips */}
    <div className="space-y-2">
      <Label>Add product strip</Label>

      <div className="max-h-[280px] space-y-2 overflow-y-auto rounded-lg border p-2">
        {/* ALL */}
        <label className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 hover:bg-muted/50">
          <input
            type="checkbox"
            checked={homepageCategoryIds.includes(
              ALL_PRODUCTS_ID,
            )}
            onChange={(event) => {
              setHomepageCategoryIds((current) =>
                event.target.checked
                  ? [...current, ALL_PRODUCTS_ID]
                  : current.filter(
                      (id) => id !== ALL_PRODUCTS_ID,
                    ),
              );
            }}
          />

          <span className="font-medium">
            ALL PRODUCTS
          </span>
        </label>

        {/* PREBOOKING */}
        <label className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 hover:bg-muted/50">
          <input
            type="checkbox"
            checked={homepageCategoryIds.includes(
              PREBOOKING_ID,
            )}
            onChange={(event) => {
              setHomepageCategoryIds((current) =>
                event.target.checked
                  ? [...current, PREBOOKING_ID]
                  : current.filter(
                      (id) => id !== PREBOOKING_ID,
                    ),
              );
            }}
          />

          <span className="font-medium">
            PREBOOKING
          </span>
        </label>

        {/* CATEGORIES */}
        {categories.map((category) => {
          const checked = homepageCategoryIds.includes(
            category.id,
          );

          return (
            <label
              key={category.id}
              className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 hover:bg-muted/50"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={(event) => {
                  setHomepageCategoryIds((current) =>
                    event.target.checked
                      ? [...current, category.id]
                      : current.filter(
                          (id) => id !== category.id,
                        ),
                  );
                }}
              />

              <span className="font-medium">
                {category.name}
              </span>
            </label>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        Scroll to see more categories. The box shows about 5
        items at a time.
      </p>
    </div>
  </CardContent>
</Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>

            <p className="text-sm text-muted-foreground">
              Choose which manual payment methods customers can use.
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={twintEnabled}
                  onChange={(event) =>
                    setTwintEnabled(event.target.checked)
                  }
                />

                <span className="font-medium">
                  Enable TWINT
                </span>
              </label>

              {twintEnabled && (
                <div className="space-y-2">
                  <Label htmlFor="twint-phone">
                    TWINT phone number
                  </Label>

                  <Input
                    id="twint-phone"
                    value={twintPhone}
                    onChange={(event) =>
                      setTwintPhone(event.target.value)
                    }
                    placeholder="+41 ..."
                  />
                </div>
              )}
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={bankTransferEnabled}
                  onChange={(event) =>
                    setBankTransferEnabled(
                      event.target.checked,
                    )
                  }
                />

                <span className="font-medium">
                  Enable Bank Transfer
                </span>
              </label>

              {bankTransferEnabled && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="bank-account-name">
                      Account name
                    </Label>

                    <Input
                      id="bank-account-name"
                      value={bankAccountName}
                      onChange={(event) =>
                        setBankAccountName(
                          event.target.value,
                        )
                      }
                      placeholder="Account holder name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bank-iban">
                      IBAN
                    </Label>

                    <Input
                      id="bank-iban"
                      value={bankIban}
                      onChange={(event) =>
                        setBankIban(event.target.value)
                      }
                      placeholder="CH..."
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Shipping</CardTitle>

            <p className="text-sm text-muted-foreground">
              Configure the shipping method and price shown during checkout.
            </p>
          </CardHeader>

          <CardContent className="space-y-4">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={shippingEnabled}
                onChange={(event) =>
                  setShippingEnabled(event.target.checked)
                }
              />

              <span className="font-medium">
                Enable shipping
              </span>
            </label>

            {shippingEnabled && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="shipping-method">
                    Shipping service
                  </Label>

                  <Input
                    id="shipping-method"
                    value={shippingMethod}
                    onChange={(event) =>
                      setShippingMethod(event.target.value)
                    }
                    placeholder="Swiss Post"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shipping-price">
                    Shipping price (CHF)
                  </Label>

                  <Input
                    id="shipping-price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={shippingPrice}
                    onChange={(event) =>
                      setShippingPrice(event.target.value)
                    }
                    disabled={freeShipping}
                  />
                </div>

                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={freeShipping}
                    onChange={(event) =>
                      setFreeShipping(event.target.checked)
                    }
                  />

                  <span className="font-medium">
                    Free shipping
                  </span>
                </label>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Store / Admin Address</CardTitle>

            <p className="text-sm text-muted-foreground">
              This address can later be used for shipping and returns.
            </p>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="store-name">
                Store name
              </Label>

              <Input
                id="store-name"
                value={storeName}
                onChange={(event) =>
                  setStoreName(event.target.value)
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="store-address">
                Address
              </Label>

              <Input
                id="store-address"
                value={storeAddress}
                onChange={(event) =>
                  setStoreAddress(event.target.value)
                }
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="store-postal-code">
                  Postal code
                </Label>

                <Input
                  id="store-postal-code"
                  value={storePostalCode}
                  onChange={(event) =>
                    setStorePostalCode(event.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="store-city">
                  City
                </Label>

                <Input
                  id="store-city"
                  value={storeCity}
                  onChange={(event) =>
                    setStoreCity(event.target.value)
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="store-country">
                Country
              </Label>

              <Input
                id="store-country"
                value={storeCountry}
                onChange={(event) =>
                  setStoreCountry(event.target.value)
                }
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin")}
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={saveSettings}
            disabled={saving || uploading}
          >
            {saving ? "Saving..." : "Save storefront"}
          </Button>
        </div>
      </div>
    </main>
  );
}