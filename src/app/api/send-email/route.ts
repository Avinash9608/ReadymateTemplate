import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Validate environment variables at startup
const getEmailConfig = () => {
  const host = process.env.EMAIL_HOST;
  const port = process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT) : 587;
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!host || !user || !pass) {
    throw new Error('Missing email configuration in environment variables');
  }

  return { host, port, user, pass };
};

export async function POST(request: NextRequest) {
  try {
    const { to, subject, html, orderNumber } = await request.json();

    // Validate input
    if (!to || !subject || !html) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Get secure config
    const { host, port, user, pass } = getEmailConfig();

    // Create transporter
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      tls: { rejectUnauthorized: process.env.NODE_ENV === 'production' }
    });

    // Send email
    const info = await transporter.sendMail({
      from: `"FurnishVerse" <${user}>`,
      to,
      subject,
      html,
      headers: {
        'X-Priority': '1',
        'Importance': 'high'
      }
    });

    return NextResponse.json({
      success: true,
      messageId: info.messageId
    });

  } catch (error: any) {
    console.error('Email sending failed:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}

// Reject other methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}