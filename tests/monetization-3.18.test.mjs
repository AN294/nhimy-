import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("3.18 monetização fica preparada sem ativação ou métricas falsas", async () => {
  const route = await readFile("routes/admin.js", "utf8");
  const client = await readFile("public/js/monetization.js", "utf8");
  assert.match(route, /NHIMY_AD_PROVIDER/);
  assert.match(route, /NHIMY_AD_PUBLISHER_ID/);
  assert.match(route, /NHIMY_ADS_ENABLED/);
  assert.match(route, /available:false/);
  assert.match(client, /nhimy\.ads\.consent/);
  assert.match(client, /prepared/);
  assert.match(client, /monetizationEnabled/);
  assert.match(client, /getAdConsent\(\) === "granted"/);
});
