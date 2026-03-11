/**
 * reCAPTCHA v3 server-side verification.
 * Set RECAPTCHA_SECRET_KEY in env to enable. Optional for contact form.
 */

const RECAPTCHA_VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";

export async function verifyRecaptcha(token: string | null | undefined): Promise<boolean> {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) return true; // not configured => skip check

  if (!token || typeof token !== "string" || token.length < 10) {
    return false;
  }

  try {
    const res = await fetch(RECAPTCHA_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }),
    });
    const data = (await res.json()) as { success?: boolean; score?: number };
    return data.success === true && (data.score ?? 0) >= 0.5;
  } catch {
    return false;
  }
}

export function isRecaptchaEnabled(): boolean {
  return Boolean(process.env.RECAPTCHA_SECRET_KEY);
}
