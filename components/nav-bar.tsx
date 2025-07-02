"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useSession, signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { ModeToggle } from "@/components/mode-toggle";

export function NavBar() {
  const { data: session, isPending } = useSession();
  const userName = session?.user?.name;
  const router = useRouter();

  const userRoles = ((session?.user as any)?.role || "")
    .split(",")
    .map((r: string) => r.trim());
  const showDashboard =
    userRoles.includes("admin") || userRoles.includes("hr-manager");

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <nav className="w-full flex items-center justify-between py-2 px-8 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <Link href="/">
          <span className="font-bold text-lg">StreamlineCorp</span>
        </Link>
      </div>
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost">
          <Link href="/">Home</Link>
        </Button>
        {showDashboard && (
          <Button asChild variant="ghost">
            <Link href="/dashboard">Dashboard</Link>
          </Button>
        )}
        {isPending ? null : userName ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost">{userName}</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href="/profile">Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSignOut}>
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <>
            <Button asChild variant="ghost">
              <Link href="/signin">Sign In</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/signup">Sign Up</Link>
            </Button>
          </>
        )}
        <div className="ml-4">
          <ModeToggle />
        </div>
        {/* Example dropdown for future user menu */}
        {/*
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">Menu</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuItem>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        */}
      </div>
    </nav>
  );
}
