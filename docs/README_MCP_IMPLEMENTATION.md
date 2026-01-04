# MentraOS MCP Server - Implementation Complete

## 🎯 What We Built

A **pure MCP tool layer** that exposes all MentraOS capabilities to any LLM or MCP client. The LLM does all the thinking; we just provide the I/O.

## 🛠️ Available Tools

### Display & Output
- **`glasses.display_text`** - Show text on glasses (0-60s duration)
- **`glasses.speak`** - Text-to-speech with volume & speed control
- **`glasses.clear_display`** - Clear the glasses display

### Voice Input - THE KILLER FEATURE 🔊
- **`glasses.start_microphone`** - Start voice capture
- **`glasses.stop_microphone`** - Stop voice capture  
- **`glasses.get_transcriptions`** - Get buffered voice transcriptions
  - Returns: `[{text, isFinal, timestamp, speakerId, language}]`
  - **Use case**: Voice keyboard, dictation, real-time transcription stream

### Events & Interaction
- **`glasses.get_events`** - Get button/touch events from glasses
  - Returns: `[{type, data, timestamp}]`
  - **Use case**: User interactions, confirmations

### Session Management
- **`glasses.list_sessions`** - List all connected glasses sessions

## 🏗️ Architecture

```
┌─────────────────┐
│ LLM (Claude)    │  ← Handles all intelligence
└────────┬────────┘
         │ MCP Protocol
┌────────▼────────────────────────┐
│  This MCP Server (Next.js)       │  ← Pure tool layer
│  • Voice I/O                     │
│  • Display control               │
│  • Event buffering               │
└────────┬────────────────────────┘
         │ HTTP/WebSocket
┌────────▼────────────────────────┐
│  @mentra/sdk                     │  ← SDK transport
│  • Session management            │
│  • Cloud relay                   │
└────────┬────────────────────────┘
         │ REST API
┌────────▼────────────────────────┐
│  MentraOS Cloud                  │  ← Handles relay
└────────┬────────────────────────┘
         │
┌────────▼────────────────────────┐
│  Phone App + Smart Glasses       │
└─────────────────────────────────┘
```

## 🚀 Use Cases Enabled

### 1. Voice Keyboard for Coding
```
Developer taps button on glasses
  ↓ Glasses captures voice
  ↓ glasses.get_transcriptions returns "def hello_world():"
  ↓ LLM processes and completes code
  ↓ glasses.speak reads the answer
```

### 2. Hands-Free Claude
```
User: "What's in my calendar?"
  ↓ Voice → glasses.get_transcriptions
  ↓ LLM receives → processes
  ↓ LLM sends → glasses.display_text or glasses.speak
  ↓ Glasses shows/speaks answer
```

### 3. Real-time Thinking Display
```
LLM: "Let me think... analyzing your question"
  ↓ glasses.display_text("Analyzing...")
  ↓ glasses.display_text("Searching...")
  ↓ glasses.display_text("Complete!")
```

### 4. Visual Q&A (Phase 2)
```
User: "What am I looking at?"
  ↓ glasses.take_photo (future)
  ↓ LLM vision analysis
  ↓ glasses.speak("That's a coffee mug")
```

## 📋 MCP Tools Summary

| Tool | Input | Output | Purpose |
|------|-------|--------|---------|
| `glasses.display_text` | text, sessionId?, durationMs? | "Text displayed" | Show text on glasses |
| `glasses.speak` | text, sessionId?, volume?, speed? | "Speaking" | Text-to-speech |
| `glasses.get_transcriptions` | sessionId?, onlyFinal?, clear? | JSON transcriptions | Get voice input |
| `glasses.start_microphone` | sessionId? | "Started" | Open mic |
| `glasses.stop_microphone` | sessionId? | "Stopped" | Close mic |
| `glasses.get_events` | sessionId?, clear? | JSON events | Get button/touch events |
| `glasses.clear_display` | sessionId? | "Cleared" | Clear screen |
| `glasses.list_sessions` | (none) | JSON sessions | List connected glasses |

## 🔧 Configuration

### Environment Variables
```bash
# Mentra SDK (from console.mentra.glass)
PACKAGE_NAME=com.yourcompany.yourapp
MENTRAOS_API_KEY=your-mentra-api-key
MENTRA_PORT=3001

# MCP Security
MCP_API_KEYS=your-secret-token-1,your-secret-token-2
```

### Authentication
All MCP requests require:
```
Authorization: Bearer <token-from-MCP_API_KEYS>
```

## 📦 Implementation Details

### Session Management
- Sessions are created when glasses connect via Mentra app
- Each session has a unique `sessionId` and linked `userId`
- Transcriptions & events are buffered per session (max 50 & 20 respectively)

### Transcription Buffering
- Captures live transcriptions from glasses microphone
- Stores up to 50 recent transcriptions (memory-efficient)
- LLM can poll via `glasses.get_transcriptions`
- Can filter by `onlyFinal: true` for complete words only
- Can auto-clear buffer with `clear: true`

### Event Buffering
- Captures button presses and touch gestures
- Stores up to 20 recent events
- Includes timestamp and full event data

## 🎮 Integration Examples

### With Claude Desktop
```json
{
  "tools": [
    {
      "name": "mentra",
      "description": "Control MentraOS glasses",
      "url": "http://localhost:3000/mcp",
      "auth": {
        "type": "bearer",
        "token": "your-secret-token"
      }
    }
  ]
}
```

### With OpenAI API
Use MCP client library to expose these tools to GPT-4.

## 🧪 Testing

```bash
# Start server
pnpm dev

# Test with script
node scripts/test-mcp.mjs

# Or with curl
curl -X POST http://localhost:3000/mcp \
  -H "Authorization: Bearer test-secret-key-123" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "glasses.display_text",
      "arguments": {"text": "Hello from MCP!"}
    }
  }'
```

## 📈 Next Steps

### Phase 1 (COMPLETED ✅)
- [x] Text display & TTS
- [x] Voice transcription
- [x] Event capture
- [x] Microphone control

### Phase 2 (TODO)
- [ ] Camera/photo capture
- [ ] Audio file playback
- [ ] Battery status monitoring
- [ ] Location tracking

### Phase 3 (TODO)
- [ ] Dashboard layouts
- [ ] LED control
- [ ] Phone notification access
- [ ] Calendar integration

### Phase 4 (TODO)
- [ ] RTMP streaming
- [ ] Advanced gestures
- [ ] Streaming transcription (WebSocket)
- [ ] Real-time sensor data

## 📚 Resources

- [MentraOS Docs](https://docs.mentra.glass)
- [MCP Spec](https://spec.modelcontextprotocol.io)
- [Mentra Console](https://console.mentra.glass)
- [SDK GitHub](https://github.com/Mentra-Community/MentraOS-Cloud-Example-App)

## 🎓 Key Insight

**This server is intentionally simple.** We expose capabilities, LLM decides what to do. This separation of concerns means:

- ✅ LLM handles all context & reasoning
- ✅ Server just pipes I/O
- ✅ Easy to integrate with any LLM
- ✅ Easy to extend with new tools
- ✅ No vendor lock-in

**The intelligence lives in the LLM, not here.**
