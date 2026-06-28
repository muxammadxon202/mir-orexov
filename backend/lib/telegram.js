async function sendTelegram(record) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) throw new Error("Telegram not configured");

  const lines = [
    "🌰 *Новая заявка с сайта Mir Orexov*",
    `*Имя:* ${record.name}`,
    record.company && `*Компания:* ${record.company}`,
    record.country && `*Страна:* ${record.country}`,
    record.phone && `*Телефон:* ${record.phone}`,
    record.email && `*Email:* ${record.email}`,
    record.product && `*Товар:* ${record.product}`,
    record.volume && `*Объём:* ${record.volume} т`,
    record.message && `*Комментарий:* ${record.message}`,
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
