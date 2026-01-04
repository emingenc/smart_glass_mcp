# Mentra Glasses MCP Server

An MCP server for controlling MentraOS smart glasses via AI.

## What it does

- Exposes MCP tools that let AI assistants (Claude, Cursor, etc.) display text on your glasses
- Works with any MentraOS-compatible glasses (Even Realities G1, Vuzix, etc.)
- Mobile support out of the box (MentraOS handles the phone-to-glasses connection)

## Architecture

```
LLM/MCP Client → This MCP Server → MentraOS SDK → MentraOS Cloud → Phone App → Glasses
     (Claude)        (Next.js)        (@mentra/sdk)     (relay)      (Mentra)    (G1)
```

One server. No bridges. No Redis. MentraOS handles everything.

## Tools

| Tool | Description |
|------|-------------|
| `glasses.display_text` | Display text on glasses |
| `glasses.list_sessions` | List active glasses sessions |

## Setup

1. **Register your app** at https://console.mentra.glass
   - Get your `PACKAGE_NAME` and `MENTRAOS_API_KEY`

2. **Configure environment**:
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local`:
   ```bash
   MCP_API_KEYS=your-mcp-api-key
   PACKAGE_NAME=com.yourname.yourapp
   MENTRAOS_API_KEY=your-mentra-api-key
   ```

3. **Run**:
   ```bash
   pnpm install
   pnpm dev
   ```

4. **Expose publicly** (for MentraOS to reach your server):
   ```bash
   ngrok http 3000
   ```
   Update your app's Public URL in the Mentra console.

## Testing

### Test with script
```bash
node scripts/test-mcp.mjs
```

### Test with curl
```bash
# List sessions
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-mcp-api-key" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "glasses.list_sessions",
      "arguments": {}
    }
  }'

# Display text on glasses
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-mcp-api-key" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "glasses.display_text",
      "arguments": {
        "text": "Hello from MCP!",
        "durationMs": 3000
      }
    }
  }'
```

5. **Connect MCP client** (e.g., Claude Desktop):
   ```json
   {
     "mentra-glasses": {
       "command": "npx",
       "args": ["-y", "mcp-remote", "https://your-ngrok-url.ngrok.io/mcp"]
     }
   }
   ```

## Auth

Requires `Authorization: Bearer <key>` header. Set `MCP_API_KEYS` env var (comma-separated for multiple keys).

## Deployment

- **MentraOS runs on a long-lived server** (not pure serverless)
- Recommended: Railway, Fly.io, or any Node.js host
- Vercel works with Fluid Compute enabled (set `maxDuration: 800`)
