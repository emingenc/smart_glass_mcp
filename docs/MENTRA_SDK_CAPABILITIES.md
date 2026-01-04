# Mentra SDK Capabilities - Complete Reference

## Overview

This MCP server is a **pure I/O layer** that exposes all MentraOS capabilities as MCP tools. We don't do any LLM processing here - connected LLMs (Claude, GPT, etc.) handle all intelligence. We just provide the tools to:
- **Display text/images** on glasses
- **Capture voice transcriptions** from glasses microphone (live keyboard input!)
- **Play audio/TTS** on glasses
- **Monitor events** (buttons, touches, sensors)
- **Control hardware** (camera, LED, display)

## Philosophy: Pure Tool Layer

**What we DO:**
- Expose Mentra capabilities as MCP tools
- Buffer transcriptions, events, sensor data
- Route commands to/from glasses
- Handle session management

**What we DON'T do:**
- No LLM inference
- No prompt engineering
- No context awareness logic
- No decision making

**The LLM decides everything.** We just provide the I/O.

## Architecture

```
LLM (Claude/GPT) ←→ MCP Client ←→ This Server ←→ MentraOS SDK ←→ Cloud ←→ Phone ←→ Glasses
     [decides]         [protocol]    [tool layer]    [transport]   [relay]  [hardware]
```

This enables:
- **Voice-to-text keyboard**: Glasses mic → transcription → LLM gets it as input
- **Text-to-glasses display**: LLM output → display on glasses
- **Voice conversations**: User speaks → transcription → LLM → TTS → glasses speaker
- **Context awareness**: LLM requests location/calendar/battery and decides what to do

## Core Concepts

### Session
Each connected glasses device creates a session. Sessions provide:
- **Unique session ID** - Identify specific glasses connection
- **User ID** - Link to MentraOS user account
- **Lifecycle hooks** - onSession, onMessage, onDisconnect
- **Capability modules** - layouts, audio, camera, streams

### AppServer
Base class for creating Mentra apps. Handles:
- Cloud connection management
- Session lifecycle
- Message routing
- Authentication

## 🎨 Display & Layout Capabilities

### Text Display
- **TextWall** - Single text block with title/subtitle
- **DoubleTextWall** - Two text sections side-by-side
- **showTextWall()** - Quick method to display text

```typescript
session.layouts.showTextWall("Hello!", {
  view: ViewType.MAIN,
  durationMs: 3000
});
```

### Rich Content
- **DashboardCard** - Dashboard-style cards
- **ReferenceCard** - Reference content display
- **BitmapView** - Display images/bitmaps
- **ClearView** - Clear display

### Layout Options
- **ViewType**: MAIN, OVERLAY, DASHBOARD
- **Duration**: Timed display (durationMs)
- **Persistence**: Keep on screen until cleared

## 🔊 Audio Capabilities

### Audio Playback
```typescript
// Play audio from URL
await session.audio.playAudio({
  audioUrl: "https://example.com/sound.mp3",
  volume: 0.8,
  trackId: 0  // 0=speaker, 1=app_audio, 2=tts
});

// Stop audio
session.audio.stopAudio(trackId);
```

### Text-to-Speech
```typescript
await session.audio.speak("Hello from MCP!", {
  voice_id: "optional_voice_id",
  voice_settings: {
    stability: 0.5,
    speed: 1.2
  },
  volume: 0.8
});
```

### Track Management
- **Track 0** - Speaker (default audio)
- **Track 1** - App audio
- **Track 2** - TTS
- Multiple tracks can play simultaneously (mixing)

## 📷 Camera Capabilities

### Photo Capture
```typescript
// Take photo
await session.camera.takePhoto({
  saveToGallery: true,
  uploadToCloud: true
});

// Handle photo data
session.on("photoTaken", (photo) => {
  // photo.photoData: ArrayBuffer
  // photo.mimeType: string
  // photo.timestamp: Date
});
```

### Photo Options
- Save to device gallery
- Upload to cloud storage
- Real-time photo data streaming

## 🎤 Input Events from Glasses

### Button & Touch Events
```typescript
// Button press (short/long)
session.on("buttonPress", (event) => {
  // event.buttonId: string
  // event.pressType: "short" | "long"
});

// Touch gestures
session.on("touchEvent", (event) => {
  // event.gesture_name: string
  // event.device_model: string
});

// Head position
session.on("headPosition", (event) => {
  // event.position: "up" | "down"
});
```

### Voice & Transcription
```typescript
// Local transcription (on-device)
session.on("localTranscription", (event) => {
  // event.text: string
  // event.isFinal: boolean
  // event.speakerId: number
  // event.transcribeLanguage: string
  // event.provider: string
});

// Voice activity detection
session.on("vad", (event) => {
  // event.status: boolean - mic is picking up voice
});
```

### Microphone Control
```typescript
// Open/close microphone
session.microphone.setState(true);  // open
session.microphone.setState(false); // close
```

## 📍 Sensor & Context Data

### Location
```typescript
session.on("locationUpdate", (event) => {
  // event.lat: number
  // event.lng: number
  // event.accuracy: number
});
```

### Battery Status
```typescript
// Glasses battery
session.on("glassesBatteryUpdate", (event) => {
  // event.level: number (0-100)
  // event.charging: boolean
  // event.timeRemaining: number (optional)
});

// Phone battery
session.on("phoneBatteryUpdate", (event) => {
  // event.level: number
  // event.charging: boolean
});
```

### Connection State
```typescript
session.on("glassesConnectionState", (event) => {
  // event.modelName: string
  // event.status: string
  // event.wifi: { connected: boolean, ssid?: string }
});
```

### Calendar
```typescript
session.on("calendarEvent", (event) => {
  // event.eventId: string
  // event.title: string
  // event.dtStart: string
  // event.dtEnd: string
  // event.timezone: string
});
```

## 📱 Phone Integration

### Notifications
```typescript
// Incoming phone notification
session.on("phoneNotification", (event) => {
  // event.notificationId: string
  // event.app: string
  // event.title: string
  // event.content: string
  // event.priority: "low" | "normal" | "high"
});

// Notification dismissed
session.on("phoneNotificationDismissed", (event) => {
  // event.notificationId: string
  // event.notificationKey: string
});
```

## 🎥 Advanced Features

### RTMP Streaming
```typescript
// Start RTMP stream
await session.rtmp.startStream({
  rtmpUrl: "rtmp://server.com/live/stream",
  streamKey: "key",
  videoConfig: { /* video settings */ },
  audioConfig: { /* audio settings */ }
});

// Monitor stream status
session.on("rtmpStreamStatus", (event) => {
  // event.status: "streaming" | "error" | "stopped" | ...
  // event.stats: { bitrate, fps, droppedFrames, duration }
});
```

### RGB LED Control
```typescript
await session.led.setColor({
  red: 255,
  green: 0,
  blue: 0,
  brightness: 128,
  pattern: "solid" // or "blink", "pulse"
});
```

## 🔐 Security & Auth

### Authentication
- Bearer token via `MCP_API_KEYS` environment variable
- Each MCP request must include `Authorization: Bearer <token>`
- Mentra SDK handles cloud authentication with `MENTRAOS_API_KEY`

### Session Security
- Sessions are user-scoped (userId from MentraOS)
- Apps can only access their own sessions
- Cloud validates all requests

## �️ MCP Tools Implementation Plan

### Core Display & Output (Phase 1)
- ✅ `glasses.display_text` - Show text on glasses
- ✅ `glasses.speak` - Text-to-speech on glasses
- ✅ `glasses.clear_display` - Clear glasses display
- ✅ `glasses.list_sessions` - List active glasses sessions
- `glasses.play_audio` - Play audio file from URL
- `glasses.stop_audio` - Stop audio playback

### Voice Input - THE KILLER FEATURE (Phase 1)
- ✅ `glasses.start_microphone` - Start voice capture
- ✅ `glasses.stop_microphone` - Stop voice capture
- ✅ `glasses.get_transcriptions` - Get buffered transcriptions
  - Returns array of transcriptions with timestamps
  - LLM can poll this or request on-demand
  - **Use case**: Voice coding, dictation, conversation

### Events & Interaction (Phase 2)
- ✅ `glasses.get_events` - Get button/touch events
- `glasses.wait_for_button` - Block until button press (for confirmations)
- `glasses.vibrate` - Haptic feedback

### Camera & Vision (Phase 2)
- `glasses.take_photo` - Capture photo from glasses
- `glasses.get_photo_data` - Get last captured photo as base64
- **Use case**: LLM can see what user sees → visual Q&A

### Context Sensing (Phase 3)
- `glasses.get_location` - Current GPS position
- `glasses.get_battery` - Battery levels (glasses + phone)
- `glasses.get_calendar_events` - Upcoming calendar events
- `glasses.get_phone_notifications` - Recent notifications
- **Use case**: LLM gets context, decides what to show/speak

### Advanced Features (Phase 4)
- `glasses.led_control`atus

### ✅ Phase 1: Voice I/O Loop (COMPLETED)
- [x] Display text on glasses (`glasses.display_text`)
- [x] Text-to-speech (`glasses.speak`)
- [x] Voice transcription capture (`glasses.get_transcriptions`)
- [x] Microphone control (`glasses.start_microphone`, `glasses.stop_microphone`)
- [x] Session management (`glasses.list_sessions`)
- [x] Clear display (`glasses.clear_display`)
- [x] Event capture (`glasses.get_events`)

**Result**: Full bidirectional voice conversation loop ready!

### 🚧 Phase 2: Context & Sensing (TODO)
- [ ] Camera photo capture
- [ ] Battery status monitoring
- [ ] Location tracking
- [ ] Calendar integration
- [ ] Phone notification access

### 🚧 Phase 3: Advanced Controls (TODO)
- [ ] Audio file playback
- [ ] LED color control
- [ ] Dashboard layouts
- [ ] RTMP streaming

## 🚀 Use Case Examples

### 1. Voice Keyboard for Coding
```
User → speaks code
Glasses → transcribes to text
LLM → receives via glasses.get_transcriptions
LLM → processes, generates response
LLM → sends back via glasses.speak or glasses.display_text
```

### 2. Hands-Free Claude Conversation
```
User: [taps button] "What's the weather today?"
Glasses: [captures transcription]
LLM: [gets via MCP] → processes → responds
Glasses: [speaks response via TTS]
```

### 3. Live Thinking Process Display
```
LLM: thinking step 1... → glasses.display_text("Analyzing...")
LLM: thinking step 2... → glasses.display_text("Searching...")
LLM: final answer → glasses.speak("The answer is...")
```

### 4. Visual Q&A
```
User: "What am I looking at?"
Glasses: [takes photo via glasses.take_photo]
LLM: [receives photo] → vision analysis
LLM: → glasses.speak("You're looking at a coffee mug")
```

### 5. Context-Aware Assistance
```
LLM: [requests glasses.get_location]
LLM: [requests glasses.get_calendar_events]
LLM: [decides] → glasses.display_text("Meeting in 10 min, 5 min walk")
```
### Media & Entertainment
- Audio playback control
- Photo capture triggers
- Live streaming to glasses

## 📚 Resources

- [MentraOS Docs](https://docs.mentra.glass)
- [SDK GitHub](https://github.com/Mentra-Community/MentraOS-Cloud-Example-App)
- [Console](https://console.mentra.glass)
- [Discord Community](https://discord.gg/5ukNvkEAqT)
