import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  isAdminConfigured,
  getMissingEnvVars,
  isAuthorizedEmail,
  checkRateLimit,
  generateOTP,
  sendOTPEmail,
  storeOTPSession,
} from "@/lib/admin-auth";
import { OTPRequest } from "@/types/admin";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    // Check if admin is properly configured
    if (!isAdminConfigured()) {
      const missing = getMissingEnvVars();
      console.error(
        "Admin login not configured. Missing environment variables:",
        missing,
      );
      return NextResponse.json(
        {
          success: false,
          message:
            "Admin login is not configured. Please check server configuration.",
        },
        { status: 503 },
      );
    }

    const body: OTPRequest = await request.json();
    const { email } = body;

    // Validate input
    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { success: false, message: "Valid email is required" },
        { status: 400 },
      );
    }

    // Check if email is authorized for admin access
    if (!isAuthorizedEmail(email)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized email address" },
        { status: 403 },
      );
    }

    // Check rate limiting
    if (!checkRateLimit(email)) {
      return NextResponse.json(
        {
          success: false,
          message: "Too many requests. Please try again in 15 minutes.",
        },
        { status: 429 },
      );
    }

    // Generate OTP
    const otp = generateOTP();

    // Get locale from cookies for localized email
    const cookieStore = await cookies();
    const locale = cookieStore.get("locale")?.value || "en";

    // Send OTP email
    const emailSent = await sendOTPEmail(email, otp, locale);

    if (!emailSent) {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to send verification email. Please try again.",
        },
        { status: 500 },
      );
    }

    // Store OTP session
    storeOTPSession(email, otp);

    return NextResponse.json({
      success: true,
      message: "Verification code sent to your email address",
    });
  } catch (error) {
    console.error("OTP request error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
