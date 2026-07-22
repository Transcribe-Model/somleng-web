"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, configured } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!configured || !user)) {
      router.replace("/login");
    }
  }, [loading, configured, user, router]);

  if (loading) {
    return (
      <div className="flex h-dvh items-center justify-center bg-bg-subtle">
        <span className="h-10 w-10 animate-spin rounded-full border-2 border-navy/20 border-t-navy" />
      </div>
    );
  }

  if (!configured || !user) {
    return null;
  }

  return <>{children}</>;
}
