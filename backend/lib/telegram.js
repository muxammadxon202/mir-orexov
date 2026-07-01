// Telegram's legacy Markdown mode breaks (or lets a user fake bold/italic
// sections) if field values contain _ * ` [ — escape them before interpolating.
function escapeMarkdown(value) {
  return String(value).replace(/[_*`[]/g, "\\$&");
}

async function sendToChat(token, chatId, text) {
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "Markdown",
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Telegram API error for chat ${chatId}: ${res.status} ${body}`);
  }
}

async function sendTelegram(record) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  // Multiple admins: TELEGRAM_CHAT_ID accepts a comma-separated list of personal
  // chat ids (each admin starts the bot once so it can message them directly),
  // so we don't need a shared group.
  const chatIds = String(process.env.TELEGRAM_CHAT_ID || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (!token || chatIds.length === 0) throw new Error("Telegram not configured");

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
  const text = lines.join("\n");

  // Deliver to every admin independently — one admin's chat being unreachable
  // (e.g. blocked the bot) shouldn't stop the others from getting notified.
  const results = await Promise.allSettled(chatIds.map((chatId) => sendToChat(token, chatId, text)));
  const failures = results.filter((r) => r.status === "rejected");
  failures.forEach((r) => console.error("[telegram]", r.reason.message));

  if (failures.length === results.length) {
    throw new Error("Telegram delivery failed for all configured chats");
  }
}

module.exports = { sendTelegram };
