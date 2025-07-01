import { NextRequest, NextResponse } from 'next/server';
import SettingsModel from '@/lib/settings';
import dbConnect from '@/lib/firebase';

export async function GET() {
  await dbConnect();
  let settings = await SettingsModel.findOne();
  if (!settings) {
    // Return defaults if not set
    settings = await SettingsModel.create({
      siteName: 'FurnishVerse',
      siteUrl: 'http://localhost:9002',
      tagline: 'Your futuristic furniture destination.',
      theme: 'auto',
      logoLight: '',
      logoDark: '',
    });
  }
  return NextResponse.json({ success: true, settings });
}

export async function POST(req: NextRequest) {
  await dbConnect();
  const body = await req.json();
  const { siteName, tagline, logoLight, logoDark } = body;
  if (!siteName || !tagline) {
    return NextResponse.json({ success: false, error: 'Missing required fields.' }, { status: 400 });
  }
  let settings = await SettingsModel.findOne();
  if (!settings) {
    settings = await SettingsModel.create({ siteName, tagline, logoLight, logoDark });
  } else {
    settings.siteName = siteName;
    settings.tagline = tagline;
    settings.logoLight = logoLight;
    settings.logoDark = logoDark;
    await settings.save();
  }
  return NextResponse.json({ success: true, settings });
} 