/**
 * Professional dark email templates for Svay product emails.
 */
import {
  APP_URL,
  EMAIL,
  escapeHtml,
  emailLayout,
  card,
  sectionLabel,
  badge,
  statGrid,
  divider,
  metaRow,
} from "./layout";

function formatCount(n) {
  const num = Number(n) || 0;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(num >= 10_000_000 ? 0 : 1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(num >= 100_000 ? 0 : 1)}K`;
  return num.toLocaleString();
}

/* ─────────────────────────────────────────────
 * Competitor analysis report
 * ───────────────────────────────────────────── */
export function competitorReportEmail({
  analysisTitle,
  subjectTitle,
  analysisId,
  competitors = [],
}) {
  const appBase = APP_URL;
  const ctaHref = `${appBase}/competitors?analysisId=${encodeURIComponent(analysisId)}`;

  const competitorCards = competitors
    .map(({ channel, videos }) => {
      const subCount = parseInt(channel.statistics?.subscriberCount || "0", 10);
      const viewCount = parseInt(channel.statistics?.viewCount || "0", 10);
      const title = channel.snippet?.title || "Channel";
      const thumbnail =
        channel.snippet?.thumbnails?.default?.url ||
        channel.snippet?.thumbnails?.medium?.url ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(title)}&background=18181b&color=fff`;

      let badgeMeta = {
        label: "Direct peer",
        color: EMAIL.textSecondary,
        bg: "rgba(255,255,255,0.06)",
      };
      if (subCount > 1_000_000) {
        badgeMeta = {
          label: "Market leader",
          color: EMAIL.danger,
          bg: EMAIL.dangerSoft,
        };
      } else if (subCount > 100_000) {
        badgeMeta = {
          label: "Rising star",
          color: EMAIL.accent,
          bg: EMAIL.accentSoft,
        };
      }

      const videoList =
        videos?.length > 0
          ? videos
              .map(
                (v) => `
            <tr>
              <td style="padding:8px 0;border-bottom:1px solid ${EMAIL.border};">
                <p style="margin:0;font-size:13px;line-height:1.45;color:${EMAIL.textSecondary};">
                  ${escapeHtml(v.snippet?.title || "Untitled")}
                </p>
              </td>
            </tr>
          `
              )
              .join("")
          : `<tr><td style="padding:4px 0;"><p style="margin:0;font-size:13px;color:${EMAIL.textMuted};font-style:italic;">No recent uploads found.</p></td></tr>`;

      return card(`
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td width="48" valign="middle" style="padding:0 14px 0 0;">
              <img src="${escapeHtml(thumbnail)}" width="48" height="48" alt=""
                style="width:48px;height:48px;border-radius:999px;border:1px solid ${EMAIL.borderSoft};object-fit:cover;" />
            </td>
            <td valign="middle" style="padding:0;">
              <p style="margin:0 0 6px 0;font-size:16px;font-weight:650;color:${EMAIL.white};letter-spacing:-0.01em;">
                ${escapeHtml(title)}
              </p>
              ${badge(badgeMeta.label, { color: badgeMeta.color, bg: badgeMeta.bg })}
            </td>
          </tr>
        </table>

        <div style="height:14px;font-size:0;line-height:0;">&nbsp;</div>

        ${statGrid([
          { label: "Subscribers", value: formatCount(subCount) },
          { label: "Total views", value: formatCount(viewCount) },
        ])}

        <div style="height:14px;font-size:0;line-height:0;">&nbsp;</div>

        <p style="margin:0 0 8px 0;font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:${EMAIL.textMuted};">
          Recent uploads
        </p>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
          ${videoList}
        </table>
      `);
    })
    .join("");

  const body = `
    ${sectionLabel("Market rivals")}
    ${competitorCards || `<p style="margin:0;color:${EMAIL.textMuted};font-size:14px;">No competitor data available for this report.</p>`}

    ${divider()}

    ${card(
      `
      <p style="margin:0 0 8px 0;font-size:13px;font-weight:600;color:${EMAIL.white};">Strategic focus</p>
      <p style="margin:0;font-size:14px;line-height:1.6;color:${EMAIL.textSecondary};">
        Rivals above are winning with the titles listed. Prioritize higher-velocity content that targets their engagement gaps — treat recent uploads as a blueprint for your next video.
      </p>
    `,
      { padding: "18px 18px", margin: "0 0 24px 0" }
    )}
  `;

  const subject = `Competitor report: ${analysisTitle || subjectTitle || "Your channel"}`;

  return {
    subject,
    html: emailLayout({
      preheader: `Competitor intel for ${subjectTitle || "your channel"} — open your full matrix inside.`,
      eyebrow: "Competitor intelligence",
      title: "Your competitor report is ready",
      subtitle: `Analysis for <strong style="color:${EMAIL.white};font-weight:600;">${escapeHtml(subjectTitle || "your channel")}</strong>${analysisTitle ? ` · ${escapeHtml(analysisTitle)}` : ""}`,
      body,
      ctaLabel: "Open full interactive matrix",
      ctaHref,
      footerNote: "This report was sent from your Svay dashboard.",
    }),
    text: [
      `Competitor report: ${analysisTitle || ""}`,
      `For: ${subjectTitle || "Your channel"}`,
      "",
      ...competitors.map(({ channel, videos }) => {
        const t = channel.snippet?.title || "Channel";
        const subs = channel.statistics?.subscriberCount || "0";
        const vids = (videos || []).map((v) => `  - ${v.snippet?.title}`).join("\n");
        return `${t}\n  Subscribers: ${subs}\n${vids}`;
      }),
      "",
      `Open full report: ${ctaHref}`,
    ].join("\n"),
  };
}

/* ─────────────────────────────────────────────
 * Trend radar
 * ───────────────────────────────────────────── */
export function trendRadarEmail({ insights, channelId }) {
  const ctaHref = `${APP_URL}/radar`;
  const overview = insights?.overview || {};
  const videoIdeas = insights?.videoIdeas || [];
  const quickWins = insights?.quickWins || [];
  const hooks = insights?.viralPatterns?.titleHooks || [];

  const ideaCards = videoIdeas
    .map(
      (idea) =>
        card(`
      <p style="margin:0 0 8px 0;font-size:16px;font-weight:650;color:${EMAIL.white};letter-spacing:-0.01em;line-height:1.35;">
        ${escapeHtml(idea.title)}
      </p>
      <p style="margin:0 0 12px 0;font-size:13px;line-height:1.55;color:${EMAIL.textSecondary};">
        ${escapeHtml(idea.description || "")}
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding:0 8px 0 0;">
            ${badge(idea.difficulty || "Medium", { color: EMAIL.accent, bg: EMAIL.accentSoft })}
          </td>
          <td style="padding:0;">
            ${badge(
              `${idea.predictedViews || "—"} views`,
              { color: EMAIL.danger, bg: EMAIL.dangerSoft }
            )}
          </td>
        </tr>
      </table>
    `)
    )
    .join("");

  const quickWinRows = quickWins
    .map(
      (win, i) => `
    <tr>
      <td style="padding:${i === 0 ? "0" : "12px"} 0 ${i === quickWins.length - 1 ? "0" : "12px"} 0;${i < quickWins.length - 1 ? `border-bottom:1px solid ${EMAIL.border};` : ""}">
        <p style="margin:0 0 4px 0;font-size:14px;font-weight:600;color:${EMAIL.white};">${escapeHtml(win.idea)}</p>
        <p style="margin:0;font-size:12px;color:${EMAIL.textMuted};line-height:1.45;">${escapeHtml([win.why, win.timing].filter(Boolean).join(" · "))}</p>
      </td>
    </tr>
  `
    )
    .join("");

  const hookRows = hooks
    .map(
      (hook) => `
    <tr>
      <td style="padding:6px 0 6px 12px;border-left:2px solid ${EMAIL.accent};">
        <p style="margin:0;font-size:13px;line-height:1.45;color:${EMAIL.textSecondary};">${escapeHtml(hook)}</p>
      </td>
    </tr>
  `
    )
    .join("");

  const body = `
    ${card(
      `
      <p style="margin:0 0 6px 0;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:${EMAIL.textMuted};">Market momentum</p>
      <p style="margin:0 0 10px 0;font-size:26px;font-weight:650;letter-spacing:-0.03em;color:${EMAIL.white};">
        ${escapeHtml(overview.marketMomentum || "—")}
      </p>
      <p style="margin:0;font-size:14px;line-height:1.55;color:${EMAIL.textSecondary};">
        Viral potential is currently <strong style="color:${EMAIL.white};font-weight:600;">${escapeHtml(overview.viralPotential || "—")}</strong>.
        ${escapeHtml(overview.summary || "")}
      </p>
    `,
      { margin: "0 0 8px 0" }
    )}

    ${sectionLabel("High-impact ideas")}
    ${ideaCards || `<p style="margin:0;color:${EMAIL.textMuted};font-size:14px;">No ideas available yet.</p>`}

    ${sectionLabel("Quick wins")}
    ${card(
      quickWinRows
        ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">${quickWinRows}</table>`
        : `<p style="margin:0;color:${EMAIL.textMuted};font-size:13px;">No quick wins listed.</p>`
    )}

    ${sectionLabel("Winning patterns")}
    ${card(
      hooks.length
        ? `
        <p style="margin:0 0 12px 0;font-size:12px;font-weight:600;color:${EMAIL.textMuted};letter-spacing:0.04em;">Psychological hooks</p>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
          ${hookRows}
        </table>
      `
        : `<p style="margin:0;color:${EMAIL.textMuted};font-size:13px;">No patterns available.</p>`
    )}
  `;

  return {
    subject: "Market pulse: your trend radar is ready",
    html: emailLayout({
      preheader: `${overview.marketMomentum || "Fresh"} momentum · viral potential ${overview.viralPotential || "updated"}. Open your radar.`,
      eyebrow: "Trend radar",
      title: "Your market pulse is ready",
      subtitle: "Real-time intelligence on what is working in your niche right now.",
      body,
      ctaLabel: "Open full intelligence radar",
      ctaHref,
      footerNote: channelId
        ? "Automated trend brief from your connected channel on Svay."
        : "Automated trend brief from Svay.",
    }),
    text: [
      "Trend radar ready",
      `Market momentum: ${overview.marketMomentum || "—"}`,
      `Viral potential: ${overview.viralPotential || "—"}`,
      overview.summary || "",
      "",
      "Ideas:",
      ...videoIdeas.map((i) => `- ${i.title}: ${i.description || ""}`),
      "",
      `Open radar: ${ctaHref}`,
    ].join("\n"),
  };
}

/* ─────────────────────────────────────────────
 * Support — inbound ticket (to team)
 * ───────────────────────────────────────────── */
export function supportTicketEmail({
  topic,
  name,
  email,
  message,
  userId,
  clerkEmail,
}) {
  const body = `
    ${card(`
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        ${metaRow("Topic", `<span style="display:inline-block;background:${EMAIL.accentSoft};color:${EMAIL.accent};font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;padding:3px 8px;border-radius:5px;">${escapeHtml(topic)}</span>`)}
        ${metaRow("Name", escapeHtml(name))}
        ${metaRow("Email", `<a href="mailto:${escapeHtml(email)}" style="color:${EMAIL.accent};text-decoration:none;">${escapeHtml(email)}</a>`)}
        ${userId ? metaRow("User ID", `<span style="font-family:${EMAIL.mono};font-size:12px;color:${EMAIL.textSecondary};">${escapeHtml(userId)}</span>`) : ""}
        ${clerkEmail ? metaRow("Clerk email", escapeHtml(clerkEmail)) : ""}
      </table>
    `)}

    ${sectionLabel("Message")}
    ${card(`
      <p style="margin:0;font-size:14px;line-height:1.65;color:${EMAIL.text};white-space:pre-wrap;">${escapeHtml(message)}</p>
    `)}
  `;

  return {
    subject: `[Svay Support] ${String(topic).toUpperCase()} — ${name}`,
    html: emailLayout({
      preheader: `New ${topic} request from ${name}`,
      eyebrow: "Support inbox",
      title: "New support request",
      subtitle: "A customer reached out via the Svay support form.",
      body,
      footerNote: "Internal notification · reply to the customer at the email above.",
    }),
    text: [
      `Topic: ${topic}`,
      `Name: ${name}`,
      `Email: ${email}`,
      userId ? `User ID: ${userId}` : null,
      clerkEmail ? `Clerk email: ${clerkEmail}` : null,
      "",
      message,
    ]
      .filter(Boolean)
      .join("\n"),
  };
}

/* ─────────────────────────────────────────────
 * Support — confirmation (to user)
 * ───────────────────────────────────────────── */
export function supportConfirmationEmail({ name, topic }) {
  const body = `
    <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:${EMAIL.textSecondary};">
      Hi <strong style="color:${EMAIL.white};font-weight:600;">${escapeHtml(name)}</strong>,
    </p>
    <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:${EMAIL.textSecondary};">
      We received your message about
      <strong style="color:${EMAIL.white};font-weight:600;">${escapeHtml(topic)}</strong>
      and will reply as soon as we can — usually within 24 hours on business days.
    </p>
    ${card(`
      <p style="margin:0;font-size:13px;line-height:1.55;color:${EMAIL.textMuted};">
        Need to add context? Reply to this email or send another note from the Support page — it will land in the same thread on our side.
      </p>
    `)}
  `;

  return {
    subject: "We received your message — Svay Support",
    html: emailLayout({
      preheader: "Thanks for writing — our team will get back to you soon.",
      eyebrow: "Support",
      title: "Thanks for reaching out",
      body,
      ctaLabel: "Visit support",
      ctaHref: `${APP_URL}/support`,
      footerNote: "You're receiving this confirmation because you contacted Svay Support.",
    }),
    text: `Hi ${name},\n\nWe received your support request (${topic}) and will get back to you soon.\n\n— Svay Care`,
  };
}
