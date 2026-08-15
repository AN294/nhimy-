import express from "express";
import QRCode from "qrcode";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 3100;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));


app.post("/api/qr", async (req, res) => {
  try {
    const text = String(req.body?.text || "").trim();

    if (!text) {
      return res.status(400).json({
        ok: false,
        error: "Digite um texto ou link."
      });
    }

    const qr = await QRCode.toDataURL(text, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 300
    });

    res.json({
      ok: true,
      qr
    });
  } catch (error) {
    console.error("Erro QR:", error);
    res.status(500).json({
      ok: false,
      error: "Não foi possível gerar o QR Code."
    });
  }
});

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    project: "Nhimy",
    status: "online"
  });
});

app.listen(PORT, () => {
  console.log(`Nhimy online na porta ${PORT}`);
});
