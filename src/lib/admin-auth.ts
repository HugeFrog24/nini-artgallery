import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { OTPSession, AdminSession } from "@/types/admin";
import { getEmailTranslations, getLocalizedSiteName } from "./admin-i18n";

// In-memory storage for OTP sessions (in production, use Redis or database)
const otpSessions = new Map<string, OTPSession>();

// Rate limiting storage (email -> { count, resetTime })
const rateLimits = new Map<string, { count: number; resetTime: number }>();

// Check if admin is properly configured
export function isAdminConfigured(): boolean {
  const required = [
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_USER",
    "SMTP_PASS",
    "SMTP_SECURE",
    "SMTP_REQUIRE_TLS",
    "ADMIN_EMAIL",
    "JWT_SECRET",
  ];
  return required.every((key) => process.env[key]);
}

// Get missing environment variables
export function getMissingEnvVars(): string[] {
  const required = [
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_USER",
    "SMTP_PASS",
    "SMTP_SECURE",
    "SMTP_REQUIRE_TLS",
    "ADMIN_EMAIL",
    "JWT_SECRET",
  ];
  return required.filter((key) => !process.env[key]);
}

// Configuration from environment variables
const SMTP_CONFIG = {
  host: process.env.SMTP_HOST!,
  port: parseInt(process.env.SMTP_PORT!),
  secure: process.env.SMTP_SECURE! === "true", // SSL/TLS from start (port 465)
  requireTLS: process.env.SMTP_REQUIRE_TLS! === "true", // Force STARTTLS upgrade
  auth: {
    user: process.env.SMTP_USER!,
    pass: process.env.SMTP_PASS!,
  },
};

const ADMIN_EMAIL = process.env.ADMIN_EMAIL!;
const JWT_SECRET = process.env.JWT_SECRET!;

// Create nodemailer transporter
const transporter = nodemailer.createTransport(SMTP_CONFIG);

// Generate 6-digit OTP
export function generateOTP(): string {
  return crypto.randomInt(100000, 999999).toString();
}

// Check rate limiting (max 3 OTP requests per 15 minutes per email)
export function checkRateLimit(email: string): boolean {
  const now = Date.now();
  const limit = rateLimits.get(email);

  if (!limit || now > limit.resetTime) {
    // Reset or create new limit
    rateLimits.set(email, { count: 1, resetTime: now + 15 * 60 * 1000 }); // 15 minutes
    return true;
  }

  if (limit.count >= 3) {
    return false; // Rate limited
  }

  limit.count++;
  return true;
}

// Send OTP email
export async function sendOTPEmail(
  email: string,
  otp: string,
  locale: string,
): Promise<boolean> {
  try {
    const emailTranslations = await getEmailTranslations(locale);
    const localizedSiteName = await getLocalizedSiteName(locale);

    const mailOptions = {
      from: `${localizedSiteName} <${SMTP_CONFIG.auth.user}>`,
      to: email,
      subject: emailTranslations.subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">${emailTranslations.title}</h2>
          <p>${emailTranslations.codeMessage}</p>
          <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #ec4899;">${otp}</span>
          </div>
          <p>${emailTranslations.expiryMessage}</p>
          <p>${emailTranslations.ignoreMessage}</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">${emailTranslations.automatedMessage.replace("{siteName}", localizedSiteName)}</p>
        </div>
      `,
      text: emailTranslations.textVersion.replace("{otp}", otp),
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Failed to send OTP email:", error);
    return false;
  }
}

// Store OTP session
export function storeOTPSession(email: string, otp: string): void {
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
  otpSessions.set(email, {
    email,
    otp,
    expiresAt,
    attempts: 0,
  });
}

// Verify OTP
export function verifyOTP(email: string, providedOTP: string): boolean {
  const session = otpSessions.get(email);

  if (!session) {
    return false; // No session found
  }

  if (Date.now() > session.expiresAt) {
    otpSessions.delete(email);
    return false; // Expired
  }

  session.attempts++;

  if (session.attempts > 3) {
    otpSessions.delete(email);
    return false; // Too many attempts
  }

  if (session.otp === providedOTP) {
    otpSessions.delete(email); // Clean up successful session
    return true;
  }

  return false; // Wrong OTP
}

// Generate JWT token for admin session
export function generateAdminToken(email: string): string {
  const payload: AdminSession = {
    email,
    issuedAt: Date.now(),
    expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });
}

// Verify JWT token
export function verifyAdminToken(token: string): AdminSession | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;

    // Validate the decoded token structure
    if (!decoded.email || !decoded.issuedAt || !decoded.expiresAt) {
      return null;
    }

    const adminSession: AdminSession = {
      email: decoded.email,
      issuedAt: decoded.issuedAt,
      expiresAt: decoded.expiresAt,
    };

    // Check if token is expired
    if (Date.now() > adminSession.expiresAt) {
      return null;
    }

    // Check if email is authorized
    if (adminSession.email !== ADMIN_EMAIL) {
      return null;
    }

    return adminSession;
  } catch {
    return null;
  }
}

// Check if email is authorized for admin access
export function isAuthorizedEmail(email: string): boolean {
  return email === ADMIN_EMAIL;
}

// Clean up expired sessions (call periodically)
function cleanupExpiredSessions(): void {
  const now = Date.now();

  // Clean up OTP sessions
  for (const [email, session] of otpSessions.entries()) {
    if (now > session.expiresAt) {
      otpSessions.delete(email);
    }
  }

  // Clean up rate limits
  for (const [email, limit] of rateLimits.entries()) {
    if (now > limit.resetTime) {
      rateLimits.delete(email);
    }
  }
}

// Initialize cleanup interval (run every 5 minutes)
if (typeof window === "undefined") {
  setInterval(cleanupExpiredSessions, 5 * 60 * 1000);
}
