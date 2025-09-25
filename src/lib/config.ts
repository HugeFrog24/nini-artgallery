import { PersonalMessage } from '@/types/config';
import personalMessageData from '../../data/personal-message.json';
import tagsData from '../../data/tags.json';

// Type-safe configuration loaders
export const getPersonalMessage = (): PersonalMessage => {
  return personalMessageData as PersonalMessage;
};

export const getSiteKeywords = (): string[] => {
  return tagsData.siteKeywords;
};