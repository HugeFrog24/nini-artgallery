import { SiteConfig, ArtistProfile, PersonalMessage } from '@/types/config';
import siteConfigData from '../../data/site-config.json';
import artistProfileData from '../../data/artist-profile.json';
import personalMessageData from '../../data/personal-message.json';

// Type-safe configuration loaders
export const getSiteConfig = (): SiteConfig => {
  return siteConfigData as SiteConfig;
};

export const getArtistProfile = (): ArtistProfile => {
  return artistProfileData as ArtistProfile;
};

export const getPersonalMessage = (): PersonalMessage => {
  return personalMessageData as PersonalMessage;
};