"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession, updateUser, authClient } from "@/lib/auth-client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";

const ALLOWED_ROLES = ["admin", "hr-manager"];
const ALL_ROLES = ["admin", "hr-manager", "user"];

export default function UserDetailsPage() {
  const { userId: rawUserId } = useParams();
  const userId = Array.isArray(rawUserId) ? rawUserId[0] : rawUserId;
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [user, setUser] = useState<any | null>(null);
  const [contact, setContact] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    firstName: "",
    surname: "",
    email: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    postcode: "",
    country: "",
    roles: ["user"],
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const userRoles = useMemo<string[]>(
    () =>
      ((session?.user as any)?.role || "")
        .split(",")
        .map((r: string) => r.trim()),
    [session]
  );
  const canAssignAdmin = userRoles.includes("admin");
  const assignableRoles = ALL_ROLES.filter(
    (r: string) => canAssignAdmin || r !== "admin"
  );

  useEffect(() => {
    if (!isPending && session) {
      const hasAccess = userRoles.some((role: string) =>
        ALLOWED_ROLES.includes(role)
      );
      if (!hasAccess) {
        router.replace("/");
      }
    }
  }, [session, isPending, router, userRoles]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError("");
      try {
        // Fetch user and contact details from unified API
        const res = await fetch(`/api/users/${userId}`);
        const data = await res.json();
        if (!data.user) throw new Error("User not found");
        setUser(data.user);
        setContact(data.contact);
        setForm((f) => ({
          ...f,
          email: data.user.email,
          roles: (data.user.role || "user")
            .split(",")
            .map((r: string) => r.trim()),
          ...(data.contact || {}),
        }));
      } catch (e: any) {
        setError("Failed to fetch user details");
      } finally {
        setLoading(false);
      }
    }
    if (userId) fetchData();
  }, [userId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError("");
    setSuccess("");
    setLoading(true);
    // Generate username as in signup
    const baseUsername = `${form.firstName.trim().toLowerCase()}.${form.surname
      .trim()
      .toLowerCase()}`.replace(/\s+/g, "");
    let username = baseUsername;
    try {
      if (username !== user.name) {
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
      // PATCH unified API with all details
      await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          role: form.roles.join(","),
          firstName: form.firstName,
          surname: form.surname,
          addressLine1: form.addressLine1,
          addressLine2: form.addressLine2,
          city: form.city,
          postcode: form.postcode,
          country: form.country,
          name: username,
        }),
      });
      setSuccess("User updated!");
    } catch (err: any) {
      setError(err?.message || "Failed to update user");
    } finally {
      setLoading(false);
    }
  }

  if (isPending || !session || loading) {
    return (
      <div className="p-8 flex flex-col gap-4">
        <Skeleton className="h-10 w-1/3 mb-4" />
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-xl mx-auto">
      <Button
        variant="outline"
        onClick={() => router.push("/dashboard")}
        className="mb-6"
      >
        &larr; Go Back
      </Button>
      <h1 className="text-2xl font-bold mb-4">Edit User</h1>
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="edit-firstname">First Name</Label>
          <Input
            id="edit-firstname"
            value={form.firstName}
            onChange={(e) =>
              setForm((f) => ({ ...f, firstName: e.target.value }))
            }
            required
            autoComplete="given-name"
            className="w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-surname">Surname</Label>
          <Input
            id="edit-surname"
            value={form.surname}
            onChange={(e) =>
              setForm((f) => ({ ...f, surname: e.target.value }))
            }
            required
            autoComplete="family-name"
            className="w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-email">Email</Label>
          <Input
            id="edit-email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            required
            autoComplete="email"
            className="w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="space-y-2">
          <Label>Roles</Label>
          <div className="flex flex-col gap-2">
            {assignableRoles.map((role: string) => (
              <label key={role} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={form.roles.includes(role)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setForm((f) => ({ ...f, roles: [...f.roles, role] }));
                    } else {
                      setForm((f) => ({
                        ...f,
                        roles: f.roles.filter((r: string) => r !== role),
                      }));
                    }
                  }}
                  disabled={!canAssignAdmin && role === "admin"}
                  id={`edit-role-${role}`}
                />
                <span>{role.charAt(0).toUpperCase() + role.slice(1)}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-address1">Address Line 1</Label>
          <Input
            id="edit-address1"
            value={form.addressLine1}
            onChange={(e) =>
              setForm((f) => ({ ...f, addressLine1: e.target.value }))
            }
            className="w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-address2">Address Line 2</Label>
          <Input
            id="edit-address2"
            value={form.addressLine2}
            onChange={(e) =>
              setForm((f) => ({ ...f, addressLine2: e.target.value }))
            }
            className="w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-city">City</Label>
          <Input
            id="edit-city"
            value={form.city}
            onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
            className="w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-postcode">Postcode</Label>
          <Input
            id="edit-postcode"
            value={form.postcode}
            onChange={(e) =>
              setForm((f) => ({ ...f, postcode: e.target.value }))
            }
            className="w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-country">Country</Label>
          <select
            id="edit-country"
            value={form.country}
            onChange={(e) =>
              setForm((f) => ({ ...f, country: e.target.value }))
            }
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
        <Button
          type="submit"
          className="w-full bg-primary text-primary-foreground rounded py-2 font-semibold hover:bg-primary/90 transition disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Saving..." : "Save"}
        </Button>
      </form>
    </div>
  );
}
