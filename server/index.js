import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import multer from "multer";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const frontendDist = path.join(projectRoot, "firstgen-guide", "dist");
const dataDir = path.join(projectRoot, "server", "data");
const trustPaymentsFile = path.join(dataDir, "trust-payments.json");
const walletItemsFile = path.join(dataDir, "wallet-items.json");
const walletUploadsDir = path.join(dataDir, "wallet-files");

const app = express();
const port = Number(process.env.PORT || 8787);
const apiKey = process.env.ANTHROPIC_API_KEY || "";
const configured = Boolean(apiKey) && apiKey !== "your_api_key_here";

const ollamaUrl = process.env.OLLAMA_URL || "http://localhost:11434";
const ollamaModelDefault = process.env.OLLAMA_MODEL || "llama3.1";
const n8nChatWebhook = process.env.N8N_CHAT_WEBHOOK || "https://neils0111.app.n8n.cloud/webhook/a1934d42-114d-4f1f-afc7-6e89e7f38172/chat";

function buildN8nWebhookCandidates(url) {
  const candidates = new Set([url]);
  const withNoTrailingSlash = url.replace(/\/+$/, "");
  candidates.add(withNoTrailingSlash);

  if (withNoTrailingSlash.includes("/webhook/")) {
    candidates.add(withNoTrailingSlash.replace("/webhook/", "/webhook-test/"));
  }
  if (withNoTrailingSlash.includes("/webhook-test/")) {
    candidates.add(withNoTrailingSlash.replace("/webhook-test/", "/webhook/"));
  }

  if (withNoTrailingSlash.endsWith("/chat")) {
    const base = withNoTrailingSlash.slice(0, -5);
    candidates.add(base);
    if (base.includes("/webhook/")) {
      candidates.add(base.replace("/webhook/", "/webhook-test/"));
    }
    if (base.includes("/webhook-test/")) {
      candidates.add(base.replace("/webhook-test/", "/webhook/"));
    }
  } else {
    candidates.add(`${withNoTrailingSlash}/chat`);
    if (withNoTrailingSlash.includes("/webhook/")) {
      candidates.add(`${withNoTrailingSlash.replace("/webhook/", "/webhook-test/")}/chat`);
    }
    if (withNoTrailingSlash.includes("/webhook-test/")) {
      candidates.add(`${withNoTrailingSlash.replace("/webhook-test/", "/webhook/")}/chat`);
    }
  }

  return [...candidates];
}

const allowedOrigins = (process.env.FRONTEND_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (!allowedOrigins.length || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Blocked by CORS policy"));
    },
  }),
);

app.use(express.json({ limit: "1mb" }));

function ensureTrustPaymentsStore() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(trustPaymentsFile)) {
    fs.writeFileSync(trustPaymentsFile, "[]", "utf8");
  }
}

function ensureWalletStore() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(walletUploadsDir)) {
    fs.mkdirSync(walletUploadsDir, { recursive: true });
  }
  if (!fs.existsSync(walletItemsFile)) {
    fs.writeFileSync(walletItemsFile, "[]", "utf8");
  }
}

function readWalletItems() {
  ensureWalletStore();
  try {
    const raw = fs.readFileSync(walletItemsFile, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeWalletItems(items) {
  ensureWalletStore();
  fs.writeFileSync(walletItemsFile, JSON.stringify(items, null, 2), "utf8");
}

function sanitizeFileName(name) {
  return (name || "file")
    .toString()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120) || "file";
}

function normalizeStudentId(value) {
  return (value || "").toString().trim().toUpperCase();
}

function readTrustPayments() {
  ensureTrustPaymentsStore();
  try {
    const raw = fs.readFileSync(trustPaymentsFile, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeTrustPayments(items) {
  ensureTrustPaymentsStore();
  fs.writeFileSync(trustPaymentsFile, JSON.stringify(items, null, 2), "utf8");
}

function csvEscape(value) {
  const text = value == null ? "" : String(value);
  if (text.includes(",") || text.includes("\n") || text.includes('"')) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

const walletStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    ensureWalletStore();
    cb(null, walletUploadsDir);
  },
  filename: (_req, file, cb) => {
    const safeOriginal = sanitizeFileName(file.originalname || "file");
    const ext = path.extname(safeOriginal);
    const base = path.basename(safeOriginal, ext);
    const unique = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    cb(null, `${base || "file"}_${unique}${ext}`);
  },
});

const walletUpload = multer({
  storage: walletStorage,
  limits: { fileSize: 8 * 1024 * 1024 },
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, configured });
});

app.get("/api/config-status", (_req, res) => {
  res.json({ configured });
});

app.get("/api/trustchain/payments", (req, res) => {
  const college = (req.query?.college || "").toString().trim().toLowerCase();
  const studentId = (req.query?.studentId || "").toString().trim().toLowerCase();
  const limit = Math.max(1, Math.min(200, Number(req.query?.limit || 50)));

  let rows = readTrustPayments();
  if (college) {
    rows = rows.filter((item) => (item.college || "").toLowerCase().includes(college));
  }
  if (studentId) {
    rows = rows.filter((item) => (item.studentId || "").toLowerCase().includes(studentId));
  }

  rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json({ items: rows.slice(0, limit), total: rows.length, storage: trustPaymentsFile });
});

app.post("/api/trustchain/payments", (req, res) => {
  const college = (req.body?.college || "").toString().trim();
  const bank = (req.body?.bank || "").toString().trim();
  const upi = (req.body?.upi || "").toString().trim();
  const studentId = (req.body?.studentId || "").toString().trim();
  const amount = Number(req.body?.amount);
  const transactionRef = (req.body?.transactionRef || "").toString().trim();
  const note = (req.body?.note || "").toString().trim();

  if (!college || !studentId || !Number.isFinite(amount) || amount <= 0) {
    res.status(400).json({
      error: "Invalid payload",
      detail: "college, studentId, and a positive numeric amount are required.",
    });
    return;
  }

  const payments = readTrustPayments();
  const row = {
    id: `pay_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    college,
    bank,
    upi,
    studentId,
    amount,
    transactionRef,
    note,
    status: "recorded",
    createdAt: new Date().toISOString(),
  };

  payments.push(row);
  writeTrustPayments(payments);
  res.status(201).json({ item: row, storage: trustPaymentsFile });
});

app.put("/api/trustchain/payments/:id", (req, res) => {
  const id = (req.params?.id || "").toString().trim();
  if (!id) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const studentId = req.body?.studentId == null ? undefined : req.body.studentId.toString().trim();
  const transactionRef = req.body?.transactionRef == null ? undefined : req.body.transactionRef.toString().trim();
  const note = req.body?.note == null ? undefined : req.body.note.toString().trim();
  const amount = req.body?.amount == null ? undefined : Number(req.body.amount);

  if (studentId !== undefined && !studentId) {
    res.status(400).json({ error: "Invalid payload", detail: "studentId cannot be empty." });
    return;
  }
  if (amount !== undefined && (!Number.isFinite(amount) || amount <= 0)) {
    res.status(400).json({ error: "Invalid payload", detail: "amount must be a positive number." });
    return;
  }

  const payments = readTrustPayments();
  const index = payments.findIndex((item) => item.id === id);
  if (index < 0) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const current = payments[index];
  const updated = {
    ...current,
    ...(studentId !== undefined ? { studentId } : {}),
    ...(amount !== undefined ? { amount } : {}),
    ...(transactionRef !== undefined ? { transactionRef } : {}),
    ...(note !== undefined ? { note } : {}),
    updatedAt: new Date().toISOString(),
  };

  payments[index] = updated;
  writeTrustPayments(payments);
  res.json({ item: updated, storage: trustPaymentsFile });
});

app.delete("/api/trustchain/payments/:id", (req, res) => {
  const id = (req.params?.id || "").toString().trim();
  if (!id) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const payments = readTrustPayments();
  const index = payments.findIndex((item) => item.id === id);
  if (index < 0) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const [removed] = payments.splice(index, 1);
  writeTrustPayments(payments);
  res.json({ ok: true, removed, storage: trustPaymentsFile });
});

app.get("/api/trustchain/payments.csv", (req, res) => {
  const college = (req.query?.college || "").toString().trim().toLowerCase();
  let rows = readTrustPayments();
  if (college) {
    rows = rows.filter((item) => (item.college || "").toLowerCase().includes(college));
  }

  rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const header = ["id", "college", "bank", "upi", "studentId", "amount", "transactionRef", "note", "status", "createdAt", "updatedAt"];
  const lines = [header.join(",")];
  rows.forEach((row) => {
    const line = header.map((key) => csvEscape(row[key] ?? "")).join(",");
    lines.push(line);
  });

  const csv = lines.join("\n");
  const filenameSuffix = college ? college.replace(/[^a-z0-9]+/g, "-") : "all";
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename=trustchain-payments-${filenameSuffix}.csv`);
  res.send(csv);
});

app.get("/api/wallet/items", (req, res) => {
  const studentId = normalizeStudentId(req.query?.studentId);
  const category = (req.query?.category || "").toString().trim().toLowerCase();
  const limit = Math.max(1, Math.min(200, Number(req.query?.limit || 100)));

  if (!studentId) {
    res.status(400).json({ error: "Invalid payload", detail: "studentId is required." });
    return;
  }

  let rows = readWalletItems().filter((item) => normalizeStudentId(item.ownerStudentId) === studentId);
  if (category && category !== "all") {
    rows = rows.filter((item) => (item.category || "").toLowerCase() === category);
  }

  rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const items = rows.slice(0, limit).map((item) => ({
    ...item,
    downloadPath: `/api/wallet/items/${item.id}/download`,
  }));

  res.json({ items, total: rows.length, storage: walletItemsFile });
});

app.post("/api/wallet/items", (req, res) => {
  walletUpload.single("file")(req, res, (error) => {
    if (error) {
      const detail = error instanceof Error ? error.message : "Upload failed";
      res.status(400).json({ error: "Upload failed", detail });
      return;
    }

    const studentId = normalizeStudentId(req.body?.studentId);
    const title = (req.body?.title || "").toString().trim();
    const category = (req.body?.category || "Document").toString().trim() || "Document";
    const note = (req.body?.note || "").toString().trim();
    const file = req.file;

    if (!studentId || !title || !file) {
      if (file?.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      res.status(400).json({ error: "Invalid payload", detail: "studentId, title and file are required." });
      return;
    }

    const rows = readWalletItems();
    const item = {
      id: `wallet_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      ownerStudentId: studentId,
      title,
      category,
      note,
      fileName: file.originalname,
      fileType: file.mimetype || "application/octet-stream",
      fileSize: file.size,
      storedName: file.filename,
      createdAt: new Date().toISOString(),
    };

    rows.push(item);
    writeWalletItems(rows);
    res.status(201).json({
      item: {
        ...item,
        downloadPath: `/api/wallet/items/${item.id}/download`,
      },
      storage: walletItemsFile,
    });
  });
});

app.get("/api/wallet/items/:id/download", (req, res) => {
  const id = (req.params?.id || "").toString().trim();
  const studentId = normalizeStudentId(req.query?.studentId);
  if (!id) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  if (!studentId) {
    res.status(400).json({ error: "Invalid payload", detail: "studentId is required." });
    return;
  }

  const rows = readWalletItems();
  const item = rows.find((row) => row.id === id && normalizeStudentId(row.ownerStudentId) === studentId);
  if (!item) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const safeStoredName = path.basename(item.storedName || "");
  const filePath = path.join(walletUploadsDir, safeStoredName);
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: "File missing" });
    return;
  }

  res.download(filePath, item.fileName || "document");
});

app.delete("/api/wallet/items/:id", (req, res) => {
  const id = (req.params?.id || "").toString().trim();
  const studentId = normalizeStudentId(req.query?.studentId);
  if (!id) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  if (!studentId) {
    res.status(400).json({ error: "Invalid payload", detail: "studentId is required." });
    return;
  }

  const rows = readWalletItems();
  const index = rows.findIndex((row) => row.id === id && normalizeStudentId(row.ownerStudentId) === studentId);
  if (index < 0) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const [removed] = rows.splice(index, 1);
  writeWalletItems(rows);

  const safeStoredName = path.basename(removed.storedName || "");
  const filePath = path.join(walletUploadsDir, safeStoredName);
  if (safeStoredName && fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch {
      // Ignore file remove error; metadata is already removed.
    }
  }

  res.json({ ok: true, removed, storage: walletItemsFile });
});

function extractN8nText(payload) {
  if (!payload) return "";
  if (typeof payload === "string") return payload.trim();
  if (Array.isArray(payload)) {
    for (const item of payload) {
      const text = extractN8nText(item);
      if (text) return text;
    }
    return "";
  }
  if (typeof payload === "object") {
    const directKeys = ["output", "response", "reply", "text", "answer"];
    for (const key of directKeys) {
      if (typeof payload[key] === "string" && payload[key].trim()) {
        return payload[key].trim();
      }
    }
    if (typeof payload.message === "string" && payload.message.trim()) {
      return payload.message.trim();
    }
    if (payload.message?.content) {
      return extractN8nText(payload.message.content);
    }
    if (payload.content) {
      return extractN8nText(payload.content);
    }
    if (payload.data) {
      return extractN8nText(payload.data);
    }
  }
  return "";
}

app.post("/api/n8n/chat", async (req, res) => {
  const system = req.body?.system || "";
  const messages = Array.isArray(req.body?.messages) ? req.body.messages : [];
  const latestUserMessage = [...messages].reverse().find((message) => message?.role === "user")?.content || req.body?.input || "";
  const sessionId = req.body?.sessionId || "firstgen-guide";

  const candidateBodies = [
    {
      chatInput: latestUserMessage,
      sessionId,
      action: "sendMessage",
      metadata: { system, messages },
    },
    {
      message: latestUserMessage,
      sessionId,
      system,
      messages,
    },
    {
      input: latestUserMessage,
      sessionId,
      context: { system, messages },
    },
    {
      query: latestUserMessage,
      sessionId,
      history: messages,
    },
  ];

  let lastError = "Webhook unavailable";
  const webhookCandidates = buildN8nWebhookCandidates(n8nChatWebhook);

  for (const webhookUrl of webhookCandidates) {
    for (const body of candidateBodies) {
      try {
        const response = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(15000),
        });

        const rawText = await response.text();
        if (!response.ok) {
          lastError = `${response.status} ${response.statusText}: ${rawText.slice(0, 300)}`;
          continue;
        }

        let parsed = rawText;
        try {
          parsed = JSON.parse(rawText);
        } catch {
          // Keep raw text when response is not JSON.
        }

        const output = extractN8nText(parsed) || rawText.trim();
        if (output) {
          res.json({ message: { content: output }, source: "n8n", webhook: webhookUrl });
          return;
        }

        lastError = "Webhook returned no usable response text.";
      } catch (error) {
        lastError = error instanceof Error ? error.message : "Unknown webhook error";
      }
    }
  }

  const isRegistrationError = /not registered|workflow must be active/i.test(lastError);
  res.status(502).json({
    error: "Failed to reach n8n chat webhook.",
    detail: isRegistrationError
      ? "Your n8n webhook is not active or the URL is incorrect. Activate the workflow or share the working test/production webhook URL."
      : lastError,
    rawDetail: lastError,
    webhook: n8nChatWebhook,
    tried: webhookCandidates,
  });
});

// ── Ollama status ────────────────────────────────────────────────────────────
app.get("/api/ollama/status", async (_req, res) => {
  try {
    const r = await fetch(`${ollamaUrl}/api/tags`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!r.ok) {
      res.json({ reachable: false, available: false, models: [] });
      return;
    }
    const data = await r.json();
    const models = (data.models || []).map((m) => m.name);
    const available = models.some(
      (name) => name === ollamaModelDefault || name.startsWith(`${ollamaModelDefault}:`),
    );
    res.json({
      reachable: true,
      available,
      models,
      defaultModel: ollamaModelDefault,
      missingDefaultModel: available && !models.includes(ollamaModelDefault),
    });
  } catch {
    res.json({ reachable: false, available: false, models: [] });
  }
});

// ── Ollama chat (SSE streaming) ──────────────────────────────────────────────
app.post("/api/ollama/chat", async (req, res) => {
  const model = req.body?.model || ollamaModelDefault;
  const system = req.body?.system || "";
  const messages = Array.isArray(req.body?.messages) ? req.body.messages : [];

  const ollamaMessages = system
    ? [{ role: "system", content: system }, ...messages]
    : messages;

  try {
    const ollamaRes = await fetch(`${ollamaUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages: ollamaMessages, stream: true }),
    });

    if (!ollamaRes.ok) {
      const errText = await ollamaRes.text();
      const detail = errText.slice(0, 300);
      const modelMissing = /not found/i.test(detail);
      res.status(ollamaRes.status).json({
        error: "Ollama returned an error",
        detail,
        code: modelMissing ? "MODEL_NOT_FOUND" : "OLLAMA_ERROR",
      });
      return;
    }

    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const reader = ollamaRes.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buf += decoder.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const json = JSON.parse(trimmed);
          if (json.message?.content) {
            res.write(`data: ${JSON.stringify({ delta: json.message.content, done: false })}\n\n`);
          }
          if (json.done === true) {
            res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
          }
        } catch {
          // skip malformed lines
        }
      }
    }

    res.end();
  } catch (error) {
    if (!res.headersSent) {
      res.status(502).json({
        error: `Failed to reach Ollama at ${ollamaUrl}. Make sure it is running.`,
        detail: error instanceof Error ? error.message : "Unknown error",
      });
    } else {
      res.write(`data: ${JSON.stringify({ done: true, error: true })}\n\n`);
      res.end();
    }
  }
});

app.post("/api/v1/messages", async (req, res) => {
  if (!configured) {
    res.status(503).json({
      message: "Add a real ANTHROPIC_API_KEY to your environment before using chat.",
    });
    return;
  }

  const payload = {
    model: req.body?.model || "claude-sonnet-4-20250514",
    max_tokens: req.body?.max_tokens || 1000,
    system: req.body?.system || "",
    messages: Array.isArray(req.body?.messages) ? req.body.messages : [],
  };

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "anthropic-version": "2023-06-01",
        "x-api-key": apiKey,
      },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    const contentType = response.headers.get("content-type") || "application/json";

    res.status(response.status);
    res.setHeader("Content-Type", contentType);
    res.send(text);
  } catch (error) {
    res.status(502).json({
      message: "Failed to reach Anthropic API.",
      detail: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));

  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) {
      next();
      return;
    }

    res.sendFile(path.join(frontendDist, "index.html"));
  });
}

app.listen(port, () => {
  console.log(`FirstGen backend listening on http://localhost:${port}`);
  console.log(`Anthropic key configured: ${configured ? "yes" : "no"}`);
  console.log(`Ollama endpoint: ${ollamaUrl} (default model: ${ollamaModelDefault})`);
});
