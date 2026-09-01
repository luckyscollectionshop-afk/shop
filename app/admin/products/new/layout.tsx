import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/admin";

export default async function NewProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAdmin } = await requireAdmin();

  if (!isAdmin) {
    redirect("/auth/login");
  }

  return children;
}