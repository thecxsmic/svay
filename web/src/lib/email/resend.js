import { Resend } from 'resend';

let resend;

export async function sendEmail({ to, subject, html, text, from }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('[Resend] RESEND_API_KEY is missing, skipping email');
    return { success: false, error: 'RESEND_API_KEY environment variable is not configured' };
  }

  if (!resend) {
    resend = new Resend(apiKey);
  }

  const sender = from || process.env.RESEND_FROM_EMAIL || 'Svay <insights@svay.space>';

  try {
    const res = await resend.emails.send({
      from: sender,
      to: Array.isArray(to) ? to : [to],
      subject,
      html: html || text,
      text: text || '',
    });

    if (res?.error) {
      const errMessage = res.error.message || (typeof res.error === 'string' ? res.error : JSON.stringify(res.error));
      console.error('[Resend] API returned error:', errMessage);
      return { success: false, error: errMessage };
    }

    return { success: true, data: res.data };
  } catch (error) {
    console.error('[Resend] Error sending email:', error);
    return { success: false, error: error.message || String(error) };
  }
}

