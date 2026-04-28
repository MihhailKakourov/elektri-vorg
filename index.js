const express = require('express');
const { fetchCurrentPrice } = require('./services/elering');
const { evaluateStatus } = require('./services/boiler');
const { log } = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3000;

// Default threshold: 10 cents/kWh = 0.10 EUR/kWh
const THRESHOLD_EUR = parseFloat(process.env.THRESHOLD_EUR || '0.10');

// Price update interval in ms (default: 15 minutes)
const UPDATE_INTERVAL_MS = parseInt(process.env.UPDATE_INTERVAL_MS || '900000', 10);

// ── In-memory state (fail-safe) ──────────────────────────────────
let lastState = {
  status: 'OFF',
  currentPriceEur: null,
  thresholdEur: THRESHOLD_EUR,
  lastUpdated: null,
  error: null,
};

// ── Periodic price update ────────────────────────────────────────
async function updatePrice() {
  try {
    const priceEurMwh = await fetchCurrentPrice();
    // Convert EUR/MWh → EUR/kWh, then add 22% VAT
    // Formula: (price / 1000) * 1.22
    const priceEurKwh = (priceEurMwh / 1000) * 1.22;

    const status = evaluateStatus(priceEurKwh, THRESHOLD_EUR);

    lastState = {
      status,
      currentPriceEur: priceEurKwh,
      thresholdEur: THRESHOLD_EUR,
      lastUpdated: new Date().toISOString(),
      error: null,
    };

    log('INFO', {
      service: 'power-bot-mihhail-eduard',
      price_eur: priceEurKwh.toFixed(6),
      status,
      threshold_eur: THRESHOLD_EUR.toFixed(6),
    });
  } catch (err) {
    lastState.error = err.message;
    lastState.lastUpdated = new Date().toISOString();

    log('ERROR', {
      service: 'power-bot-mihhail-eduard',
      message: `Price update failed: ${err.message}`,
    });
  }
}

// ── Routes ───────────────────────────────────────────────────────
app.get('/api/boiler/status', (req, res) => {
  // If we never fetched a price successfully, return 503
  if (lastState.currentPriceEur === null) {
    return res.status(503).json({
      error: 'Price data not yet available',
      status: lastState.status,
      threshold: lastState.thresholdEur,
    });
  }

  // If the last update resulted in an error, return 502
  // but still include the last known state (fail-safe)
  if (lastState.error) {
    return res.status(502).json({
      error: lastState.error,
      status: lastState.status,
      current_price_eur: lastState.currentPriceEur,
      threshold: lastState.thresholdEur,
      last_updated: lastState.lastUpdated,
    });
  }

  return res.json({
    status: lastState.status,
    current_price_eur: lastState.currentPriceEur,
    threshold: lastState.thresholdEur,
    last_updated: lastState.lastUpdated,
  });
});

// Health-check endpoint
app.get('/health', (_req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

// ── Start ────────────────────────────────────────────────────────
app.listen(PORT, async () => {
  console.log(`[power-bot-mihhail-eduard] Listening on http://localhost:${PORT}`);
  console.log(`[power-bot-mihhail-eduard] Threshold: ${THRESHOLD_EUR} EUR/kWh (${(THRESHOLD_EUR * 100).toFixed(1)} cents/kWh)`);
  console.log(`[power-bot-mihhail-eduard] Update interval: ${UPDATE_INTERVAL_MS / 1000}s`);

  // Fetch immediately on startup
  await updatePrice();

  // Then periodically
  setInterval(updatePrice, UPDATE_INTERVAL_MS);
});

module.exports = app;
