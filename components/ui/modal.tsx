"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Modal({
  open,
  onOpenChange,
  title,
  children,
  className,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 data-[state=open]:animate-in data-[state=closed]:animate-out" />
        <Dialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-[var(--radius)] border border-[var(--border)] bg-surface p-6 shadow-xl",
            className
          )}
        >
          <div className="mb-4 flex items-start justify-between gap-4">
            {title ? (
              <Dialog.Title className="font-display text-xl font-semibold">{title}</Dialog.Title>
            ) : (
              <Dialog.Title className="sr-only">Dialog</Dialog.Title>
            )}
            <Dialog.Close className="rounded-md p-1 text-[var(--text-muted)] hover:bg-surface-2 hover:text-[var(--text)]">
              <X className="h-5 w-5" />
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
