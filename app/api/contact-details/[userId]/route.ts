import { db } from "@/lib/db";
import { contactDetails } from "@/db/schema/auth";
import { eq } from "drizzle-orm";
import { NextResponse, NextRequest } from "next/server";

function getUserIdFromRequest(request: NextRequest): string | null {
  const url = new URL(request.url);
  const parts = url.pathname.split("/");
  return parts.at(-1) || null;
}

export async function GET(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  try {
    const details = await db
      .select()
      .from(contactDetails)
      .where(eq(contactDetails.userId, userId))
      .limit(1);

    return NextResponse.json({ contact: details[0] ?? null });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch contact details" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { addressLine1, addressLine2, city, postcode, country } = body;

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
