"use client";

import { useSession } from "@/lib/auth-client";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { formatDistanceToNow } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DialogClose } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

const ALLOWED_ROLES = ["admin", "hr-manager"];
const ALL_ROLES = ["admin", "hr-manager", "user"];

export default function DashboardPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [userStats, setUserStats] = useState({ total: 0, hrManagers: 0 });
  const [loadingStats, setLoadingStats] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [loadingUsers, setLoadingUsers] = useState(true);
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
  const [addOpen, setAddOpen] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");
  const [addSuccess, setAddSuccess] = useState("");
  const [addForm, setAddForm] = useState({
    firstName: "",
    surname: "",
    email: "",
    password: "",
    roles: ["user"],
  });

  useEffect(() => {
    if (!isPending && session) {
      const userRoles = ((session.user as any)?.role || "")
        .split(",")
        .map((r: string) => r.trim());
      const hasAccess = userRoles.some((role: string) =>
        ALLOWED_ROLES.includes(role)
      );
      if (!hasAccess) {
        router.replace("/signin");
      }
    }
  }, [session, isPending, router]);

  useEffect(() => {
    async function fetchStats() {
      setLoadingStats(true);
      try {
        const result = await authClient.admin.listUsers({
          query: { limit: 10 },
        });
        const usersList =
          (result as any).data?.users || (result as any).users || [];
        const totalUsers =
          (result as any).data?.total ?? (result as any).total ?? 0;
        const hrManagers = usersList.filter((u: any) =>
          (u.role || "").split(",").includes("hr-manager")
        ).length;
        setUserStats({ total: totalUsers, hrManagers });
      } catch (e) {
        setUserStats({ total: 0, hrManagers: 0 });
      } finally {
        setLoadingStats(false);
      }
    }
    if (session) fetchStats();
  }, [session]);

  // Move fetchUsers to top-level so it can be called after user creation
  async function fetchUsers() {
    setLoadingUsers(true);
    try {
      const result = await authClient.admin.listUsers({
        query: { limit: pageSize, offset: (page - 1) * pageSize },
      });
      const usersList =
        (result as any).data?.users || (result as any).users || [];
      const total = (result as any).data?.total ?? (result as any).total ?? 0;
      setUsers(usersList);
      setTotalUsers(total);
    } catch (e) {
      setUsers([]);
      setTotalUsers(0);
    } finally {
      setLoadingUsers(false);
    }
  }

  useEffect(() => {
    if (session) fetchUsers();
  }, [session, page]);

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault();
    setAddLoading(true);
    setAddError("");
    setAddSuccess("");
    // Generate username as in signup
    const baseUsername = `${addForm.firstName
      .trim()
      .toLowerCase()}.${addForm.surname.trim().toLowerCase()}`.replace(
      /\s+/g,
      ""
    );
    let username = baseUsername;
    try {
      // Check username availability like signup
      const res = await fetch("/api/username-exists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: baseUsername }),
      });
      const data = await res.json();
      if (data?.username) {
        username = data.username;
      }
      await authClient.admin.createUser({
        name: username,
        email: addForm.email,
        password: addForm.password,
        role: addForm.roles.join(",") as any,
      });
      setAddSuccess("User created!");
      setAddForm({
        firstName: "",
        surname: "",
        email: "",
        password: "",
        roles: ["user"],
      });
      setTimeout(() => {
        setAddOpen(false);
        setAddSuccess("");
      }, 1000);
      setPage(1);
      // Refetch users immediately
      fetchUsers();
    } catch (err: any) {
      setAddError(err?.message || "Failed to create user");
    } finally {
      setAddLoading(false);
    }
  }

  if (isPending || !session) {
    return <div className="p-8">Loading...</div>;
  }

  const hasAccess = userRoles.some((role: string) =>
    ALLOWED_ROLES.includes(role)
  );
  if (!hasAccess) {
    return <div className="p-8 text-red-600">Access denied</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold">
              {loadingStats ? "..." : userStats.total}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>HR Managers</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-semibold">
              {loadingStats ? "..." : userStats.hrManagers}
            </span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Add User</CardTitle>
          </CardHeader>
          <CardContent>
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger asChild>
                <Button className="w-full" variant="default">
                  + Add User
                </Button>
              </DialogTrigger>
              <DialogContent className="p-0 bg-transparent border-0 shadow-none flex items-center justify-center">
                <div className="w-full max-w-md space-y-6 rounded-lg bg-white p-8 shadow-2xl dark:bg-zinc-900">
                  <DialogTitle asChild>
                    <VisuallyHidden>Add User</VisuallyHidden>
                  </DialogTitle>
                  <form onSubmit={handleAddUser} className="space-y-6">
                    <h2 className="text-2xl font-bold mb-4 text-center">
                      Add User
                    </h2>
                    <div className="space-y-2">
                      <Label htmlFor="add-firstname">First Name</Label>
                      <Input
                        id="add-firstname"
                        value={addForm.firstName}
                        onChange={(e) =>
                          setAddForm((f) => ({
                            ...f,
                            firstName: e.target.value,
                          }))
                        }
                        required
                        disabled={addLoading}
                        autoComplete="given-name"
                        className="w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="add-surname">Surname</Label>
                      <Input
                        id="add-surname"
                        value={addForm.surname}
                        onChange={(e) =>
                          setAddForm((f) => ({ ...f, surname: e.target.value }))
                        }
                        required
                        disabled={addLoading}
                        autoComplete="family-name"
                        className="w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="add-email">Email</Label>
                      <Input
                        id="add-email"
                        type="email"
                        value={addForm.email}
                        onChange={(e) =>
                          setAddForm((f) => ({ ...f, email: e.target.value }))
                        }
                        required
                        disabled={addLoading}
                        autoComplete="email"
                        className="w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="add-password">Password</Label>
                      <Input
                        id="add-password"
                        type="password"
                        value={addForm.password}
                        onChange={(e) =>
                          setAddForm((f) => ({
                            ...f,
                            password: e.target.value,
                          }))
                        }
                        required
                        minLength={8}
                        disabled={addLoading}
                        autoComplete="new-password"
                        className="w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Roles</Label>
                      <div className="flex flex-col gap-2">
                        {assignableRoles.map((role: string) => (
                          <label
                            key={role}
                            className="flex items-center gap-2 text-sm"
                          >
                            <Checkbox
                              checked={addForm.roles.includes(role)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setAddForm((f) => ({
                                    ...f,
                                    roles: [...f.roles, role],
                                  }));
                                } else {
                                  setAddForm((f) => ({
                                    ...f,
                                    roles: f.roles.filter(
                                      (r: string) => r !== role
                                    ),
                                  }));
                                }
                              }}
                              disabled={
                                addLoading ||
                                (!canAssignAdmin && role === "admin")
                              }
                              id={`role-${role}`}
                            />
                            <span>
                              {role.charAt(0).toUpperCase() + role.slice(1)}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                    {addError && (
                      <div className="text-red-600 text-sm">{addError}</div>
                    )}
                    {addSuccess && (
                      <div className="text-green-600 text-sm">{addSuccess}</div>
                    )}
                    <div className="flex flex-col gap-2">
                      <Button
                        type="submit"
                        disabled={addLoading}
                        className="w-full bg-primary text-primary-foreground rounded py-2 font-semibold hover:bg-primary/90 transition disabled:opacity-50"
                      >
                        {addLoading ? "Creating..." : "Create"}
                      </Button>
                      <DialogClose asChild>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={addLoading}
                          className="w-full"
                        >
                          Cancel
                        </Button>
                      </DialogClose>
                    </div>
                  </form>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
      <div className="bg-card rounded-lg shadow p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Registration Date</TableHead>
              <TableHead>Roles</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loadingUsers ? (
              <TableRow>
                <TableCell colSpan={4}>Loading...</TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4}>No users found.</TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.name || "-"}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="underline cursor-help">
                          {new Date(
                            user.createdAt || user.created_at
                          ).toLocaleDateString()}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        {formatDistanceToNow(
                          new Date(user.createdAt || user.created_at),
                          { addSuffix: true }
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    {(user.role || "")
                      .split(",")
                      .map((r: string) => r.trim())
                      .filter((r: string) => r && r !== "user")
                      .join(", ") || "-"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <div className="flex justify-between items-center mt-4">
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || loadingUsers}
          >
            Previous
          </Button>
          <span>
            Page {page} of {Math.max(1, Math.ceil(totalUsers / pageSize))}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage((p) => p + 1)}
            disabled={page * pageSize >= totalUsers || loadingUsers}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
