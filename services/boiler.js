/**
 * Evaluates whether the boiler should be ON or OFF
 * based on the current price and threshold.
 *
 * @param {number} priceEurKwh - Current price in EUR/kWh (incl. VAT)
 * @param {number} thresholdEur - Threshold in EUR/kWh
 * @returns {'ON' | 'OFF'}
 */
function evaluateStatus(priceEurKwh, thresholdEur) {
  return priceEurKwh <= thresholdEur ? 'ON' : 'OFF';
}

module.exports = { evaluateStatus };
