# Evolution API Setup Guide

## 1. Install Evolution API on your VPS

```bash
# Requirements: Docker + Docker Compose
git clone https://github.com/EvolutionAPI/evolution-api.git
cd evolution-api
cp .env.example .env
docker-compose up -d
```

Evolution API will run on `http://your-vps-ip:8080`

---

## 2. Create an Instance (connect your WhatsApp)

```bash
# Create instance
curl -X POST http://localhost:8080/instance/create \
  -H "apikey: your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"instanceName": "my-bot", "qrcode": true}'
```

Then scan the QR code with the WhatsApp Business phone.

---

## 3. Set the Webhook

Tell Evolution API to forward incoming messages to your bot:

```bash
curl -X POST http://localhost:8080/webhook/set/my-bot \
  -H "apikey: your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-server.com/webhook",
    "webhook_by_events": false,
    "events": ["MESSAGES_UPSERT"]
  }'
```

---

## 4. Fill in your .env

```
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=your_api_key
EVOLUTION_INSTANCE=my-bot
OPENAI_API_KEY=sk-...
PORT=3000
```

---

## 5. Run the bot

```bash
npm install
npm run dev
```

---

## For local testing (without VPS)

Use ngrok to expose your local server:

```bash
ngrok http 3000
```

Then use the ngrok URL as your webhook URL in step 3.

---

## Recommended VPS

- **DigitalOcean / Contabo / Vultr** — $5–10/month
- Minimum: 1 vCPU, 1GB RAM, Ubuntu 22.04
