import { NextResponse } from "next/server";
import { isAdminConfigured, getMissingEnvVars } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function GET() {
  try {
    const configured = isAdminConfigured();

    if (!configured) {
      const missing = getMissingEnvVars();
      console.warn(
        "Admin not configured. Missing environment variables:",
        missing,
      );
    }

    return NextResponse.json({
      configured,
      message: configured
        ? "Admin is properly configured"
        : "Admin login requires environment configuration",
    });
  } catch (error) {
    console.error("Config check error:", error);
    return NextResponse.json(
      { configured: false, message: "Configuration check failed" },
      { status: 500 },
    );
  }
}
