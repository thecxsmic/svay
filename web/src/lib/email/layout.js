/**
 * Shared Svay email layout — dark, responsive, email-client safe.
 * Table-based structure for Outlook/Gmail/Apple Mail compatibility.
 */

export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://updates.svay.space";

export const EMAIL = {
  bg: "#050505",
  surface: "#0c0c0c",
  card: "#111111",
  cardHover: "#141414",
  border: "#1e1e1e",
  borderSoft: "#262626",
  text: "#f4f4f5",
  textSecondary: "#a1a1aa",
  textMuted: "#71717a",
  accent: "#00f0ff",
  accentSoft: "rgba(0, 240, 255, 0.12)",
  accentBorder: "rgba(0, 240, 255, 0.22)",
  white: "#ffffff",
  black: "#000000",
  danger: "#fb7185",
  dangerSoft: "rgba(251, 113, 133, 0.12)",
  success: "#34d399",
  successSoft: "rgba(52, 211, 153, 0.12)",
  font: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  mono: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
};

export function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Brand mark: solid accent orb (gradients unreliable in many clients) + wordmark */
function brandHeader() {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td align="left" style="padding:0;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td valign="middle" style="padding:0 10px 0 0;">
                <div style="width:28px;height:28px;border-radius:999px;background-color:${EMAIL.accent};box-shadow:0 0 18px rgba(0,240,255,0.35);"></div>
              </td>
              <td valign="middle" style="padding:0;">
                <span style="font-family:${EMAIL.font};font-size:15px;font-weight:700;letter-spacing:0.14em;color:${EMAIL.white};text-transform:uppercase;">Svay</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}

/**
 * Full document shell.
 * @param {object} opts
 * @param {string} opts.preheader - inbox preview text
 * @param {string} opts.title - H1
 * @param {string} [opts.subtitle]
 * @param {string} [opts.eyebrow] - small label above title
 * @param {string} opts.body - main HTML (already escaped where needed)
 * @param {string} [opts.ctaLabel]
 * @param {string} [opts.ctaHref]
 * @param {string} [opts.footerNote]
 */
export function emailLayout({
  preheader = "",
  title,
  subtitle,
  eyebrow,
  body,
  ctaLabel,
  ctaHref,
  footerNote,
}) {
  const safePreheader = escapeHtml(preheader);
  const year = new Date().getFullYear();

  const ctaBlock =
    ctaLabel && ctaHref
      ? `
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 8px 0;">
        <tr>
          <td align="center" style="padding:8px 0 0 0;">
            <!--[if mso]>
            <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${escapeHtml(ctaHref)}" style="height:48px;v-text-anchor:middle;width:280px;" arcsize="17%" fillcolor="${EMAIL.white}" stroke="f">
              <w:anchorlock/>
              <center style="color:${EMAIL.black};font-family:sans-serif;font-size:14px;font-weight:700;">${escapeHtml(ctaLabel)}</center>
            </v:roundrect>
            <![endif]-->
            <!--[if !mso]><!-->
            <a href="${escapeHtml(ctaHref)}"
               style="display:inline-block;background-color:${EMAIL.white};color:${EMAIL.black};text-decoration:none;font-family:${EMAIL.font};font-size:14px;font-weight:600;letter-spacing:0.01em;padding:14px 28px;border-radius:10px;line-height:1.2;mso-hide:all;">
              ${escapeHtml(ctaLabel)}
            </a>
            <!--<![endif]-->
          </td>
        </tr>
      </table>
    `
      : "";

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="color-scheme" content="dark" />
  <meta name="supported-color-schemes" content="dark" />
  <title>${escapeHtml(title)}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    :root { color-scheme: dark; supported-color-schemes: dark; }
    html, body { margin: 0 !important; padding: 0 !important; height: 100% !important; width: 100% !important; }
    * { -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt !important; mso-table-rspace: 0pt !important; border-collapse: collapse !important; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; display: block; }
    a { text-decoration: none; }
    .email-body, .email-body * { font-family: ${EMAIL.font} !important; }
    @media only screen and (max-width: 620px) {
      .email-shell { width: 100% !important; }
      .email-pad { padding-left: 20px !important; padding-right: 20px !important; }
      .email-pad-lg { padding-left: 20px !important; padding-right: 20px !important; padding-top: 28px !important; padding-bottom: 28px !important; }
      .email-title { font-size: 24px !important; line-height: 1.25 !important; }
      .email-card { padding: 16px !important; }
      .stat-col { display: block !important; width: 100% !important; padding-bottom: 12px !important; }
      .stack-col { display: block !important; width: 100% !important; }
      .hide-mobile { display: none !important; width: 0 !important; height: 0 !important; overflow: hidden !important; }
    }
  </style>
</head>
<body class="email-body" style="margin:0;padding:0;background-color:${EMAIL.bg};color:${EMAIL.text};width:100%;-webkit-font-smoothing:antialiased;">
  <!-- Preheader (hidden inbox preview) -->
  <div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">
    ${safePreheader}${"&nbsp;&zwnj;".repeat(30)}
  </div>

  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${EMAIL.bg};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" class="email-shell" cellpadding="0" cellspacing="0" border="0" width="560" style="width:100%;max-width:560px;background-color:${EMAIL.surface};border:1px solid ${EMAIL.border};border-radius:16px;overflow:hidden;">
          
          <!-- Accent top bar -->
          <tr>
            <td style="height:3px;background:linear-gradient(90deg, ${EMAIL.accent} 0%, #0070f3 55%, ${EMAIL.accent} 100%);font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <!-- Brand -->
          <tr>
            <td class="email-pad" style="padding:28px 32px 0 32px;">
              ${brandHeader()}
            </td>
          </tr>

          <!-- Hero title -->
          <tr>
            <td class="email-pad" style="padding:28px 32px 8px 32px;">
              ${
                eyebrow
                  ? `<p style="margin:0 0 10px 0;font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:${EMAIL.accent};">${escapeHtml(eyebrow)}</p>`
                  : ""
              }
              <h1 class="email-title" style="margin:0;font-size:28px;font-weight:650;letter-spacing:-0.03em;line-height:1.2;color:${EMAIL.white};">
                ${escapeHtml(title)}
              </h1>
              ${
                subtitle
                  ? `<p style="margin:12px 0 0 0;font-size:15px;line-height:1.55;color:${EMAIL.textSecondary};">${subtitle}</p>`
                  : ""
              }
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td class="email-pad-lg" style="padding:28px 32px 32px 32px;">
              ${body}
              ${ctaBlock}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:0 32px 28px 32px;border-top:1px solid ${EMAIL.border};" class="email-pad">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:24px;">
                <tr>
                  <td align="center" style="padding:0;">
                    <p style="margin:0 0 8px 0;font-size:12px;line-height:1.5;color:${EMAIL.textMuted};">
                      ${footerNote || "You received this because you use Svay."}
                    </p>
                    <p style="margin:0;font-size:12px;line-height:1.5;color:${EMAIL.textMuted};">
                      <a href="${APP_URL}" style="color:${EMAIL.textSecondary};text-decoration:none;">Open Svay</a>
                      &nbsp;·&nbsp;
                      <a href="${APP_URL}/support" style="color:${EMAIL.textSecondary};text-decoration:none;">Support</a>
                      &nbsp;·&nbsp;
                      <a href="mailto:help@svay.space" style="color:${EMAIL.textSecondary};text-decoration:none;">help@svay.space</a>
                    </p>
                    <p style="margin:14px 0 0 0;font-size:11px;color:#52525b;letter-spacing:0.04em;">
                      © ${year} Svay · Intelligence for creators
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Card container */
export function card(inner, { padding = "18px 18px", margin = "0 0 14px 0" } = {}) {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:${margin};">
      <tr>
        <td class="email-card" style="background-color:${EMAIL.card};border:1px solid ${EMAIL.border};border-radius:12px;padding:${padding};">
          ${inner}
        </td>
      </tr>
    </table>
  `;
}

/** Section label */
export function sectionLabel(text) {
  return `
    <p style="margin:24px 0 12px 0;font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:${EMAIL.textMuted};">
      ${escapeHtml(text)}
    </p>
  `;
}

/** Pill / badge */
export function badge(label, { color = EMAIL.accent, bg = EMAIL.accentSoft } = {}) {
  return `
    <span style="display:inline-block;background:${bg};color:${color};font-size:10px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;padding:4px 9px;border-radius:6px;line-height:1.2;">
      ${escapeHtml(label)}
    </span>
  `;
}

/** Two-column stats row (stacks on mobile) */
export function statGrid(stats = []) {
  const cells = stats
    .map(
      (s) => `
      <td class="stat-col" width="50%" valign="top" style="padding:0 8px 0 0;">
        <p style="margin:0 0 4px 0;font-size:11px;font-weight:500;color:${EMAIL.textMuted};letter-spacing:0.04em;">${escapeHtml(s.label)}</p>
        <p style="margin:0;font-size:18px;font-weight:650;color:${EMAIL.white};letter-spacing:-0.02em;">${escapeHtml(s.value)}</p>
      </td>
    `
    )
    .join("");

  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:rgba(255,255,255,0.02);border-radius:10px;margin:0 0 4px 0;">
      <tr>
        <td style="padding:14px 12px 14px 16px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>${cells}</tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}

/** Soft divider */
export function divider() {
  return `<div style="height:1px;background-color:${EMAIL.border};margin:20px 0;font-size:0;line-height:0;">&nbsp;</div>`;
}

/** Meta row for support-style key/value */
export function metaRow(label, value) {
  return `
    <tr>
      <td style="padding:6px 0;font-size:13px;color:${EMAIL.textMuted};width:110px;vertical-align:top;">${escapeHtml(label)}</td>
      <td style="padding:6px 0;font-size:13px;color:${EMAIL.text};font-weight:500;vertical-align:top;">${value}</td>
    </tr>
  `;
}
