import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/admin-auth";
import { PersonalMessageUpdate } from "@/types/admin";
import { promises as fs } from "fs";
import { getTenantIdFromRequest, tenantDataPath } from "@/lib/tenant";

export const runtime = "nodejs";

// Helper function to verify admin authentication
function getAdminSession(request: NextRequest) {
  // Try to get token from cookie first, then from Authorization header
  const cookieToken = request.cookies.get("admin-token")?.value;
  const authHeader = request.headers.get("authorization");
  const headerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  const token = cookieToken || headerToken;

  console.log("Auth debug:", {
    hasCookie: !!cookieToken,
    hasHeader: !!headerToken,
    hasToken: !!token,
    cookieValue: cookieToken ? "present" : "missing",
  });

  if (!token) {
    console.log("No token found");
    return null;
  }

  try {
    const result = verifyAdminToken(token);
    console.log("Token verification result:", result ? "valid" : "invalid");
    return result;
  } catch (error) {
    console.error("Token verification error:", error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const adminSession = getAdminSession(request);
    if (!adminSession) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    // Resolve tenant
    const tenantId = await getTenantIdFromRequest(request);
    if (!tenantId) {
      return NextResponse.json(
        { success: false, message: "Unknown tenant" },
        { status: 404 },
      );
    }

    // Read current personal message
    const filePath = tenantDataPath(tenantId, "personal-message.json");
    const fileContent = await fs.readFile(filePath, "utf-8");
    const personalMessage = JSON.parse(fileContent);

    return NextResponse.json({
      success: true,
      data: personalMessage,
    });
  } catch (error) {
    console.error("Error reading personal message:", error);
    return NextResponse.json(
      { success: false, message: "Failed to read personal message" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Verify admin authentication
    const adminSession = getAdminSession(request);
    if (!adminSession) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    // Resolve tenant
    const tenantId = await getTenantIdFromRequest(request);
    if (!tenantId) {
      return NextResponse.json(
        { success: false, message: "Unknown tenant" },
        { status: 404 },
      );
    }

    const body: PersonalMessageUpdate = await request.json();
    const { enabled, recipient, message, dismissible } = body;

    // Validate input
    if (
      typeof enabled !== "boolean" ||
      typeof recipient !== "string" ||
      typeof message !== "string" ||
      typeof dismissible !== "boolean"
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid input data" },
        { status: 400 },
      );
    }

    // Validate string lengths
    if (recipient.length > 100) {
      return NextResponse.json(
        {
          success: false,
          message: "Recipient name too long (max 100 characters)",
        },
        { status: 400 },
      );
    }

    if (message.length > 2000) {
      return NextResponse.json(
        { success: false, message: "Message too long (max 2000 characters)" },
        { status: 400 },
      );
    }

    // Create updated personal message object
    const updatedMessage = {
      enabled,
      recipient: recipient.trim(),
      message: message.trim(),
      dismissible,
      ariaLabel: `Personal message for ${recipient.trim()}`,
    };

    // Write to tenant-scoped file
    const filePath = tenantDataPath(tenantId, "personal-message.json");
    await fs.writeFile(
      filePath,
      JSON.stringify(updatedMessage, null, 2),
      "utf-8",
    );

    return NextResponse.json({
      success: true,
      message: "Personal message updated successfully",
      data: updatedMessage,
    });
  } catch (error) {
    console.error("Error updating personal message:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update personal message" },
      { status: 500 },
    );
  }
}
