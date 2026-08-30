import express from "express";
import QRCode from "qrcode";
import path from "path";
import { fileURLToPath } from "url";
import {
  collectResearch
} from "./public/js/core/work/research/service.js";

const app = express();
const PORT = process.env.PORT || 3100;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* =========================================================
   NHIMY — SERVER
   Base preparada para produção
   ========================================================= */

app.disable("x-powered-by");

/* ---------------------------------------------------------
   JSON
   --------------------------------------------------------- */

app.use(express.json({
  limit: "100kb"
}));

/* ---------------------------------------------------------
   HEADERS DE SEGURANÇA
   --------------------------------------------------------- */

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  next();
});

/* ---------------------------------------------------------
   ARQUIVOS PÚBLICOS
   --------------------------------------------------------- */

app.use(
  express.static(path.join(__dirname, "public"), {
    extensions: ["html"],
    maxAge: process.env.NODE_ENV === "production"
      ? "1h"
      : 0
  })
);

/* =========================================================
   QR CODE
   ========================================================= */

app.post("/api/qr", async (req, res) => {
  try {
    const text = String(req.body?.text || "").trim();

    if (!text) {
      return res.status(400).json({
        ok: false,
        error: "Digite um texto ou link."
      });
    }

    if (text.length > 2000) {
      return res.status(400).json({
        ok: false,
        error: "O texto é demasiado longo."
      });
    }

    const qr = await QRCode.toDataURL(text, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 300
    });

    return res.json({
      ok: true,
      qr
    });

  } catch (error) {
    console.error("Erro QR:", error);

    return res.status(500).json({
      ok: false,
      error: "Não foi possível gerar o QR Code."
    });
  }
});

/* =========================================================
   RESEARCH
   ========================================================= */

app.post("/api/research", async (req, res) => {
  try {
    const request = req.body;

    const result =
      await collectResearch(request);

    return res.json({
      ok: true,
      result
    });

  } catch (error) {
    console.error("Erro Research:", error);

    return res.status(400).json({
      ok: false,
      error: error.message
    });
  }
});


/* =========================================================
   HEALTH CHECK
   ========================================================= */

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    project: "Nhimy",
    status: "online"
  });
});

/* =========================================================
   404 PARA API
   ========================================================= */

app.use("/api", (req, res) => {
  res.status(404).json({
    ok: false,
    error: "Endpoint não encontrado."
  });
});

/* =========================================================
   ERRO GLOBAL
   ========================================================= */

app.use((error, req, res, next) => {
  console.error("Erro interno:", error);

  if (res.headersSent) {
    return next(error);
  }

  res.status(500).json({
    ok: false,
    error: "Erro interno do servidor."
  });
});

/* =========================================================
   START
   ========================================================= */

app.listen(PORT, "0.0.0.0", () => {
  console.log("======================================");
  console.log(" NHIMY ONLINE");
  console.log(` PORTA: ${PORT}`);
  console.log(" AMBIENTE:", process.env.NODE_ENV || "development");
  console.log("======================================");
});
