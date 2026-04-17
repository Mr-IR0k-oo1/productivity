import { NextRequest, NextResponse } from "next/server";

import { createUser, loginUser, logoutSession } from "@/src/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, email, password, fullName, workspaceName } = body;

    if (action === "register") {
      if (!email || !password || !fullName || !workspaceName) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }

      const session = await createUser(email, password, fullName, workspaceName);
      return NextResponse.json({ data: session }, { status: 201 });
    }

    if (action === "login") {
      if (!email || !password) {
        return NextResponse.json({ error: "Email and password required" }, { status: 400 });
      }

      const session = await loginUser(email, password);
      return NextResponse.json({ data: session });
    }

    if (action === "logout") {
      const authHeader = request.headers.get("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.slice(7).trim();
        await logoutSession(token);
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("POST /api/auth error:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}