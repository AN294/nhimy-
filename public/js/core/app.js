"use strict";

import { initNavigation } from "../ui/navigation.js";
import { initQrTool } from "../modules/qr.js";
import { initImageCompressor } from "../modules/image-compressor.js";
import { initImageResizer } from "../modules/image-resizer.js";
import { initPdfTool } from "../modules/pdf.js";
import { initPasswordTool } from "../modules/password.js";
import { initTextTools } from "../modules/text.js";
import { initPercentageTool } from "../modules/calculator.js";
import { initConverterTool } from "../modules/converter.js";
import { initUrlTool } from "../modules/url.js";
import { initJsonTool } from "../modules/json.js";
import { initGeneratorTool } from "../modules/generator.js";

function initApp() {
  initNavigation();

  initQrTool();
  initImageCompressor();
  initImageResizer();
  initPdfTool();
  initPasswordTool();
  initTextTools();
  initPercentageTool();
  initConverterTool();
  initUrlTool();
  initJsonTool();
  initGeneratorTool();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}
