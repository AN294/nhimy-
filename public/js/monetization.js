const CONSENT_KEY = "nhimy.ads.consent";

export function getAdConsent() {
  try { return localStorage.getItem(CONSENT_KEY) || "unknown"; } catch (_) { return "unknown"; }
}

export function setAdConsent(value) {
  const normalized = ["granted", "denied"].includes(value) ? value : "unknown";
  try { localStorage.setItem(CONSENT_KEY, normalized); } catch (_) {}
  return normalized;
}

export function monetizationEnabled(config = {}) {
  return config.enabled === true && Boolean(config.provider) && Boolean(config.publisherId);
}

/**
 * Publicidade só pode ser carregada quando a configuração do fornecedor está
 * ativa e o utilizador deu consentimento explícito. Esta função não carrega
 * nenhum fornecedor por si só; ela é a barreira única para a futura integração.
 */
export function canLoadAds(config = {}) {
  return monetizationEnabled(config) && getAdConsent() === "granted";
}

export function createAdPlaceholder(label = "Espaço publicitário") {
  const el = document.createElement("div");
  el.className = "nhimy-ad-slot";
  el.setAttribute("data-monetization", "prepared");
  el.setAttribute("aria-label", label);
  el.textContent = "Publicidade — preparada, não ativada";
  return el;
}
