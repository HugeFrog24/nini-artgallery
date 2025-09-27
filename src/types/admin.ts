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

export interface ArtistUpdate {
  name: string;
  description: string;
  translations?: ArtistTranslations;
}

export interface ArtistData {
  name: string;
  description: string;
  defaultLanguage: string;
}

export interface ArtistTranslations {
  [locale: string]: {
    name: string;
    description: string;
  };
}

export interface ArtistProfileWithTranslations {
  name: string;
  description: string;
  defaultLanguage: string;
  translations: ArtistTranslations;
}