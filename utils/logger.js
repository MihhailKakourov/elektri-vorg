/**
 * Structured logger for STDOUT, formatted for Loki ingestion.
 * Format: [LEVEL] ts=<ISO> key1=value1 key2=value2 ...
 *
 * @param {'INFO' | 'WARN' | 'ERROR'} level
 * @param {Record<string, string | number>} fields
 */
function log(level, fields) {
  const ts = new Date().toISOString();
  const parts = [`[${level}]`, `ts=${ts}`];

  for (const [key, value] of Object.entries(fields)) {
    parts.push(`${key}=${value}`);
  }

  console.log(parts.join(' '));
}

module.exports = { log };
