import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { contactDetails } from "@/db/schema/auth";
import { eq } from "drizzle-orm";

// GET: fetch contact details for a user
export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const userId = params.userId;
  const details = await db
    .select()
    .from(contactDetails)
    .where(eq(contactDetails.userId, userId))
    .limit(1);
  if (!details.length) {
    return NextResponse.json({ contact: null });
  }
  return NextResponse.json({ contact: details[0] });
}

// POST: create or update contact details for a user
export async function POST(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const userId = params.userId;
  const body = await req.json();
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
}
