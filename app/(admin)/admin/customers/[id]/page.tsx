"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDate } from "@/lib/utils";

type Customer = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  loyalty_points: number;
  referral_code: string;
  created_at: number;
  last_purchase_at: number | null;
  referredBy: { id: string; email: string } | null;
};

type Order = { id: string; status: string; total: number; created_at: number };
type LoyaltyTx = { id: string; points: number; reason: string; order_id: string | null; created_at: number };
type Referral = { id: string; referred_email: string | null; referred_user_id: string | null; status: string; created_at: number; converted_at: number | null };

type Address = {
  id: string;
  user_id: string;
  label: string | null;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  zip: string;
  country: string;
  is_default: number;
  created_at: number;
};

type Tag = { id: string; tag: string; created_at: number };
type Status = { status: "active" | "suspended" | string; updated_at: number | null; updated_by: string | null };
type Note = { id: string; body: string; author_user_id: string | null; created_at: number; updated_at: number | null };

export default function AdminCustomerPage() {
  const params = useParams();
  const id = params.id as string;

  const [data, setData] = useState<{
    customer: Customer;
    orders: Order[];
    loyaltyTransactions: LoyaltyTx[];
    referrals: Referral[];
    addresses: Address[];
    tags: Tag[];
    status: Status;
    notes: Note[];
  } | null>(null);

  const [statusSaving, setStatusSaving] = useState(false);
  const [tagsDraft, setTagsDraft] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [tagsSaving, setTagsSaving] = useState(false);
  const [noteInput, setNoteInput] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteBody, setEditingNoteBody] = useState("");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await fetch(`/api/admin/customers/${id}`);
      if (!res.ok) return;
      const payload = (await res.json()) as typeof data;
      if (cancelled) return;
      setData(payload);
      setTagsDraft((payload?.tags ?? []).map((t) => t.tag));
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!data) return <div className="text-sm text-[var(--text-muted)]">Loading…</div>;

  const defaultAddress = data.addresses.find((a) => a.is_default === 1) ?? data.addresses[0] ?? null;

  async function refresh() {
    const res = await fetch(`/api/admin/customers/${id}`);
    if (!res.ok) return;
    const payload = (await res.json()) as typeof data;
    setData(payload);
    setTagsDraft((payload?.tags ?? []).map((t) => t.tag));
  }

  async function setStatus(next: "active" | "suspended") {
    if (statusSaving) return;
    setStatusSaving(true);
    try {
      const res = await fetch(`/api/admin/customers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (res.ok) {
        await refresh();
      }
    } finally {
      setStatusSaving(false);
    }
  }

  function addTag() {
    const t = tagInput.trim().toLowerCase();
    if (!t) return;
    if (tagsDraft.some((x) => x.toLowerCase() === t)) return;
    setTagsDraft([...tagsDraft, t]);
    setTagInput("");
  }

  function removeTag(tag: string) {
    setTagsDraft(tagsDraft.filter((t) => t !== tag));
  }

  async function saveTags() {
    if (tagsSaving) return;
    setTagsSaving(true);
    try {
      const res = await fetch(`/api/admin/customers/${id}/tags`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: tagsDraft }),
      });
      if (res.ok) {
        await refresh();
      }
    } finally {
      setTagsSaving(false);
    }
  }

  async function addNote() {
    const body = noteInput.trim();
    if (!body || noteSaving) return;
    setNoteSaving(true);
    try {
      const res = await fetch(`/api/admin/customers/${id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (res.ok) {
        setNoteInput("");
        await refresh();
      }
    } finally {
      setNoteSaving(false);
    }
  }

  function startEditNote(note: Note) {
    setEditingNoteId(note.id);
    setEditingNoteBody(note.body);
  }

  async function saveNoteEdit() {
    if (!editingNoteId) return;
    const body = editingNoteBody.trim();
    if (!body) return;
    const noteId = editingNoteId;
    setNoteSaving(true);
    try {
      const res = await fetch(`/api/admin/customers/${id}/notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      if (res.ok) {
        setEditingNoteId(null);
        setEditingNoteBody("");
        await refresh();
      }
    } finally {
      setNoteSaving(false);
    }
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h2 className="font-display text-2xl font-semibold">{data.customer.email}</h2>
        <p className="mt-1 font-mono text-xs text-[var(--text-muted)]">{data.customer.id}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <h3 className="font-display text-lg font-semibold">Contact</h3>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between gap-4 rounded-xl border border-[var(--border)] bg-surface-2/70 px-4 py-3">
                <p className="text-[var(--text-muted)]">Name</p>
                <p className="font-medium text-right">{data.customer.name ?? "—"}</p>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-xl border border-[var(--border)] bg-surface-2/70 px-4 py-3">
                <p className="text-[var(--text-muted)]">Email</p>
                <p className="font-medium text-right">{data.customer.email}</p>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-xl border border-[var(--border)] bg-surface-2/70 px-4 py-3">
                <p className="text-[var(--text-muted)]">Phone</p>
                <p className="font-medium text-right">{data.customer.phone ?? "—"}</p>
              </div>
              <div className="rounded-xl border border-[var(--border)] bg-surface-2/70 px-4 py-3">
                <p className="text-[var(--text-muted)]">Default address</p>
                <p className="mt-1 font-medium">
                  {defaultAddress ? (
                    <>
                      {defaultAddress.line1}
                      {defaultAddress.line2 ? `, ${defaultAddress.line2}` : ""}, {defaultAddress.city}, {defaultAddress.state} {defaultAddress.zip},{" "}
                      {defaultAddress.country}
                    </>
                  ) : (
                    "—"
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="font-display text-lg font-semibold">Account</h3>
            <p className="mt-1 text-sm text-[var(--text-muted)]">Manage status and internal metadata.</p>

            <div className="mt-4 rounded-xl border border-[var(--border)] bg-surface-2/70 px-4 py-4">
              <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Status</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={data.status.status === "active" ? "primary" : "secondary"}
                  disabled={statusSaving}
                  onClick={() => setStatus("active")}
                >
                  Active
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={data.status.status === "suspended" ? "danger" : "secondary"}
                  disabled={statusSaving}
                  onClick={() => setStatus("suspended")}
                >
                  Suspended
                </Button>
              </div>
              <p className="mt-2 text-xs text-[var(--text-muted)]">
                Suspended customers will be blocked from logging in.
              </p>
            </div>

            <div className="mt-4 rounded-xl border border-[var(--border)] bg-surface-2/70 px-4 py-4">
              <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">Tags</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {tagsDraft.length ? (
                  tagsDraft.map((t) => (
                    <button
                      key={t}
                      type="button"
                      className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-surface px-3 py-1 text-xs text-[var(--text-muted)] hover:border-accent/40"
                      onClick={() => removeTag(t)}
                      title="Remove tag"
                    >
                      <span>{t}</span>
                      <span className="text-[10px]">×</span>
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-[var(--text-muted)]">No tags yet.</p>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <div className="min-w-[240px] flex-1">
                  <Input
                    label=""
                    placeholder="Add tag (e.g. vip)"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                  />
                </div>
                <Button type="button" variant="secondary" onClick={addTag}>
                  Add
                </Button>
                <Button type="button" onClick={saveTags} disabled={tagsSaving}>
                  {tagsSaving ? "Saving..." : "Save tags"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-[var(--text-muted)]">Loyalty points</p>
            <p className="mt-2 font-mono text-2xl">{data.customer.loyalty_points}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-[var(--text-muted)]">Referral code</p>
            <p className="mt-2 font-mono text-2xl">{data.customer.referral_code}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-[var(--text-muted)]">Joined</p>
            <p className="mt-2 font-mono text-2xl">{formatDate(data.customer.created_at)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <h3 className="font-display text-lg font-semibold">Internal notes</h3>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Private admin-only notes about this customer.</p>

          <div className="mt-4 rounded-xl border border-[var(--border)] bg-surface-2/70 p-4">
            <textarea
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              placeholder="Add a note..."
              className="min-h-[92px] w-full rounded-[var(--radius)] border border-[var(--border)] bg-surface-2 p-3 text-sm outline-none transition focus:border-accent/50"
            />
            <div className="mt-3 flex justify-end">
              <Button type="button" onClick={addNote} disabled={noteSaving || !noteInput.trim()}>
                {noteSaving ? "Saving..." : "Add note"}
              </Button>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {data.notes.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">No notes yet.</p>
            ) : (
              data.notes.map((n) => {
                const isEditing = editingNoteId === n.id;
                return (
                  <div key={n.id} className="rounded-xl border border-[var(--border)] bg-surface px-4 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs text-[var(--text-muted)]">
                        {formatDate(n.updated_at ?? n.created_at)}
                        {n.updated_at ? " (edited)" : ""}
                      </p>
                      {isEditing ? (
                        <div className="flex gap-2">
                          <Button type="button" size="sm" variant="secondary" onClick={() => setEditingNoteId(null)} disabled={noteSaving}>
                            Cancel
                          </Button>
                          <Button type="button" size="sm" onClick={saveNoteEdit} disabled={noteSaving || !editingNoteBody.trim()}>
                            {noteSaving ? "Saving..." : "Save"}
                          </Button>
                        </div>
                      ) : (
                        <Button type="button" size="sm" variant="secondary" onClick={() => startEditNote(n)}>
                          Edit
                        </Button>
                      )}
                    </div>
                    {isEditing ? (
                      <textarea
                        value={editingNoteBody}
                        onChange={(e) => setEditingNoteBody(e.target.value)}
                        className="mt-3 min-h-[80px] w-full rounded-[var(--radius)] border border-[var(--border)] bg-surface-2 p-3 text-sm outline-none transition focus:border-accent/50"
                      />
                    ) : (
                      <p className="mt-3 whitespace-pre-wrap text-sm">{n.body}</p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="font-display text-lg font-semibold">Orders</h3>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-[var(--text-muted)]">
                  <th className="py-2">Order</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {data.orders.length ? (
                  data.orders.map((o) => (
                    <tr key={o.id} className="border-b border-[var(--border)]">
                      <td className="py-3">
                        <Link className="font-mono text-xs text-accent underline" href={`/admin/orders/${o.id}`}>
                          {o.id.slice(0, 8)}
                        </Link>
                      </td>
                      <td>{o.status}</td>
                      <td className="font-mono">{formatCurrency(o.total)}</td>
                      <td>{formatDate(o.created_at)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-3 text-sm text-[var(--text-muted)]">
                      No orders yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="font-display text-lg font-semibold">Loyalty history</h3>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-[var(--text-muted)]">
                  <th className="py-2">When</th>
                  <th>Points</th>
                  <th>Reason</th>
                  <th>Order</th>
                </tr>
              </thead>
              <tbody>
                {data.loyaltyTransactions.length ? (
                  data.loyaltyTransactions.map((t) => (
                    <tr key={t.id} className="border-b border-[var(--border)]">
                      <td className="py-3">{formatDate(t.created_at)}</td>
                      <td className="font-mono">{t.points}</td>
                      <td>{t.reason}</td>
                      <td className="font-mono text-xs">{t.order_id ? t.order_id.slice(0, 8) : "—"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-3 text-sm text-[var(--text-muted)]">
                      No loyalty transactions yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="font-display text-lg font-semibold">Referrals</h3>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Referred by: {data.customer.referredBy ? data.customer.referredBy.email : "—"}
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-[var(--text-muted)]">
                  <th className="py-2">When</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Converted</th>
                </tr>
              </thead>
              <tbody>
                {data.referrals.length ? (
                  data.referrals.map((r) => (
                    <tr key={r.id} className="border-b border-[var(--border)]">
                      <td className="py-3">{formatDate(r.created_at)}</td>
                      <td>{r.referred_email ?? "—"}</td>
                      <td>{r.status}</td>
                      <td>{r.converted_at ? formatDate(r.converted_at) : "—"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-3 text-sm text-[var(--text-muted)]">
                      No referral activity yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
