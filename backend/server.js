require("dotenv").config();
const express = require("express");
const cors = require("cors");

const { normalize, isValid } = require("./lib/normalize");
const { sendTelegram } = require("./lib/telegram");
const { sendEmail } = require("./lib/email");
const { appendToSheet } = require("./lib/sheets");

const app = express();
app.use(express.json());

const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Allow same-origin / curl (no Origin header) and any explicitly listed origin.
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error("Not allowed by CORS"));
    },
  })
);

app.get("/healthz", (req, res) => res.json({ ok: true }));

app.post("/api/requests", async (req, res) => {
  const record = normalize(req.body || {});

  if (!isValid(record)) {
    return res.status(400).json({ ok: false, error: "Missing name or contact info" });
  }

  const integrations = [
    ["telegram", sendTelegram],
    ["email", sendEmail],
    ["sheets", appendToSheet],
  ];

  const results = await Promise.allSettled(integrations.map(([, fn]) => fn(record)));

  results.forEach((result, i) => {
    if (result.status === "rejected") {
      console.error(`[${integrations[i][0]}] failed:`, result.reason.message);
    }
  });

  const anySucceeded = results.some((r) => r.status === "fulfilled");
  if (!anySucceeded) {
    return res.status(502).json({ ok: false, error: "All delivery channels failed" });
  }

  res.json({ ok: true });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Mir Orexov API listening on port ${port}`));
