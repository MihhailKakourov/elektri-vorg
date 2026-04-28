# power-bot-mihhail-eduard

Node.js API for controlling a smart boiler based on Nord Pool electricity prices.
Fetches spot prices from the Elering API, applies VAT conversion, and determines
device state by comparing the result against a configurable threshold.

## Requirements

- Node.js 18+
- Docker (optional)

## Configuration

Environment variables:

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | HTTP server port |
| `THRESHOLD_EUR` | `0.10` | Price threshold in EUR/kWh |
| `UPDATE_INTERVAL_MS` | `900000` | Price update interval in milliseconds (15 min) |

## Running

```bash
npm install
npm start
```

Development mode with auto-restart:

```bash
npm run dev
```

## Docker

```bash
docker build -t power-bot-mihhail-eduard .
docker run -d -p 3000:3000 --restart unless-stopped power-bot-mihhail-eduard
```

## API

### GET /api/boiler/status

Returns current device state.

```json
{
  "status": "ON",
  "current_price_eur": 0.0170922,
  "threshold": 0.1,
  "last_updated": "2026-04-28T05:49:56.684Z"
}
```

`status` is `ON` when `current_price_eur <= threshold`, otherwise `OFF`.

### GET /health

```json
{
  "ok": true,
  "uptime": 10.94
}
```

## Price conversion

Source data from Elering is in EUR/MWh. Conversion to EUR/kWh with 22% VAT:

```
price_eur_kwh = (price_eur_mwh / 1000) * 1.22
```

## Fail-safe behavior

If the Elering API becomes unreachable, the service retains the last known state
and returns HTTP 502 with the cached data. On startup, if no data has been fetched
yet, it returns HTTP 503.

## License

Apache-2.0
