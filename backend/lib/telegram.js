// Telegram's legacy Markdown mode breaks (or lets a user fake bold/italic
// sections) if field values contain _ * ` [ — escape them before interpolating.
function escapeMarkdown(value) {
  return String(value).replace(/[_*`[]/g, "\\$&");
}

async function sendTelegram(record) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) throw new Error("Telegram not configured");

  const lines = [
    "🌰 *Новая заявка с сайта Mir Orexov*",
    `*Имя:* ${escapeMarkdown(record.name)}`,
    record.company && `*Компания:* ${escapeMarkdown(record.company)}`,
    record.country && `*Страна:* ${escapeMarkdown(record.country)}`,
    record.phone && `*Телефон:* ${escapeMarkdown(record.phone)}`,
    record.email && `*Email:* ${escapeMarkdown(record.email)}`,
    record.product && `*Товар:* ${escapeMarkdown(record.product)}`,
    record.volume && `*Объём:* ${escapeMarkdown(record.volume)} т`,
    record.message && `*Комментарий:* ${escapeMarkdown(record.message)}`,
  ].filter(Boolean);

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: lines.join("\n"),
      parse_mode: "Markdown",
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Telegram API error: ${res.status} ${body}`);
  }
}

module.exports = { sendTelegram };
