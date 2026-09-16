"use client";

import { useState, useEffect, Suspense } from "react";
import dynamic from "next/dynamic";
import { useRouter, usePathname } from "next/navigation";
import Sidebar from "@/app/components/Layout/Sidebar";
import Header from "@/app/components/Layout/Header";
import { AuthProvider, useAuth } from "@/app/context/AuthContext";

// ============================================================
// Lazy-load skeletons (keep initial bundle small)
// ============================================================
const DashboardSkeleton = dynamic(
  () =>
    import("@/app/components/UI/PageSkeletons").then(
      (m) => m.DashboardSkeleton
    ),
  { ssr: false }
);

const AnalyticsSkeleton = dynamic(
  () =>
    import("@/app/components/UI/PageSkeletons").then(
      (m) => m.AnalyticsSkeleton
    ),
  { ssr: false }
);

const TableSkeleton = dynamic(
  () =>
    import("@/app/components/UI/PageSkeletons").then((m) => m.TableSkeleton),
  { ssr: false }
);

const CardGridSkeleton = dynamic(
  () =>
    import("@/app/components/UI/PageSkeletons").then(
      (m) => m.CardGridSkeleton
    ),
  { ssr: false }
);

const ActivitySkeleton = dynamic(
  () =>
    import("@/app/components/UI/PageSkeletons").then(
      (m) => m.ActivitySkeleton
    ),
  { ssr: false }
);

const ProfileSkeleton = dynamic(
  () =>
    import("@/app/components/UI/PageSkeletons").then(
      (m) => m.ProfileSkeleton
    ),
  { ssr: false }
);

// ============================================================
// Route-specific fallback
// ============================================================
function RouteSkeleton() {
  const pathname = usePathname() || "";

  if (pathname.includes("/analytics")) return <AnalyticsSkeleton />;
  if (pathname.includes("/users")) return <TableSkeleton rows={8} columns={6} />;
  if (pathname.includes("/roles")) return <TableSkeleton rows={5} columns={5} />;
  if (pathname.includes("/cities")) return <CardGridSkeleton count={6} />;
  if (pathname.includes("/activity")) return <ActivitySkeleton rows={6} />;
  if (pathname.includes("/profile")) return <ProfileSkeleton />;

  return <DashboardSkeleton />;
}

// ============================================================
// Layout content
// ============================================================
function AdminLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-uc-bg">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-uc-teal border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-uc-text-muted">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-uc-bg">
      <div
        className={`fixed inset-y-0 left-0 z-50 transform ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 lg:static lg:z-auto transition-transform duration-300 ease-in-out`}
      >
        <Sidebar onClose={() => setIsSidebarOpen(false)} />
      </div>

      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col h-screen min-w-0">
        <Header
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
        />
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-uc-bg">
          <Suspense fallback={<RouteSkeleton />}>{children}</Suspense>
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </AuthProvider>
  );
}
