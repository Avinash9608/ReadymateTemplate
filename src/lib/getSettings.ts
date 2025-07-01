import SettingsModel from './settings';
import dbConnect from './firebase';

export async function getSettings() {
  await dbConnect();
  const settings = await SettingsModel.findOne();
  return {
    siteName: settings?.siteName || 'FurnishVerse',
    tagline: settings?.tagline || 'Your futuristic furniture destination.',
    logoLight: settings?.logoLight || '',
    logoDark: settings?.logoDark || '',
  };
} 