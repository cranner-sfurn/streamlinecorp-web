import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { user, contactDetails } from "@/db/schema/auth";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  const { userId } = await context.params;
  try {
    const userRes = await db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);
    const contact = await db
      .select()
      .from(contactDetails)
      .where(eq(contactDetails.id, userId))
      .limit(1);
    return NextResponse.json({
      user: userRes[0] ?? null,
      contact: contact[0] ?? null,
    });
  } catch (err) {
    return NextResponse.json(
      { error: (err as any)?.message || "Failed to fetch user" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  const { userId } = await context.params;
  try {
    const body = await request.json();
    const {
      id,
      name,
      email,
      role,
      firstName,
      surname,
      addressLine1,
      addressLine2,
      city,
      postcode,
      country,
      password, // not used here, but could be hashed and stored if needed
    } = body;
    // Create user
    await db.insert(user).values({
      id: id || userId,
      name,
      email,
      role,
      // add other fields as needed
    });
    // Create contact details
    await db.insert(contactDetails).values({
      id: id || userId,
      firstName,
      surname,
      addressLine1,
      addressLine2,
      city,
      postcode,
      country,
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: (err as any)?.message || "Failed to create user" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  const { userId } = await context.params;
  try {
    const body = await request.json();
    const {
      email,
      role,
      firstName,
      surname,
      addressLine1,
      addressLine2,
      city,
      postcode,
      country,
    } = body;
    // Update user
    await db
      .update(user)
      .set({
        ...(email && { email }),
        ...(role && { role }),
      })
      .where(eq(user.id, userId));
    // Update contact details (upsert)
    await db.delete(contactDetails).where(eq(contactDetails.id, userId));
    await db.insert(contactDetails).values({
      id: userId,
      firstName,
      surname,
      addressLine1,
      addressLine2,
      city,
      postcode,
      country,
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: (err as any)?.message || "Failed to update user" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  const { userId } = await context.params;
  try {
    await db.delete(user).where(eq(user.id, userId));
    await db.delete(contactDetails).where(eq(contactDetails.id, userId));
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: (err as any)?.message || "Failed to delete user" },
      { status: 500 }
    );
  }
}
