import { Suspense } from "react";
import { ResetForm } from "./reset-form";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="p-16 text-center">Loading…</div>}>
      <ResetForm />
    </Suspense>
  );
}
