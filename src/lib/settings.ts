import mongoose, { Schema, model, models } from 'mongoose';

export interface ISettings {
  siteName: string;
  siteUrl: string;
  tagline: string;
  theme: 'light' | 'dark' | 'auto';
  logoLight: string; // Cloudinary URL or file path
  logoDark: string;  // Cloudinary URL or file path
}

const SettingsSchema = new Schema<ISettings>({
  siteName: { type: String, required: true },
  siteUrl: { type: String, required: true },
  tagline: { type: String, required: true },
  theme: { type: String, enum: ['light', 'dark', 'auto'], default: 'auto' },
  logoLight: { type: String, default: '' },
  logoDark: { type: String, default: '' },
});

const SettingsModel = models.Settings || model<ISettings>('Settings', SettingsSchema);

export default SettingsModel; 