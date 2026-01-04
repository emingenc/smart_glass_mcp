# ngrok + Mentra Testing Setup Guide

Complete walkthrough for testing your MCP server with real MentraOS glasses.

## 📋 Prerequisites

- ✅ MentraOS app installed on your phone (from MentraGlass.com/OS)
- ✅ ngrok account (free at ngrok.com)
- ✅ `com.emin.glassmcp` already configured in `.env.local`
- ✅ TypeScript build passing (`pnpm run build`)

---

## 🔧 Step 1: Install & Configure ngrok

### 1a. Install ngrok
```bash
# macOS (using Homebrew)
brew install ngrok

# Or download from https://ngrok.com/download
```

Verify installation:
```bash
ngrok --version
```

### 1b. Create ngrok Account
1. Go to **https://ngrok.com/**
2. Click **Sign Up** → Create free account
3. Check your email and verify

### 1c. Get Your Auth Token
1. Log in to **https://dashboard.ngrok.com/**
2. Go to **Auth** tab (left sidebar)
3. Copy your **Authtoken**
4. Run:
```bash
ngrok config add-authtoken YOUR_AUTHTOKEN_HERE
```

### 1d. Create Static Domain
1. In dashboard, go to **Cloud Edge** → **Domains**
2. Click **Create Domain**
3. Choose a name: `emin-glassmcp` → generates `https://emin-glassmcp.ngrok.io`
4. Copy your static domain URL

---

## 🌐 Step 2: Register App with Mentra Console

### 2a. Go to Mentra Console
1. Open **https://console.mentraglass.com/**
2. Log in with your MentraOS account

### 2b. Create/Update App
1. Click **Create App** (or find your existing `com.emin.glassmcp`)
2. Fill in:
   ```
   Package Name:  com.emin.glassmcp
   Public URL:    https://emin-glassmcp.ngrok.io
   ```
3. Click **Permissions** → Add **Microphone** ✅
4. Save

### 2c. Verify Installation
1. Open **Mentra app** on your phone
2. Swipe to your apps
3. You should see `com.emin.glassmcp` (newly installed)

---

## 🚀 Step 3: Start the Dev Stack

### Terminal 1: Start Next.js Server
```bash
cd /Users/emingenc/Documents/mcp-for-next.js
pnpm dev
```

Expected output:
```
▲ Next.js 15.1.0
- Local:        http://localhost:3000
- Environments: .env.local

 ✓ Ready in 2.1s
```

### Terminal 2: Expose with ngrok
```bash
ngrok http --url=emin-glassmcp.ngrok.io 3000
```

Replace `emin-glassmcp.ngrok.io` with YOUR static domain from Step 1d.

Expected output:
```
ngrok                                                          (Ctrl+C to quit)

Session Status                online
Account                       your-email@example.com
Version                       3.x.x
Region                        United States (us)
Forwarding                    https://emin-glassmcp.ngrok.io -> http://localhost:3000
Connections                   ttl    opn    dl   rx/tx
                              0      0      0    0B/0B
```

✅ Your app is now accessible at `https://emin-glassmcp.ngrok.io/mcp`

---

## 📱 Step 4: Connect Glasses

1. Open **Mentra app** on your phone
2. Find your app: **com.emin.glassmcp**
3. Tap **Start App**
4. Glasses should display a connection message
5. Your server will log:
   ```
   [Mentra] New session: abc123-def456
   User ID: user-xyz
   ```

---

## ✅ Step 5: Test MCP Tools

Once glasses are connected, run in Terminal 3:

```bash
cd /Users/emingenc/Documents/mcp-for-next.js
node scripts/test-mcp.mjs
```

### What the tests do:
1. **List tools** - Verify all 8 MCP tools are available
2. **List sessions** - Show your connected glasses
3. **Display text** - Show "Hello from MCP!" on glasses
4. **Get transcriptions** - Test voice input

Expected output:
```
✓ MCP Tools Available (8):
  - glasses.display_text
  - glasses.speak
  - glasses.get_transcriptions
  - glasses.start_microphone
  - glasses.stop_microphone
  - glasses.get_events
  - glasses.clear_display
  - glasses.list_sessions

✓ Sessions: 
  - sessionId: abc123-def456
    userId: user-xyz

✓ Display Text Result:
  Text displayed on abc123-def456.
```

---

## 🎤 Step 6: Test Voice I/O (Manual)

### 6a. Start Microphone
```bash
curl -X POST http://localhost:3000/mcp \
  -H "Authorization: Bearer test-secret-key-123" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "glasses.start_microphone",
      "arguments": {}
    }
  }'
```

### 6b. Speak into Glasses
- Tap the button on glasses to activate voice input
- Say something: "Hello world"

### 6c. Get Transcriptions
```bash
curl -X POST http://localhost:3000/mcp \
  -H "Authorization: Bearer test-secret-key-123" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "glasses.get_transcriptions",
      "arguments": {"clear": true}
    }
  }'
```

### 6d. Expected Response
```json
[
  {
    "text": "Hello world",
    "isFinal": true,
    "timestamp": "2026-01-03T14:22:31.000Z",
    "speakerId": "speaker-1",
    "language": "en-US"
  }
]
```

### 6e. Stop Microphone
```bash
curl -X POST http://localhost:3000/mcp \
  -H "Authorization: Bearer test-secret-key-123" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "glasses.stop_microphone",
      "arguments": {}
    }
  }'
```

---

## 🧪 Complete Test Workflow

```bash
# Terminal 1: Next.js dev server
pnpm dev

# Terminal 2: ngrok tunnel (keep running)
ngrok http --url=emin-glassmcp.ngrok.io 3000

# Terminal 3: Run test suite
node scripts/test-mcp.mjs

# Terminal 4 (optional): Manual curl tests
# Copy curl commands from Step 6 above
```

---

## 🐛 Troubleshooting

### "Connection refused" from glasses
- ✅ Check ngrok is running: should see `Forwarding: https://...`
- ✅ Check console.mentraglass.com has correct URL
- ✅ Wait 30s for Mentra cloud to sync
- ✅ Restart Mentra app on phone

### "No active glasses session"
- ✅ Tap "Start App" again in Mentra
- ✅ Check Terminal 1 shows new session logs
- ✅ Verify ngrok tunnel is active

### "Test failed: unauthorized"
- ✅ Check Bearer token in `.env.local`: `test-secret-key-123`
- ✅ Token must match `MCP_API_KEYS` env var

### Voice input not working
- ✅ Tap button on glasses to activate mic
- ✅ Run `glasses.start_microphone` first
- ✅ Check Mentra app has microphone permission
- ✅ Allow microphone when glasses ask

### Timeout errors
- ✅ Increase `maxDuration` in `app/mcp/route.ts`
- ✅ Check internet connection on phone
- ✅ Verify ngrok is still connected

---

## 📊 Production Deployment

Once testing works, replace ngrok with:
- **Vercel** (automatic): `vercel deploy`
- **AWS Lambda** + API Gateway
- **Azure Functions**
- **Your own server** (update console.mentraglass.com Public URL)

For now, ngrok is perfect for development! 🚀

---

## 🔑 Key Files

- **`.env.local`** - Your API keys (keep secret!)
- **`app/mcp/route.ts`** - MCP endpoint with 8 tools
- **`scripts/test-mcp.mjs`** - Test harness
- **`PRODUCT.md`** - Architecture overview

---

## ✅ Checklist

- [ ] ngrok installed & authenticated
- [ ] Static domain created
- [ ] App registered in console.mentraglass.com
- [ ] `.env.local` filled with credentials
- [ ] `pnpm dev` running (Terminal 1)
- [ ] `ngrok http ...` running (Terminal 2)
- [ ] Mentra app shows `com.emin.glassmcp`
- [ ] Tap "Start App" → glasses connect
- [ ] `node scripts/test-mcp.mjs` passes
- [ ] Voice I/O curl tests work
- [ ] Ready to build LLM integration! 🎉
