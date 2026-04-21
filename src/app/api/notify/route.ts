import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

// Initialize Prisma client globally to prevent connection exhaustion in dev mode
const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * CHALLENGE: NOTIFICATION SYSTEM
 * 1. When a scan is "completed", create a record in the Notification table.
 * 2. Return a success status to the client.
 * 3. Handle potential errors gracefully.
 */

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { scanId, status, userId } = body;

    if (!scanId || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (status === "completed") {
      // REQUIREMENT: "Handle notification dispatch without blocking the scan upload response"
      // SOLUTION: Fire-and-forget async execution. We don't await this block.
      Promise.resolve().then(async () => {
        try {
          const patientId = userId || "Guest-Patient";
          await prisma.notification.create({
            data: {
              userId: "clinic-admin", // Hardcoded for demo: alert goes to the clinic
              title: "New Scan Completed",
              message: `Patient (${patientId}) has successfully uploaded a 5-angle diagnostic scan. Scan ID: ${scanId}.`,
              read: false,
            },
          });
          console.log(`[DB SUCCESS] Notification persisted for scan ${scanId}`);
        } catch (dbError) {
          console.error("[DB ERROR] Failed to create notification:", dbError);
        }
      });

      // Return immediately to the client so the UI doesn't hang waiting for the DB
      return NextResponse.json({ ok: true, message: "Upload successful, notification queued." });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Notification API Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}