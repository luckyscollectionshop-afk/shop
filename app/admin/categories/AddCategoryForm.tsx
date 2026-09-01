"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AddCategoryForm() {
    const router = useRouter();

    const [name, setName] = useState("");
    const [saving, setSaving] = useState(false);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const trimmedName = name.trim();

        if (!trimmedName) {
            return;
        }

        setSaving(true);

        try {
            const response = await fetch("/api/admin/categories", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: trimmedName,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to create category.");
            }

            setName("");
            router.refresh();
        } catch (error) {
            alert(
                error instanceof Error
                    ? error.message
                    : "Failed to create category."
            );
        } finally {
            setSaving(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Jewellery"
                disabled={saving}
            />

            <Button type="submit" disabled={saving || !name.trim()}>
                {saving ? "Adding..." : "Add Category"}
            </Button>
        </form>
    );
}