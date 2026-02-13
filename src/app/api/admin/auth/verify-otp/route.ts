import { NextRequest, NextResponse } from "next/server";
import {
  verifyOTP,
  generateAdminToken,
  isAuthorizedEmail,
} from "@/lib/admin-auth";
import { OTPVerification } from "@/types/admin";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body: OTPVerification = await request.json();
    const { email, otp } = body;

    // Validate input
    if (
      !email ||
      typeof email !== "string" ||
      !otp ||
      typeof otp !== "string"
    ) {
      return NextResponse.json(
        { success: false, message: "Email and OTP are required" },
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

    // Verify OTP
    const isValidOTP = verifyOTP(email, otp);

    if (!isValidOTP) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired verification code" },
        { status: 401 },
      );
    }

    // Generate admin session token
    const token = generateAdminToken(email);

    // Set secure HTTP-only cookie
    const response = NextResponse.json({
      success: true,
      message: "Authentication successful",
      token,
    });

    // Set cookie with security flags
    response.cookies.set("admin-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60, // 24 hours in seconds
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("OTP verification error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
