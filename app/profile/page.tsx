"use client";

import { useSession, updateUser } from "@/lib/auth-client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

const ALLOWED_ROLES = ["admin", "hr-manager"];

export default function ProfilePage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: "",
    surname: "",
    email: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    postcode: "",
    country: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [contactLoaded, setContactLoaded] = useState(false);

  const userRoles = ((session?.user as any)?.role || "")
    .split(",")
    .map((r: string) => r.trim());
  const isPrivileged = userRoles.some((role: string) =>
    ALLOWED_ROLES.includes(role)
  );

  useEffect(() => {
    if (!isPending && !session) {
      router.replace("/signin");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session) {
      setForm((f) => ({
        ...f,
        email: session.user.email ?? "",
      }));
      // Fetch unified user info
      fetch(`/api/users/${session.user.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.contact) {
            setForm((f) => ({ ...f, ...data.contact }));
          }
          if (data.user?.email) {
            setForm((f) => ({ ...f, email: data.user.email }));
          }
        })
        .catch(() => {})
        .finally(() => {
          setLoading(false);
          setContactLoaded(true);
        });
    }
  }, [session]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      // Only privileged users can update name/email
      let username = session?.user.name;
      if (isPrivileged) {
        const baseUsername = `${form.firstName
          .trim()
          .toLowerCase()}.${form.surname.trim().toLowerCase()}`.replace(
          /\s+/g,
          ""
        );
        username = baseUsername;
        if (username !== session?.user.name) {
          const res = await fetch("/api/username-exists", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: baseUsername }),
          });
          const data = await res.json();
          if (data?.username) {
            username = data.username;
          }
        }
      }
      // Unified PATCH to update user and contact details
      const resp = await fetch(`/api/users/${session?.user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: isPrivileged ? username : undefined,
          email: isPrivileged ? form.email : undefined,
          firstName: form.firstName,
          surname: form.surname,
          addressLine1: form.addressLine1,
          addressLine2: form.addressLine2,
          city: form.city,
          postcode: form.postcode,
          country: form.country,
        }),
      });
      if (!resp.ok) {
        const errData = await resp.json();
        throw new Error(errData?.error || "Failed to update profile");
      }
      setSuccess("Profile updated!");
    } catch (err: any) {
      setError(err?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  }

  if (isPending || !session || loading) {
    return (
      <div className="p-8 flex flex-col gap-4">
        <Skeleton className="h-10 w-1/3 mb-4" />
        <div className="w-full max-w-md mx-auto">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-6 w-full mb-2" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">My Profile</h1>
      <Card>
        <CardHeader>
          <CardTitle>Profile Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={form.firstName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, firstName: e.target.value }))
                }
                disabled={!isPrivileged}
                className={!isPrivileged ? "opacity-60 cursor-not-allowed" : ""}
                required
                autoComplete="given-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="surname">Surname</Label>
              <Input
                id="surname"
                value={form.surname}
                onChange={(e) =>
                  setForm((f) => ({ ...f, surname: e.target.value }))
                }
                disabled={!isPrivileged}
                className={!isPrivileged ? "opacity-60 cursor-not-allowed" : ""}
                required
                autoComplete="family-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
                disabled={!isPrivileged}
                className={!isPrivileged ? "opacity-60 cursor-not-allowed" : ""}
                required
                autoComplete="email"
              />
            </div>
            {/* No roles for regular users */}
            {isPrivileged && (
              <div className="space-y-2">
                <Label>Roles</Label>
                <div className="opacity-60 cursor-not-allowed">
                  {(session.user.role || "user")
                    .split(",")
                    .map((r: string) => r.trim())
                    .join(", ")}
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="addressLine1">Address Line 1</Label>
              <Input
                id="addressLine1"
                value={form.addressLine1}
                onChange={(e) =>
                  setForm((f) => ({ ...f, addressLine1: e.target.value }))
                }
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="addressLine2">Address Line 2</Label>
              <Input
                id="addressLine2"
                value={form.addressLine2}
                onChange={(e) =>
                  setForm((f) => ({ ...f, addressLine2: e.target.value }))
                }
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={form.city}
                onChange={(e) =>
                  setForm((f) => ({ ...f, city: e.target.value }))
                }
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postcode">Postcode</Label>
              <Input
                id="postcode"
                value={form.postcode}
                onChange={(e) =>
                  setForm((f) => ({ ...f, postcode: e.target.value }))
                }
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <select
                id="country"
                value={form.country}
                onChange={(e) =>
                  setForm((f) => ({ ...f, country: e.target.value }))
                }
                disabled={loading}
                className="w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select country</option>
                <option value="GB">United Kingdom</option>
                <option value="US">United States</option>
                <option value="CA">Canada</option>
                <option value="AU">Australia</option>
                <option value="IN">India</option>
                {/* Add more countries as needed */}
              </select>
            </div>
            {error && <div className="text-red-600 text-sm">{error}</div>}
            {success && <div className="text-green-600 text-sm">{success}</div>}
            <div className="flex flex-col gap-2 mt-4">
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      {/* Future extensible sections: pay, compensation, etc. */}
    </div>
  );
}
