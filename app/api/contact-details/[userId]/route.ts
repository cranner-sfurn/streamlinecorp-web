import { db } from "@/lib/db";
import { contactDetails } from "@/db/schema/auth";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

// GET: fetch contact details for a user
export async function GET(
  request: Request,
  context: { params: { userId: string } }
) {
  const { userId } = context.params || {};
  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }
  try {
    const details = await db
      .select()
      .from(contactDetails)
      .where(eq(contactDetails.userId, userId))
      .limit(1);
    if (!details.length) {
      return NextResponse.json({ contact: null });
    }
    return NextResponse.json({ contact: details[0] });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch contact details" },
      { status: 500 }
    );
  }
}

// POST: create or update contact details for a user
export async function POST(
  request: Request,
  context: { params: { userId: string } }
) {
  const { userId } = context.params || {};
  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }
  try {
    const body = await request.json();
    const { addressLine1, addressLine2, city, postcode, country } = body;
    // Upsert logic: delete old, insert new (for simplicity)
    await db.delete(contactDetails).where(eq(contactDetails.userId, userId));
    const id = `${userId}-contact`;
    await db.insert(contactDetails).values({
      id,
      userId,
      addressLine1,
      addressLine2,
      city,
      postcode,
      country,
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to update contact details" },
      { status: 500 }
    );
  }
}
