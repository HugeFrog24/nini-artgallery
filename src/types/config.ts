export interface SiteConfig {
  siteName: string;
  siteDescription: string;
  siteSubheading: string;
  siteLongDescription: string;
  siteKeywords: string[];
  searchPlaceholder: string;
  noResultsMessage: string;
}

export interface PersonalMessage {
  enabled: boolean;
  recipient: string;
  message: string;
  dismissible: boolean;
  ariaLabel: string;
}