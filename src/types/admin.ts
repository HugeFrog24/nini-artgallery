export interface OTPSession {
  email: string;
  otp: string;
  expiresAt: number;
  attempts: number;
}

export interface AdminSession {
  email: string;
  issuedAt: number;
  expiresAt: number;
}

export interface OTPRequest {
  email: string;
}

export interface OTPVerification {
  email: string;
  otp: string;
}

export interface AdminAuthResponse {
  success: boolean;
  message: string;
  token?: string;
}

export interface PersonalMessageUpdate {
  enabled: boolean;
  recipient: string;
  message: string;
  dismissible: boolean;
}