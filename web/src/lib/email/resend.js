import { Resend } from 'resend';

let resend;

export async function sendEmail({ to, subject, html, text }) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Resend] API Key missing, skipping email');
    return { success: false, error: 'API Key missing' };
  }

  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }

  try {
    const data = await resend.emails.send({
      from: 'Vyron <hello@updates.vyron.space>',
      to,
      subject,
      html: html || text,
      text: text || '',
    });

    return { success: true, data };
  } catch (error) {
    console.error('[Resend] Error sending email:', error);
    return { success: false, error: error.message };
  }
}
