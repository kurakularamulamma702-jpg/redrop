import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// In-memory OTP storage with TTL
interface OtpEntry {
  code: string;
  expiresAt: number;
  attempts: number;
}

const otpStore = new Map<string, OtpEntry>();

// Clean expired OTPs every minute
setInterval(() => {
  const now = Date.now();
  for (const [phone, entry] of otpStore.entries()) {
    if (now > entry.expiresAt) {
      otpStore.delete(phone);
    }
  }
}, 60 * 1000);

/**
 * Send OTP API
 * Supports real cellular transmission via Twilio if configured,
 * and direct WhatsApp / Native SMS dispatch.
 */
app.post('/api/send-otp', async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone } = req.body;
    if (!phone || typeof phone !== 'string') {
      res.status(400).json({ success: false, error: 'Valid phone number is required.' });
      return;
    }

    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    if (cleanPhone.replace(/[^0-9]/g, '').length < 7) {
      res.status(400).json({ success: false, error: 'Phone number is too short.' });
      return;
    }

    // Rate limiting: check recent OTP
    const existing = otpStore.get(cleanPhone);
    if (existing && Date.now() < existing.expiresAt - 4 * 60 * 1000) {
      // Sent within last 60 seconds
      res.status(429).json({ 
        success: false, 
        error: 'Please wait 60 seconds before requesting a new OTP code.' 
      });
      return;
    }

    // Generate real 6-digit OTP code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    otpStore.set(cleanPhone, {
      code,
      expiresAt,
      attempts: 0
    });

    let carrierSent = false;
    let carrierError: string | null = null;

    // Check if real cellular carrier gateway (Twilio) is configured in environment
    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuth = process.env.TWILIO_AUTH_TOKEN;
    const twilioNumber = process.env.TWILIO_PHONE_NUMBER;

    if (twilioSid && twilioAuth && twilioNumber) {
      try {
        const authHeader = 'Basic ' + Buffer.from(`${twilioSid}:${twilioAuth}`).toString('base64');
        const params = new URLSearchParams({
          To: cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`,
          From: twilioNumber,
          Body: `Your HemoLink blood donor verification OTP code is: ${code}. Valid for 5 minutes. Do not share with anyone.`
        });

        const twilioRes = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
          {
            method: 'POST',
            headers: {
              'Authorization': authHeader,
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params.toString()
          }
        );

        if (twilioRes.ok) {
          carrierSent = true;
          console.log(`[HemoLink] Carrier SMS dispatched to ${cleanPhone}`);
        } else {
          const errData: any = await twilioRes.json();
          carrierError = errData?.message || 'Twilio carrier dispatch failed';
          console.warn(`[HemoLink] Twilio SMS warning:`, carrierError);
        }
      } catch (e: any) {
        carrierError = e.message;
        console.warn(`[HemoLink] Carrier gateway error:`, e.message);
      }
    }

    const messageText = `Your HemoLink blood donor verification OTP code is: ${code}. Valid for 5 minutes.`;
    const whatsappUrl = `https://wa.me/${cleanPhone.replace('+', '')}?text=${encodeURIComponent(messageText)}`;
    const smsUrl = `sms:${cleanPhone}?body=${encodeURIComponent(messageText)}`;

    res.json({
      success: true,
      phone: cleanPhone,
      code, // returned so client can show direct SMS preview and 1-tap verify helper
      carrierSent,
      carrierError,
      expiresAt,
      whatsappUrl,
      smsUrl,
      message: carrierSent 
        ? `Real SMS OTP dispatched to ${cleanPhone} via cellular network.` 
        : `Real OTP generated for ${cleanPhone}. Click 'Send to My WhatsApp' or 'Send via SMS App' to deliver instantly to your phone.`
    });
  } catch (error: any) {
    console.error('[HemoLink] send-otp error:', error);
    res.status(500).json({ success: false, error: 'Internal server error generating OTP.' });
  }
});

/**
 * Verify OTP API
 */
app.post('/api/verify-otp', (req: Request, res: Response): void => {
  try {
    const { phone, code } = req.body;
    if (!phone || !code) {
      res.status(400).json({ success: false, error: 'Phone and OTP code are required.' });
      return;
    }

    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    const entry = otpStore.get(cleanPhone);

    if (!entry) {
      res.status(400).json({ 
        success: false, 
        error: 'No active OTP request found for this phone number. Please request a new code.' 
      });
      return;
    }

    if (Date.now() > entry.expiresAt) {
      otpStore.delete(cleanPhone);
      res.status(400).json({ 
        success: false, 
        error: 'This OTP code has expired (valid for 5 minutes). Please request a new code.' 
      });
      return;
    }

    entry.attempts += 1;
    if (entry.attempts > 5) {
      otpStore.delete(cleanPhone);
      res.status(429).json({ 
        success: false, 
        error: 'Too many incorrect attempts. Please request a new code.' 
      });
      return;
    }

    if (entry.code !== code.trim()) {
      res.status(400).json({ 
        success: false, 
        error: `Incorrect OTP code. (${5 - entry.attempts} attempts remaining)` 
      });
      return;
    }

    // OTP Verified! Remove from store so it cannot be re-used
    otpStore.delete(cleanPhone);

    res.json({
      success: true,
      verified: true,
      phone: cleanPhone,
      verifiedAt: Date.now(),
      message: 'Phone number verified successfully via real OTP.'
    });
  } catch (error: any) {
    console.error('[HemoLink] verify-otp error:', error);
    res.status(500).json({ success: false, error: 'Internal server error verifying OTP.' });
  }
});

// Mount Vite middleware in development or serve static in production
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[HemoLink Server] Running on http://localhost:${PORT}`);
  });
}

startServer();
