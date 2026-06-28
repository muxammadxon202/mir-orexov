// The frontend has two forms that both POST to /api/requests with different
// field shapes:
//   - contact.html "#request-form": name, company, country, phone, email, product, volume, message
//   - quote-modal (catalog drill-down + hero orbit): name, contact, volume, item
// This normalizes either shape into one flat record for the integrations.

function normalize(body) {
  const name = String(body.name || "").trim();
  const volume = String(body.volume || "").trim();

  // Quote-modal shape: "contact" is a free-text phone-or-email field.
  const contactField = String(body.contact || "").trim();
  const looksLikeEmail = (s) => /\S+@\S+\.\S+/.test(s);

  const email = String(body.email || (looksLikeEmail(contactField) ? contactField : "")).trim();
  const phone = String(body.phone || (!looksLikeEmail(contactField) ? contactField : "")).trim();

  const product = String(body.product || body.item || "").trim();

  return {
    name,
    company: String(body.company || "").trim(),
    country: String(body.country || "").trim(),
    phone,
    email,
    product,
    volume,
    message: String(body.message || "").trim(),
    receivedAt: new Date().toISOString(),
  };
}

function isValid(record) {
  return Boolean(record.name) && Boolean(record.email || record.phone);
}

module.exports = { normalize, isValid };
