import { Suspense } from "react";
import ResetPasswordForm from "./ResetPasswordForm";

// ============================================================
// Server component — wraps the client form in <Suspense>
// so `useSearchParams()` doesn't break static prerendering.
// ============================================================
export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white p-4">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="mt-4 text-slate-500">Loading...</p>
          </div>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
