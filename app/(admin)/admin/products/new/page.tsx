"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function NewProductPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("cat_research_compounds");
  const [basePrice, setBasePrice] = useState(29.99);
  const [sku, setSku] = useState("SKU");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, slug, description, categoryId, basePrice, sku }),
    });
    if (res.ok) router.push("/admin/products");
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <h1 className="font-display text-2xl font-semibold">New product</h1>
      <form onSubmit={submit} className="mt-8 space-y-4">
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
        <Input label="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} required />
        <div>
          <label className="text-sm font-medium">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            className="mt-1 min-h-[100px] w-full rounded-[var(--radius)] border border-[var(--border)] bg-surface-2 p-3 text-sm"
          />
        </div>
        <Input label="Category ID" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} />
        <Input label="Base price" type="number" value={basePrice} onChange={(e) => setBasePrice(Number(e.target.value))} />
        <Input label="SKU" value={sku} onChange={(e) => setSku(e.target.value)} required />
        <Button type="submit">Create</Button>
      </form>
    </div>
  );
}
