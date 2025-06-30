import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { NextResponse } from "next/server";
import { headers } from "next/headers";

export const { POST, GET } = toNextJsHandler(auth);

// PATCH /api/auth/[userId] to update user role
export async function PATCH(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.pathname.split("/").pop();
    const { role } = await request.json();
    if (!userId || !role) {
      return NextResponse.json(
        { error: "userId and role are required" },
        { status: 400 }
      );
    }
    // Use Better Auth admin setRole
    const reqHeaders = await headers();
    const headersObj: Record<string, string> = {};
    reqHeaders.forEach((value, key) => {
      headersObj[key] = value;
    });
    const updatedUser = await auth.api.setRole({
      body: { userId, role },
      headers: headersObj,
    });
    return NextResponse.json({ user: updatedUser });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: (err as any)?.message || "Failed to update user role" },
      { status: 500 }
    );
  }
}
