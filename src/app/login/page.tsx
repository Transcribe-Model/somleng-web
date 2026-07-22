"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { AuthShell } from "@/components/AuthShell";
import { useAuth } from "@/contexts/AuthContext";
import { km } from "@/lib/km";
import { getSupabaseConfigIssue } from "@/lib/supabase";

export default function LoginPage() {
  const { signIn, configured, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/transcribe");
    }
  }, [authLoading, user, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signIn(email, password);
      router.push("/transcribe");
    } catch (err) {
      setError(err instanceof Error ? err.message : km.loginFailed);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      mode="login"
      title={km.loginTitle}
      subtitle={km.loginSubtitle}
    >
      {!configured && getSupabaseConfigIssue() && (
        <div className="khmer-text mb-6 rounded-[6px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {getSupabaseConfigIssue()}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <label className="block space-y-1.5">
          <span className="khmer-text text-sm font-medium text-text">{km.email}</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="gov-input"
            disabled={!configured || loading}
          />
        </label>

        <label className="block space-y-1.5">
          <span className="khmer-text text-sm font-medium text-text">{km.password}</span>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="gov-input"
            disabled={!configured || loading}
          />
        </label>

        {error && (
          <div className="khmer-text rounded-[6px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={!configured || loading}
          className="btn-primary khmer-text"
        >
          {loading ? km.signingIn : km.signIn}
        </button>
      </form>

      <p className="khmer-text mt-6 text-center text-sm text-text-muted">
        {km.noAccount}{" "}
        <Link href="/register" className="font-semibold text-navy hover:text-gold">
          {km.createAccount}
        </Link>
      </p>
    </AuthShell>
  );
}
