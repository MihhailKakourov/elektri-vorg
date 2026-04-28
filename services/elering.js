const ELERING_API_URL = 'https://dashboard.elering.ee/api/nps/price?fields=ee';

/**
 * Fetches the current electricity price from Elering API.
 * Returns the price in EUR/MWh for the current time slot.
 */
async function fetchCurrentPrice() {
  const response = await fetch(ELERING_API_URL);

  if (!response.ok) {
    throw new Error(`Elering API returned HTTP ${response.status}`);
  }

  const json = await response.json();

  if (!json.success || !json.data || !json.data.ee || json.data.ee.length === 0) {
    throw new Error('Elering API returned invalid or empty data');
  }

  const prices = json.data.ee;
  const nowUnix = Math.floor(Date.now() / 1000);

  // Find the price entry for the current time slot.
  // Entries are 15-minute intervals; find the one whose timestamp
  // is ≤ now and is the closest to now.
  let currentEntry = null;
  for (const entry of prices) {
    if (entry.timestamp <= nowUnix) {
      if (!currentEntry || entry.timestamp > currentEntry.timestamp) {
        currentEntry = entry;
      }
    }
  }

  // If no past entry found, use the earliest available
  if (!currentEntry) {
    currentEntry = prices[0];
  }

  return currentEntry.price; // EUR/MWh
}

module.exports = { fetchCurrentPrice };
