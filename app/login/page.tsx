import { Suspense } from "react";
import LoginForm from "./LoginForm";

// ============================================================
// Server component — wraps the client form in <Suspense>
// so `useSearchParams()` doesn't break static prerendering.
// ============================================================
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="mt-4 text-slate-500">Loading...</p>
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
