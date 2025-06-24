"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export default function Signup() {
  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);
    // Generate username
    const baseUsername = `${firstName.trim().toLowerCase()}.${surname
      .trim()
      .toLowerCase()}`.replace(/\s+/g, "");
    let username = baseUsername;
    try {
      // Get available username from API
      const res = await fetch("/api/username-exists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: baseUsername }),
      });
      const data = await res.json();
      if (data?.username) {
        username = data.username;
      }
      // Sign up
      const { error } = await authClient.signUp.email(
        {
          email,
          password,
          name: username,
          callbackURL: "/",
        },
        {
          onRequest: () => setLoading(true),
          onSuccess: () => {
            setSuccess(true);
            setLoading(false);
            router.push("/");
          },
          onError: (ctx) => {
            setError(ctx.error?.message || "Something went wrong");
            setLoading(false);
          },
        }
      );
      if (error) {
        setError(error.message || "Something went wrong");
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <form
        onSubmit={handleSignup}
        className="w-full max-w-md space-y-6 rounded-lg bg-white p-8 shadow-2xl dark:bg-zinc-900"
      >
        <h2 className="text-2xl font-bold mb-4 text-center">Sign Up</h2>
        <div className="space-y-2">
          <label className="block text-sm font-medium">First Name</label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            className="w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            autoComplete="given-name"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium">Surname</label>
          <input
            type="text"
            value={surname}
            onChange={(e) => setSurname(e.target.value)}
            required
            className="w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            autoComplete="family-name"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            autoComplete="email"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            autoComplete="new-password"
          />
        </div>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        {success && (
          <div className="text-green-600 text-sm">
            Account created successfully.
          </div>
        )}
        <button
          type="submit"
          className="w-full bg-primary text-primary-foreground rounded py-2 font-semibold hover:bg-primary/90 transition disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Signing up..." : "Sign Up"}
        </button>
      </form>
    </div>
  );
}
