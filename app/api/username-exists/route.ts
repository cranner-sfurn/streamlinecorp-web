import { db } from "@/lib/db";
import { user } from "@/db/schema/auth";
import { eq, like } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { username } = await req.json();
  if (!username) {
    return NextResponse.json(
      { error: "Username is required" },
      { status: 400 }
    );
  }
  // Find all users with name like 'username%'
  const users = await db
    .select()
    .from(user)
    .where(like(user.name, `${username}%`));
  const existingNames = users.map((u) => u.name);

  // If username is not taken, return it
  if (!existingNames.includes(username)) {
    return NextResponse.json({ username });
  }
  // Find the next available username (skip 0, start from 1)
  let i = 1;
  let nextUsername = `${username}${i}`;
  while (existingNames.includes(nextUsername)) {
    i++;
    nextUsername = `${username}${i}`;
  }
  return NextResponse.json({ username: nextUsername });
}
