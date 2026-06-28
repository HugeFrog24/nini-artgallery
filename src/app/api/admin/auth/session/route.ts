import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const cookieToken = request.cookies.get("admin-token")?.value;

    if (!cookieToken) {
      return NextResponse.json({
        authenticated: false,
      });
    }

    const session = verifyAdminToken(cookieToken);

    if (!session) {
      return NextResponse.json({
        authenticated: false,
      });
    }

    return NextResponse.json({
      authenticated: true,
      email: session.email,
    });
  } catch {
    return NextResponse.json({
      authenticated: false,
    });
  }
}
