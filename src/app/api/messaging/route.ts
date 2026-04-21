import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

// Prevent Prisma connection exhaustion in development
const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * CHALLENGE: MESSAGING SYSTEM
 * 1. Implement the POST handler to save a new message into a Thread.
 * 2. Implement the GET handler to retrieve message history for a given thread.
 * 3. Focus on data integrity and proper relations.
 */

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  // We accept patientId as a fallback to dynamically find the thread for the UI
  const threadId = searchParams.get("threadId");
  const patientId = searchParams.get("patientId");

  try {
    let targetThreadId = threadId;

    // Auto-resolve threadId from patientId if this is the first load
    if (!targetThreadId && patientId) {
      const thread = await prisma.thread.findFirst({ where: { patientId } });
      targetThreadId = thread?.id || null;
    }

    if (!targetThreadId) {
      return NextResponse.json({ messages: [] }); // No thread exists yet
    }

    const messages = await prisma.message.findMany({
      where: { threadId: targetThreadId },
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Messaging API GET Error:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { threadId, patientId, content, sender } = body;

    if (!content) {
      return NextResponse.json({ error: "Missing message content" }, { status: 400 });
    }

    let targetThreadId = threadId;

    // Robust relational check: Create the thread if it doesn't exist 
    if (!targetThreadId) {
      const fallbackPatient = patientId || "guest-patient";
      let thread = await prisma.thread.findFirst({ where: { patientId: fallbackPatient } });
      
      if (!thread) {
        thread = await prisma.thread.create({ data: { patientId: fallbackPatient } });
      }
      targetThreadId = thread.id;
    }

    // Save message to database with confirmed relation 
    const newMessage = await prisma.message.create({
      data: {
        threadId: targetThreadId,
        content,
        sender: sender || "patient",
      }
    });

    console.log(`[DB SUCCESS] New message in thread ${targetThreadId}: ${content}`);

    return NextResponse.json({ ok: true, message: newMessage });
  } catch (err) {
    console.error("Messaging API POST Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}