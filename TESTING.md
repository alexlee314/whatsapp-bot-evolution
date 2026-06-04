# Testing — Oráculo Andino Bot (Twilio)

## Before you start

1. Copy `.env.example` → `.env` and fill in:
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_WHATSAPP_FROM` (e.g. `whatsapp:+14155238886`)
   - `OPENAI_API_KEY`
2. Install: `npm install`
3. Start bot: `npm run dev`
4. Confirm health: `http://localhost:3001/health`

## Local tests (no WhatsApp)

```powershell
npm test
npm run test:flow
```

## Twilio webhook payload (PowerShell)

First message:

```powershell
Invoke-RestMethod -Method Post -Uri "http://localhost:3001/webhook" -ContentType "application/json" -Body '{"From":"whatsapp:+51999000002","Body":"hola","NumMedia":"0"}'
```

Birth date:

```powershell
Invoke-RestMethod -Method Post -Uri "http://localhost:3001/webhook" -ContentType "application/json" -Body '{"From":"whatsapp:+51999000002","Body":"14/02/1995, Lima","NumMedia":"0"}'
```

With `WEBHOOK_RETURN_RESPONSES=true`, the response includes `replies` and `session`.

## Test with ngrok + Twilio

1. Run bot: `npm run dev`
2. `ngrok http 3001`
3. In [Twilio Console](https://console.twilio.com/) → Messaging → WhatsApp Sandbox (or your sender):
   - **When a message comes in:** `https://YOUR-NGROK-URL/webhook`
   - Method: **POST**
4. Set `WEBHOOK_RETURN_RESPONSES=false` for production (Twilio gets empty TwiML, replies sent via API).

## Dashboard

`http://localhost:3001/dashboard` — default password: `admin123` (set `DASHBOARD_PASSWORD` in `.env`).

Data API: `GET /dashboard/data` with header `X-Dashboard-Password` or query `?password=...`.

See [STRUCTURE.md](./STRUCTURE.md) for the full backend/frontend layout.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| No reply on WhatsApp | Check Twilio credentials and `TWILIO_WHATSAPP_FROM` |
| Webhook 404 | URL must end with `/webhook` |
| Payment OCR fails | User must send image; Twilio provides `MediaUrl0` |
| Still see JSON in prod | Set `WEBHOOK_RETURN_RESPONSES=false` |
