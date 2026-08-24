"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push("/");
    router.refresh();
  }

  async function handleGoogleLogin() {
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setLoading(false);
      setError(error.message);
    }
  }
 

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#faf8f4] px-6">
      <div className="w-full max-w-md">
        <div className="mb-10 text-center">
          <h1 className="font-serif text-4xl text-[#292722]">
            Welcome back
          </h1>

          <p className="mt-3 text-sm text-[#756f65]">
            Sign in to your Lucky&apos;s Collection account
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm text-[#292722]">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="w-full border border-[#d8d1c5] bg-white px-4 py-3 outline-none focus:border-[#b89b5e]"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-[#292722]">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="w-full border border-[#d8d1c5] bg-white px-4 py-3 outline-none focus:border-[#b89b5e]"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#292722] px-6 py-3 text-xs uppercase tracking-[0.2em] text-white transition hover:bg-[#b89b5e] disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="my-7 flex items-center gap-4">
          <div className="h-px flex-1 bg-[#ddd6ca]" />
          <span className="text-xs uppercase tracking-widest text-[#aaa39a]">
            or
          </span>
          <div className="h-px flex-1 bg-[#ddd6ca]" />
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full border border-[#d8d1c5] bg-white px-6 py-3 text-xs uppercase tracking-[0.2em] text-[#292722] transition hover:border-[#292722] disabled:opacity-50"
        >
          Continue with Google
        </button>

        <p className="mt-8 text-center text-sm text-[#756f65]">
          Don&apos;t have an account?{" "}
          <a
            href="/auth/signup"
            className="text-[#b89b5e] hover:underline"
          >
            Create one
          </a>
        </p>
      </div>
    </main>
  );
}