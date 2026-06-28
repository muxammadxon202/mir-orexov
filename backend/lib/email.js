const nodemailer = require("nodemailer");

let transporter = null;
function getTransporter() {
  if (transporter) return transporter;
  const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) throw new Error("SMTP not configured");

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 465),
    secure: String(SMTP_SECURE || "true") === "true",
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return transporter;
}

async function sendEmail(record) {
  const to = process.env.EMAIL_TO;
  const from = process.env.EMAIL_FROM || process.env.SMTP_USER;
  if (!to) throw new Error("EMAIL_TO not configured");

  const rows = [
    ["Имя", record.name],
    ["Компания", record.company],
    ["Страна", record.country],
    ["Телефон", record.phone],
    ["Email", record.email],
    ["Товар", record.product],
    ["Объём (т)", record.volume],
    ["Комментарий", record.message],
  ].filter(([, v]) => v);

  const html =
    `<h2>Новая заявка с сайта Mir Orexov</h2><table cellpadding="6" cellspacing="0" border="1" style="border-collapse:collapse;font-family:sans-serif">` +
    rows.map(([k, v]) => `<tr><td><strong>${k}</strong></td><td>${escapeHtml(v)}</td></tr>`).join("") +
    `</table>`;

  await getTransporter().sendMail({
    from,
    to,
    replyTo: record.email || undefined,
    subject: `Новая заявка — ${record.name}`,
    html,
  });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

module.exports = { sendEmail };
