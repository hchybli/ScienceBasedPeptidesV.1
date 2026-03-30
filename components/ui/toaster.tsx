"use client";

import * as React from "react";
import * as ToastPrimitive from "@radix-ui/react-toast";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const ToastProvider = ToastPrimitive.Provider;
const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Viewport
    ref={ref}
    className={cn(
      "fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse gap-2 p-4 sm:bottom-4 sm:right-4 sm:top-auto sm:flex-col md:max-w-[420px]",
      className
    )}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitive.Viewport.displayName;

function Toast({
  className,
  title,
  description,
  open,
  onOpenChange,
  ...props
}: React.ComponentPropsWithoutRef<typeof ToastPrimitive.Root> & {
  title?: string;
  description?: string;
}) {
  return (
    <ToastPrimitive.Root
      open={open}
      onOpenChange={onOpenChange}
      className={cn(
        "group pointer-events-auto relative flex w-full items-center justify-between gap-4 overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-surface p-4 shadow-lg",
        className
      )}
      {...props}
    >
      <div className="grid gap-1">
        {title ? <ToastPrimitive.Title className="text-sm font-semibold">{title}</ToastPrimitive.Title> : null}
        {description ? (
          <ToastPrimitive.Description className="text-sm text-[var(--text-muted)]">
            {description}
          </ToastPrimitive.Description>
        ) : null}
      </div>
      <ToastPrimitive.Close className="rounded-md p-1 text-[var(--text-muted)] hover:bg-surface-2">
        <X className="h-4 w-4" />
      </ToastPrimitive.Close>
    </ToastPrimitive.Root>
  );
}

export function Toaster() {
  return <ToastViewport />;
}

export { ToastProvider, Toast, ToastViewport };
