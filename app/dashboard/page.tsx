"use client";

import { useSession } from "@/lib/auth-client";
import { useEffect, useState, useMemo, useCallback } from "react";
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
import { Pencil, Trash2 } from "lucide-react";

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
  const [editOpen, setEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editUser, setEditUser] = useState<any | null>(null);
  const [editContact, setEditContact] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    firstName: "",
    surname: "",
    email: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    postcode: "",
    country: "",
  });
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");
  const [deleteUser, setDeleteUser] = useState<any | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

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
    if (session) {
      fetchUsers();
      fetchStats();
    }
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
      fetchStats();
    } catch (err: any) {
      setAddError(err?.message || "Failed to create user");
    } finally {
      setAddLoading(false);
    }
  }

  // Fetch contact details for edit
  const openEditModal = useCallback(async (user: any) => {
    setEditUser(user);
    setEditLoading(true);
    setEditError("");
    setEditSuccess("");
    setEditContact(null);
    setEditForm({
      firstName: user.name?.split(".")[0] || "",
      surname: user.name?.split(".")[1] || "",
      email: user.email,
      addressLine1: "",
      addressLine2: "",
      city: "",
      postcode: "",
      country: "",
    });
    try {
      const res = await fetch(`/api/contact-details/${user.id}`);
      const data = await res.json();
      if (data.contact) {
        setEditContact(data.contact);
        setEditForm((f) => ({ ...f, ...data.contact }));
      }
      setEditOpen(true);
    } catch (e) {
      setEditError("Failed to fetch contact details");
      setEditOpen(true);
    } finally {
      setEditLoading(false);
    }
  }, []);

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
              <TableHead className="w-20">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loadingUsers ? (
              <TableRow>
                <TableCell colSpan={5}>Loading...</TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>No users found.</TableCell>
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
                  <TableCell className="flex gap-2 items-center">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => openEditModal(user)}
                      title="Edit user"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setDeleteUser(user);
                        setDeleteOpen(true);
                      }}
                      title="Delete user"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
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
      {/* Edit User Modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="p-0 bg-transparent border-0 shadow-none flex items-center justify-center">
          <div className="w-full max-w-md space-y-6 rounded-lg bg-white p-8 shadow-2xl dark:bg-zinc-900">
            <DialogTitle asChild>
              <VisuallyHidden>Edit User</VisuallyHidden>
            </DialogTitle>
            <form className="space-y-6">
              <h2 className="text-2xl font-bold mb-4 text-center">Edit User</h2>
              <div className="space-y-2">
                <Label htmlFor="edit-firstname">First Name</Label>
                <Input
                  id="edit-firstname"
                  value={editForm.firstName}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, firstName: e.target.value }))
                  }
                  required
                  disabled={editLoading}
                  autoComplete="given-name"
                  className="w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-surname">Surname</Label>
                <Input
                  id="edit-surname"
                  value={editForm.surname}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, surname: e.target.value }))
                  }
                  required
                  disabled={editLoading}
                  autoComplete="family-name"
                  className="w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, email: e.target.value }))
                  }
                  required
                  disabled={editLoading}
                  autoComplete="email"
                  className="w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-address1">Address Line 1</Label>
                <Input
                  id="edit-address1"
                  value={editForm.addressLine1}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, addressLine1: e.target.value }))
                  }
                  disabled={editLoading}
                  className="w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-address2">Address Line 2</Label>
                <Input
                  id="edit-address2"
                  value={editForm.addressLine2}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, addressLine2: e.target.value }))
                  }
                  disabled={editLoading}
                  className="w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-city">City</Label>
                <Input
                  id="edit-city"
                  value={editForm.city}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, city: e.target.value }))
                  }
                  disabled={editLoading}
                  className="w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-postcode">Postcode</Label>
                <Input
                  id="edit-postcode"
                  value={editForm.postcode}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, postcode: e.target.value }))
                  }
                  disabled={editLoading}
                  className="w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-country">Country</Label>
                <select
                  id="edit-country"
                  value={editForm.country}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, country: e.target.value }))
                  }
                  disabled={editLoading}
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
              {editError && (
                <div className="text-red-600 text-sm">{editError}</div>
              )}
              {editSuccess && (
                <div className="text-green-600 text-sm">{editSuccess}</div>
              )}
              <div className="flex flex-col gap-2">
                <Button
                  type="submit"
                  disabled={editLoading}
                  className="w-full bg-primary text-primary-foreground rounded py-2 font-semibold hover:bg-primary/90 transition disabled:opacity-50"
                >
                  {editLoading ? "Saving..." : "Save"}
                </Button>
                <DialogClose asChild>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={editLoading}
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
      {/* Delete User Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogTitle>Delete User</DialogTitle>
          <div>Are you sure you want to delete this user?</div>
          <div className="flex gap-2 mt-4">
            <Button
              variant="destructive"
              onClick={async () => {
                if (!deleteUser) return;
                setDeleteOpen(false);
                await authClient.admin.removeUser({ userId: deleteUser.id });
                setPage(1);
                fetchUsers();
                fetchStats();
              }}
            >
              Delete
            </Button>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
